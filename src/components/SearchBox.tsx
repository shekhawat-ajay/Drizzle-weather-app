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
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div
      className="relative flex flex-col items-center justify-center gap-2"
      ref={inputRef}
    >
      <form onSubmit={handleSearch}>
        <label className="input bg-neutral my-4 flex w-3xs items-center gap-2 border-none sm:w-md">
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <svg
              className="h-[1em] opacity-50"
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
          />
        </label>
      </form>
      {results.length > 0 && (
        <div
          className={cn(
            "bg-base-200 absolute top-full z-50 max-h-60 w-3xs rounded sm:w-md",
            results.length >= 4 && "scrollbar-thin overflow-y-auto",
          )}
        >
          <ul className="divide-y-1">
            {results.map((location) => (
              <li
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className="cursor-pointer"
              >
                <div className="flex items-start gap-2 p-2">
                  <div>
                    <MapPin />
                  </div>
                  <div className="">
                    <p className="text-sm font-medium text-white">
                      {location.name}
                    </p>
                    <p className="text-sm font-normal text-slate-500">
                      {location.admin1} {location.country}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <div className="absolute top-full z-50 text-center">
          <p className="text-sm text-red-500">Something went wrong!</p>
        </div>
      )}
    </div>
  );
}
