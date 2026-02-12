import { useContext, useEffect, useRef, useState, useCallback, FormEvent, ChangeEvent } from "react";
import { LocationContext } from "../App";
import useLocation from "@/hooks/useLocation";
import { MapPin } from "lucide-react";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";

const DEBOUNCE_DELAY = 375;

export default function SearchBox() {
  const [inputQuery, setInputQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ResultType[]>([]);
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
    if (inputQuery.length >= 2) {
      setDebouncedQuery(inputQuery); // Trigger search immediately
      if (results?.[0]) {
        setLocation(results[0]);
      }
      setResults([]);
      setInputQuery("");
    } else {
      setResults([]); // Clear results if search is submitted with invalid input
      setDebouncedQuery("");
    }
  };

  // handle debouncing of input query
  useEffect(() => {
    if (inputQuery.length < 2) {
      setDebouncedQuery("");
      setResults([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(inputQuery);
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
    },
    [setLocation],
  );

  //Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setResults([]);
        setDebouncedQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Also close on blur (covers cases where wrapper stretches full width)
  const handleBlur = useCallback(() => {
    // Small delay so that click on a result item fires before we clear
    setTimeout(() => {
      if (inputRef.current && !inputRef.current.contains(document.activeElement)) {
        setResults([]);
        setDebouncedQuery("");
      }
    }, 150);
  }, []);


  return (
    <div
      className="relative flex flex-col items-center justify-center"
      ref={inputRef}
      onBlur={handleBlur}
    >
      <form onSubmit={handleSearch} className="w-full flex justify-center">
        <label className="flex w-full max-w-lg items-center gap-2 rounded-lg border border-base-content/10 bg-base-200 px-4 py-2.5 transition-all duration-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          {isLoading ? (
            <span className="loading loading-spinner loading-sm text-base-content/40"></span>
          ) : (
            <svg
              className="h-4 w-4 text-base-content/40"
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
            className="w-full bg-transparent text-sm outline-none border-none placeholder:text-base-content/30"
          />
        </label>
      </form>
      {results.length > 0 && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 max-h-60 w-full max-w-lg overflow-hidden rounded-lg border border-base-content/10 bg-base-300",
            results.length >= 4 && "scrollbar-thin overflow-y-auto",
          )}
        >
          <ul className="divide-y divide-base-content/5">
            {results.map((location) => (
              <li
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className="cursor-pointer transition-colors duration-150 hover:bg-base-200"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="size-4 text-base-content/40" />
                  <div>
                    <p className="text-sm font-medium text-base-content">
                      {location.name}
                    </p>
                    <p className="text-xs text-base-content/50">
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
          <p className="text-sm text-error">Something went wrong!</p>
        </div>
      )}
    </div>
  );
}
