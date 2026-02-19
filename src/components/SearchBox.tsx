import {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import { LocationContext } from "../App";
import useLocation from "@/hooks/useLocation";
import { MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";

const DEBOUNCE_DELAY = 375;

export default function SearchBox() {
  const [inputQuery, setInputQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ResultType[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { setLocation } = useContext(LocationContext)!;
  const inputRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  const { data, isLoading, error } = useLocation(debouncedQuery);

  //handel form submission
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current); // Clear any pending debounce
    }
    const trimmedQuery = inputQuery.trimEnd();
    if (trimmedQuery.length >= 2) {
      setDebouncedQuery(trimmedQuery); // Trigger search immediately
      if (results?.[0]) {
        setLocation(results[0]);
      }
      setResults([]);
      setInputQuery("");
      setShowDropdown(false);
    } else {
      setResults([]); // Clear results if search is submitted with invalid input
      setDebouncedQuery("");
      setShowDropdown(false);
    }
  };

  // handle debouncing of input query
  useEffect(() => {
    const trimmedQuery = inputQuery.trimEnd();
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

  // handle selected location validation
  const isLocationValid = (latitude: number, longitude: number): boolean => {
    const isLatitudeValid =
      typeof latitude === "number" && !Number.isInteger(latitude);
    const isLongitudeValid =
      typeof longitude === "number" && !Number.isInteger(longitude);

    return isLatitudeValid && isLongitudeValid;
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
    if (inputQuery.trimEnd().length >= 2) {
      setShowDropdown(true);
    }
  }, [inputQuery]);

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
            className="placeholder:text-base-content/30 w-full border-none bg-transparent text-sm outline-none"
          />
        </label>
      </form>
      {showDropdown && results.length > 0 && (
        <div
          className={cn(
            "border-base-content/10 bg-base-300 absolute top-full z-50 mt-2 max-h-60 w-full max-w-lg overflow-hidden rounded-lg border",
            results.length >= 4 && "scrollbar-thin overflow-y-auto",
          )}
        >
          <ul className="divide-base-content/5 divide-y">
            {results.map((location) => (
              <li
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className="hover:bg-base-200 cursor-pointer transition-colors duration-150"
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
      )}
      {error && (
        <div className="absolute top-full z-50 mt-2 text-center">
          <p className="text-error text-sm">Something went wrong!</p>
        </div>
      )}
      {showDropdown &&
        !isLoading &&
        !error &&
        debouncedQuery.length >= 2 &&
        data &&
        results.length === 0 && (
          <div className="border-base-content/10 bg-base-300 absolute top-full z-50 mt-2 w-full max-w-lg rounded-lg border">
            <div className="flex items-center gap-3 px-4 py-4">
              <MapPinOff className="text-base-content/40 size-4 shrink-0" />
              <p className="text-base-content/50 text-sm">
                No cities found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
