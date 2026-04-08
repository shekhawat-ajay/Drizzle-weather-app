import { useContext } from "react";
import { Outlet } from "react-router";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useAstronomy from "@/hooks/astronomy/useAstronomy";
import useCelestial from "@/hooks/astronomy/useCelestial";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import { getNowAsUTC, parseAsUTC } from "@/utils/formatters";

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

  const tz = location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data: hourlyData } = useHourlyForecast(
    location.latitude,
    location.longitude
  );

  let cloudCover: number | null = null;
  const hourly = hourlyData?.hourly;
  if (hourly?.time && hourly?.cloudCover) {
    const nowMs = getNowAsUTC(tz);
    let curIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
       const ms = parseAsUTC(hourly.time[i]!).getTime();
       if (ms <= nowMs) curIdx = i;
    }
    cloudCover = hourly.cloudCover[curIdx] ?? null;
  }

  const astronomyData = useAstronomy(
    location.latitude,
    location.longitude,
    location.timezone,
    cloudCover
  );

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
