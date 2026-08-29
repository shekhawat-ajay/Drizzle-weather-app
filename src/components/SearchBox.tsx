import {
  use,
  useEffect,
  useRef,
  useState,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import { LocationContext } from "@/context/LocationContext";
import useLocation from "@/hooks/useLocation";
import { MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";

const DEBOUNCE_DELAY = 375;
const RECENTS_KEY = "drizzle-recents";
const MAX_RECENTS = 5;

function getRecents(): ResultType[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (raw) return JSON.parse(raw) as ResultType[];
  } catch { /* ignore */ }
  return [];
}
function pushRecent(loc: ResultType) {
  try {
    const recents = getRecents().filter((r) => r.id !== loc.id);
    recents.unshift(loc);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS)));
  } catch { /* ignore */ }
}

export default function SearchBox() {
  const [inputQuery, setInputQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ResultType[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recents, setRecents] = useState<ResultType[]>(() => {
    try { return getRecents(); } catch { return []; }
  });
  const { setLocation } = use(LocationContext)!;
  const inputRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  const { data, isLoading, error } = useLocation(debouncedQuery);

  // Enter selects first result if available, otherwise just triggers search dropdown
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = inputQuery.trim();
    if (trimmedQuery.length < 2) {
      setResults([]);
      setDebouncedQuery("");
      setShowDropdown(false);
      return;
    }
    // If we already have results for this query, select first immediately
    if (trimmedQuery === debouncedQuery && results?.[0]) {
      handleSelectLocation(results[0]);
      return;
    }
    // Otherwise trigger search and let dropdown selection handle it — don't clear input yet
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    setDebouncedQuery(trimmedQuery);
    setShowDropdown(true);
  };

  // handle debouncing of input query
  useEffect(() => {
    const trimmedQuery = inputQuery.trim();
    if (trimmedQuery.length < 2) {
      setDebouncedQuery("");
      setResults([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
      setShowDropdown(true);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [inputQuery]);

  // handle selected location validation — range check, not integer check
  const isLocationValid = (latitude: number, longitude: number): boolean => {
    return (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  };

  //handle location results from api
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    if (data?.results) {
      const validSearchResults = data.results.filter((result: ResultType) =>
        isLocationValid(result.latitude, result.longitude),
      );
      setResults(validSearchResults);
    } else {
      setResults([]);
    }
  }, [data, debouncedQuery]);

  //handle what user type in input form
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputQuery(value);
  };

  //handle selected location by user
  const handleSelectLocation = useCallback(
    (selectedLocation: ResultType) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      pushRecent(selectedLocation);
      setRecents(getRecents());
      setLocation(selectedLocation);
      setInputQuery("");
      setDebouncedQuery("");
      setResults([]);
      setShowDropdown(false);
    },
    [setLocation],
  );

  //Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Also close on blur (covers cases where wrapper stretches full width)
  const handleBlur = useCallback(() => {
    // Small delay so that click on a result item fires before we clear
    setTimeout(() => {
      if (
        inputRef.current &&
        !inputRef.current.contains(document.activeElement)
      ) {
        setShowDropdown(false);
      }
    }, 150);
  }, []);

  // Re-show dropdown when input is focused and there's a valid query
  const handleFocus = useCallback(() => {
    if (inputQuery.trim().length >= 2 || recents.length > 0) {
      setShowDropdown(true);
    }
  }, [inputQuery, recents.length]);

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      ref={inputRef}
      onBlur={handleBlur}
    >
      <form onSubmit={handleSearch} className="flex w-full justify-center">
        <label className="border-base-content/10 bg-base-200 focus-within:border-primary/40 focus-within:ring-primary/20 flex w-full max-w-lg items-center gap-2 rounded-lg border px-4 py-2.5 transition-all duration-200 focus-within:ring-2">
          {isLoading ? (
            <span className="loading loading-spinner loading-sm text-base-content/40"></span>
          ) : (
            <svg
              className="text-base-content/40 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
          )}

          <input
            type="search"
            value={inputQuery}
            placeholder="Search city..."
            onChange={handleInputChange}
            onFocus={handleFocus}
            aria-label="Search city"
            aria-expanded={showDropdown && results.length > 0}
            aria-controls="search-results"
            aria-autocomplete="list"
            role="combobox"
            className="placeholder:text-base-content/30 w-full border-none bg-transparent text-sm outline-none"
          />
        </label>
      </form>
      {showDropdown && results.length > 0 ? (
        <div
          className={cn(
            "border-base-content/10 bg-base-300 absolute top-full z-[1001] mt-2 max-h-60 w-full max-w-lg overflow-hidden rounded-lg border shadow-xl",
            results.length >= 4 && "scrollbar-thin overflow-y-auto",
          )}
        >
          <ul id="search-results" role="listbox" className="divide-base-content/5 divide-y">
            {results.map((location) => (
              <li
                key={location.id}
                role="option"
                tabIndex={0}
                onClick={() => handleSelectLocation(location)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectLocation(location);
                  }
                }}
                className="hover:bg-base-200 focus:bg-base-200 focus:outline-none cursor-pointer transition-colors duration-150"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="text-base-content/40 size-4" />
                  <div>
                    <p className="text-base-content text-sm font-medium">
                      {location.name}
                    </p>
                    <p className="text-base-content/50 text-xs">
                      {location.admin1}, {location.country}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? (
        <div className="absolute top-full z-[1001] mt-2 text-center">
          <p className="text-error text-sm">Something went wrong!</p>
        </div>
      ) : null}
      {showDropdown &&
      !isLoading &&
      !error &&
      debouncedQuery.length >= 2 &&
      data &&
      results.length === 0 ? (
        <div className="border-base-content/10 bg-base-300 absolute top-full z-[1001] mt-2 w-full max-w-lg rounded-lg border shadow-xl">
          <div className="flex items-center gap-3 p-4">
            <MapPinOff className="text-base-content/40 size-4 shrink-0" />
            <p className="text-base-content/50 text-sm">
              No cities found for &ldquo;{debouncedQuery}&rdquo;
            </p>
          </div>
        </div>
      ) : null}
      {showDropdown && inputQuery.trim().length < 2 && !isLoading && results.length === 0 && recents.length > 0 ? (
        <div className="border-base-content/10 bg-base-300 absolute top-full z-[1001] mt-2 w-full max-w-lg rounded-lg border shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-base-content/40 text-xs font-medium uppercase tracking-wider">Recent</p>
            <button
              onClick={() => {
                try { localStorage.removeItem(RECENTS_KEY); } catch { /* ignore */ }
                setRecents([]);
              }}
              className="text-base-content/30 hover:text-base-content/60 text-xs"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recents.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectLocation(r)}
                className="inline-flex items-center gap-1.5 rounded-full bg-base-200 hover:bg-base-100 border border-base-content/5 px-3 py-1 text-xs text-base-content/70 transition-colors"
              >
                <MapPin className="size-3 opacity-60" />
                {r.name}{r.admin1 ? `, ${r.admin1}` : ""}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
