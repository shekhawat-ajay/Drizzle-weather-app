import { useMemo } from "react";
import {
  calcSunData,
  calcSunPosition,
  calcMoonData,
  calcMoonPosition,
  calcNextMoonPhases,
  calcNextSeason,
  calcPlanetData,
  calcNextRiseSet,
  getStargazingQuality,
} from "@/utils/astronomy";

import type { AstronomyData } from "@/types/astronomy";

export default function useAstronomy(
  latitude: number,
  longitude: number,
  timezone?: string,
): AstronomyData {
  return useMemo(() => {
    const now = new Date();

    // If no timezone is provided, default to the local machine's timezone
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 1. Get the current date/time in the target timezone as a string
    const targetDateStr = now.toLocaleString("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // targetDateStr format: "MM/DD/YYYY"

    const [monthStr, dayStr, yearStr] = targetDateStr.split("/");
    // Fallbacks just in case the parsing breaks somehow
    const month = parseInt(monthStr ?? (now.getMonth() + 1).toString());
    const day = parseInt(dayStr ?? now.getDate().toString());
    const year = parseInt(yearStr ?? now.getFullYear().toString());

    // 2. We want to find the exact UTC timestamp for 00:00:00 in the target timezone
    // for this specific year/month/day.
    // The most reliable way is to parse an ISO string with the target timezone's offset.
    // To get the target timezone's offset on this specific day, we can format
    // a local midnight Date using Intl and compare UTC times.

    // Create a local midnight date for that year/month/day
    // Note: month is 1-indexed from the string, but Date uses 0-indexed months
    const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);

    // Format this local midnight back into a string as if it's in the target timezone
    const localMidnightInTargetTz = new Date(
      localMidnight.toLocaleString("en-US", { timeZone: tz }),
    );

    // The difference in milliseconds gives us the exact offset we need to shift our local midnight by
    const tzDiffMs =
      localMidnightInTargetTz.getTime() - localMidnight.getTime();

    // 3. Shift local midnight by the offset difference to get true target midnight in UTC
    const todayStart = new Date(localMidnight.getTime() - tzDiffMs);

    const sun = calcSunData(latitude, longitude, todayStart);
    const sunPosition = calcSunPosition(
      latitude,
      longitude,
      now,
      sun.sunrise,
      sun.sunset,
    );
    const moon = calcMoonData(latitude, longitude, todayStart);
    const moonPosition = calcMoonPosition(
      latitude,
      longitude,
      now,
      moon.moonrise,
      moon.moonset,
    );
    const planets = calcPlanetData(latitude, longitude, todayStart);
    const nextMoonPhases = calcNextMoonPhases(now, 4);
    const nextSeason = calcNextSeason(now);
    const nextRiseSet = calcNextRiseSet(latitude, longitude, now);
    const stargazing = getStargazingQuality(
      moon.illuminationFraction,
      sun.sunset,
      now,
    );

    return {
      sun,
      sunPosition,
      moon,
      moonPosition,
      planets,
      nextMoonPhases,
      nextSeason,
      nextRiseSet,
      stargazing,
    };
  }, [latitude, longitude]);
}
