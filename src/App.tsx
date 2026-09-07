import { use, useEffect, useState, lazy, Suspense, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router";
import { ThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { UnitsProvider, useUnits } from "@/context/UnitsContext";
import SearchBox from "@/components/SearchBox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import FavoritesBar from "@/components/FavoritesBar";
import PushAlertsToggle from "@/components/PushAlertsToggle";
import { ResultType } from "@/schema/location";
import { LocationContext } from "@/context/LocationContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

const WeatherPage = lazy(() => import("@/pages/WeatherPage.tsx"));
const AstronomyPage = lazy(() => import("@/pages/AstronomyPage.tsx"));
const OverviewPage = lazy(() => import("@/pages/OverviewPage.tsx"));
const SunPage = lazy(() => import("@/pages/SunPage.tsx"));
const MoonPage = lazy(() => import("@/pages/MoonPage.tsx"));
const PlanetPage = lazy(() => import("@/pages/PlanetPage.tsx"));
const ISSPage = lazy(() => import("@/pages/ISSPage.tsx"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage.tsx"));
const ComparePage = lazy(() => import("@/pages/ComparePage.tsx"));

function PageFallback() {
  return (
    <div className="grid grid-cols-12 gap-4 animate-pulse">
      {/* Hero */}
      <div className="col-span-12 h-32 rounded-xl skeleton opacity-60" />
      {/* Sub-nav */}
      <div className="col-span-12 h-10 rounded-lg skeleton opacity-40" />
      {/* Content cards */}
      <div className="col-span-12 h-64 rounded-xl skeleton opacity-50" />
      <div className="col-span-12 md:col-span-6 h-48 rounded-xl skeleton opacity-50" />
      <div className="col-span-12 md:col-span-6 h-48 rounded-xl skeleton opacity-50" />
    </div>
  );
}

function UnitsToggle({ hidden }: { hidden?: boolean }) {
  const { units, setUnits } = useUnits();
  const isImperial = units === "imperial";

  if (hidden) {
    return null;
  }

  return (
    <label
      className="bg-base-200 border-base-content/10 flex items-center gap-1.5 rounded-lg border px-2.5 py-2 cursor-pointer select-none"
      title="Toggle °C/°F — also switches wind (km/h/mph) and precip (mm/in)"
    >
      <span
        className={`text-[11px] font-medium transition-colors duration-200 ${
          !isImperial ? "text-primary" : "text-base-content/40"
        }`}
      >
        °C
      </span>
      <input
        type="checkbox"
        className="toggle toggle-sm toggle-primary cursor-pointer"
        checked={isImperial}
        onChange={() => setUnits(isImperial ? "metric" : "imperial")}
        aria-label="Toggle temperature units (also switches wind and precipitation units)"
      />
      <span
        className={`text-[11px] font-medium transition-colors duration-200 ${
          isImperial ? "text-primary" : "text-base-content/40"
        }`}
      >
        °F
      </span>
    </label>
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
      <span className="text-base-content/70 font-mono text-xs tabular-nums">
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
  const { location } = use(LocationContext)!;
  const isWeather = theme === "weather";

  return (
    <div className="mt-6 mb-6 flex flex-col items-center gap-3">
      <div className="w-full max-w-lg">
        <SearchBox />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 min-h-[36px]">
        <LocationClock timezone={location.timezone ?? "UTC"} />
        <UnitsToggle hidden={!isWeather} />
        <PushAlertsToggle />
      </div>
    </div>
  );
}

const STORAGE_KEY_LOCATION = "drizzle-location";

const DEFAULT_LOCATION: ResultType = {
  id: 1273294,
  name: "Doodwa",
  latitude: 28.45860854303801,
  longitude: 75.73679191792027,
  admin1: "Rajasthan",
  country: "India",
  countryCode: "IN",
  timezone: "Asia/Kolkata",
};

function getStoredLocation(): ResultType {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (raw) {
      const parsed = JSON.parse(raw) as ResultType;
      if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number" && parsed.name) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCATION;
}

function App() {
  const [location, setLocation] = useState<ResultType>(() => getStoredLocation());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(location));
    } catch {
      // ignore
    }
  }, [location]);

  const locationValue = useMemo(() => ({ location, setLocation }), [location]);

  return (
    <LocationContext.Provider value={locationValue}>
      <FavoritesProvider>
        <ThemeProvider>
          <UnitsProvider>
            <main className="animate-fade-in mx-auto max-w-4xl px-4 py-6">
              <Header />
              <SearchRow />
              <FavoritesBar />
              <ErrorBoundary>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<WeatherPage />} />
                    <Route path="/compare" element={<ComparePage />} />
                    <Route path="/astronomy" element={<AstronomyPage />}>
                      <Route index element={<Navigate to="overview" replace />} />
                      <Route path="overview" element={<OverviewPage />} />
                      <Route path="sun" element={<SunPage />} />
                      <Route path="moon" element={<MoonPage />} />
                      <Route path="iss" element={<ISSPage />} />
                      <Route path=":planet" element={<PlanetPage />} />
                    </Route>
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
              <Footer />
            </main>
          </UnitsProvider>
        </ThemeProvider>
      </FavoritesProvider>
    </LocationContext.Provider>
  );
}

export default App;
