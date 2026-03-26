import { useContext } from "react";
import { Outlet } from "react-router";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useAstronomy from "@/hooks/astronomy/useAstronomy";
import useCelestial from "@/hooks/astronomy/useCelestial";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";

import AstroHero from "@/components/astronomy/AstroHero";
import CelestialNav from "@/components/astronomy/CelestialNav";
import type { AstronomyData } from "@/types/astronomy";
import type { CelestialStatus } from "@/types/celestial";

export interface AstronomyOutletContext {
  location: ResultType;
  tz: string;
  cloudCover: number | null;
  astronomyData: AstronomyData;
  celestialData: CelestialStatus[];
}

export default function AstronomyPage() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };

  const { data: currentW } = useCurrentWeather(
    location.latitude,
    location.longitude
  );
  const cloudCover = currentW?.current?.cloudCover ?? null;

  const astronomyData = useAstronomy(
    location.latitude,
    location.longitude,
    location.timezone
  );

  const tz = location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const celestialData = useCelestial(location.latitude, location.longitude);

  const contextValue: AstronomyOutletContext = {
    location,
    tz,
    cloudCover,
    astronomyData,
    celestialData,
  };

  return (
    <div className="space-y-4">
      <AstroHero />

      {/* Location context */}
      <div className="flex items-center gap-2 px-1">
        <div className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-violet-400" />
        <p className="text-base-content/40 text-xs">
          Showing data for{" "}
          <span className="text-base-content/70 font-medium">
            {location.name}, {location.country}
          </span>
        </p>
      </div>

      {/* ── Tabs Navigation ── */}
      <CelestialNav />

      {/* ── Subpage Content ── */}
      <div className="animate-fade-in">
        <Outlet context={contextValue} />
      </div>
    </div>
  );
}
