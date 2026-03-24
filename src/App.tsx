import { createContext, useContext, useEffect, useState } from "react";
import { Routes, Route } from "react-router";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { UnitsProvider, useUnits } from "@/context/UnitsContext";
import SearchBox from "@/components/SearchBox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WeatherPage from "@/pages/WeatherPage";
import AstronomyPage from "@/pages/AstronomyPage";
import { ResultType } from "@/schema/location";

import type { LocationContextType } from "@/types/context";

const LocationContext = createContext<LocationContextType | null>(null);

function UnitsToggle() {
  const { units, setUnits } = useUnits();
  const isImperial = units === "imperial";

  return (
    <div className="bg-base-200 border-base-content/10 flex items-center gap-1 rounded-lg border px-2 py-2">
      <span
        className={`text-[11px] font-medium transition-colors duration-200 ${
          !isImperial ? "text-sky-400" : "text-base-content/40"
        }`}
      >
        °C
      </span>
      <input
        type="checkbox"
        className="toggle toggle-xs toggle-primary cursor-pointer"
        checked={isImperial}
        onChange={() => setUnits(isImperial ? "metric" : "imperial")}
        aria-label="Toggle temperature units"
      />
      <span
        className={`text-[11px] font-medium transition-colors duration-200 ${
          isImperial ? "text-sky-400" : "text-base-content/40"
        }`}
      >
        °F
      </span>
    </div>
  );
}

function LocationClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState(() => formatClock(timezone));

  useEffect(() => {
    setTime(formatClock(timezone));
    const id = setInterval(() => setTime(formatClock(timezone)), 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <div className="bg-base-200 border-base-content/10 flex items-center rounded-lg border px-2.5 py-2">
      <span className="font-mono text-xs tabular-nums text-base-content/70">
        {time}
      </span>
    </div>
  );
}

function formatClock(tz: string): string {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function SearchRow() {
  const { theme } = useAppTheme();
  const { location } = useContext(LocationContext)!;
  const isWeather = theme === "weather";

  return (
    <div className="mt-6 mb-6 flex flex-col items-center gap-3">
      <div className="w-full max-w-lg">
        <SearchBox />
      </div>
      <div className="flex items-center gap-2">
        <LocationClock timezone={location.timezone ?? "UTC"} />
        {isWeather ? <UnitsToggle /> : null}
      </div>
    </div>
  );
}

function App() {
  const [location, setLocation] = useState<ResultType>({
    id: 1273294,
    name: "Pilāni",
    latitude: 28.36725,
    longitude: 75.60352,
    admin1: "Rajasthan",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
  });

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      <ThemeProvider>
        <UnitsProvider>
        <main className="animate-fade-in mx-auto max-w-4xl px-4 py-6">
          <Header />
          <SearchRow />
          <Routes>
            <Route path="/" element={<WeatherPage />} />
            <Route path="/astronomy" element={<AstronomyPage />} />
          </Routes>
          <Footer />
        </main>
        </UnitsProvider>
      </ThemeProvider>
    </LocationContext.Provider>
  );
}

export default App;
export { LocationContext };
