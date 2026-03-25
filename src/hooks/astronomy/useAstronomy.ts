import { useMemo, useState, useEffect, useCallback } from "react";
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
  calcUpcomingEclipses,
} from "@/utils/astronomy";

import type { AstronomyData } from "@/types/astronomy";

/* ─── Refresh intervals ─── */
const POSITION_REFRESH_MS = 5 * 60_000; // 5 minutes — positions move visibly

export default function useAstronomy(
  latitude: number,
  longitude: number,
  timezone?: string,
  cloudCover?: number | null,
): AstronomyData {
  // ── Timezone & midnight (stable for the session) ──
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const todayStart = useMemo(() => {
    const now = new Date();
    const targetDateStr = now.toLocaleString("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const [monthStr, dayStr, yearStr] = targetDateStr.split("/");
    const month = parseInt(monthStr ?? (now.getMonth() + 1).toString());
    const day = parseInt(dayStr ?? now.getDate().toString());
    const year = parseInt(yearStr ?? now.getFullYear().toString());

    const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
    const localMidnightInTargetTz = new Date(
      localMidnight.toLocaleString("en-US", { timeZone: tz }),
    );
    const tzDiffMs =
      localMidnightInTargetTz.getTime() - localMidnight.getTime();

    return new Date(localMidnight.getTime() - tzDiffMs);
  }, [latitude, longitude, tz]);

  // ── Tier 0: STATIC data (compute once per location) ──
  const staticData = useMemo(() => {
    const now = new Date();
    const sun = calcSunData(latitude, longitude, todayStart);
    const moon = calcMoonData(latitude, longitude, todayStart);
    const nextMoonPhases = calcNextMoonPhases(now, 4);
    const nextSeason = calcNextSeason(now);
    const stargazing = getStargazingQuality(
      moon.illuminationFraction,
      sun.sunset,
      now,
      cloudCover
    );
    const upcomingEclipses = calcUpcomingEclipses(now);

    return {
      sun,
      moon,
      nextMoonPhases,
      nextSeason,
      stargazing,
      upcomingEclipses,
    };
  }, [latitude, longitude, todayStart, cloudCover]);

  // ── Tier 2: POSITION data (refreshes every 5 min) ──
  const computePositions = useCallback(() => {
    const now = new Date();
    const sunPosition = calcSunPosition(
      latitude,
      longitude,
      now,
      staticData.sun.sunrise,
      staticData.sun.sunset,
    );
    const moonPosition = calcMoonPosition(latitude, longitude, now);
    const planets = calcPlanetData(latitude, longitude, todayStart, now);
    const nextRiseSet = calcNextRiseSet(latitude, longitude, now);

    return { sunPosition, moonPosition, planets, nextRiseSet };
  }, [
    latitude,
    longitude,
    todayStart,
    staticData.sun.sunrise,
    staticData.sun.sunset,
  ]);

  const [positions, setPositions] = useState(computePositions);

  useEffect(() => {
    // Reset on location change
    setPositions(computePositions());

    const id = setInterval(() => {
      setPositions(computePositions());
    }, POSITION_REFRESH_MS);

    return () => clearInterval(id);
  }, [computePositions]);

  // ── Combine all tiers ──
  return useMemo(
    () => ({
      ...staticData,
      ...positions,
    }),
    [staticData, positions],
  );
}
