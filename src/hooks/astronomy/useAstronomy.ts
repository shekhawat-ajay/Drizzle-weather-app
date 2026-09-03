import { useMemo, useState, useEffect, useCallback } from "react";
import {
  calcSunData,
  calcSunPosition,
  calcMoonData,
  calcMoonPosition,
  calcNextSeason,
  calcPlanetData,
  calcNextRiseSet,
  getStargazingQuality,
  calcUpcomingEclipses,
  getFullMoonCycle,
  getNextDistanceExtremes,
  getNextLunarEclipse,
  getNextSupermoon,
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
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "01";
    const year = parseInt(get("year"), 10);
    const month = parseInt(get("month"), 10);
    const day = parseInt(get("day"), 10);

    const localMidnight = new Date(year, month - 1, day, 0, 0, 0, 0);
    const localMidnightInTargetTz = new Date(
      localMidnight.toLocaleString("en-US", { timeZone: tz }),
    );
    const tzDiffMs =
      localMidnightInTargetTz.getTime() - localMidnight.getTime();

    return new Date(localMidnight.getTime() - tzDiffMs);
  }, [tz]);

  // ── Tier 0: STATIC data (compute once per location) ──
  // NOTE: stargazing is computed in the combined tier below so it can use
  // live sun/moon altitudes — the old static path disagreed with NightSky.
  const staticData = useMemo(() => {
    const now = new Date();
    const sun = calcSunData(latitude, longitude, todayStart);
    const moon = calcMoonData(latitude, longitude, todayStart);
    const distanceExtremes = getNextDistanceExtremes(todayStart);
    const lunarEclipseInfo = getNextLunarEclipse(todayStart);
    const supermoonInfo = getNextSupermoon(todayStart);
    const nextSeason = calcNextSeason(now);
    const upcomingEclipses = calcUpcomingEclipses(latitude, longitude, now);

    return {
      sun,
      moon,
      distanceExtremes,
      lunarEclipseInfo,
      supermoonInfo,
      nextSeason,
      upcomingEclipses,
    };
  }, [latitude, longitude, todayStart]);

  // ── Tier 2: POSITION data (refreshes every 5 min) ──
  const computePositions = useCallback(() => {
    const now = new Date();
    const sunPosition = calcSunPosition(
      latitude,
      longitude,
      now,
    );
    const moonPosition = calcMoonPosition(latitude, longitude, now);
    const planets = calcPlanetData(latitude, longitude, todayStart, now);
    const nextRiseSet = calcNextRiseSet(latitude, longitude, now);
    const fullMoonCycle = getFullMoonCycle(now);

    return { sunPosition, moonPosition, planets, nextRiseSet, fullMoonCycle };
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

  // ── Combine all tiers + unified stargazing (uses live altitudes) ──
  return useMemo(() => {
    const now = new Date();
    const stargazing = getStargazingQuality(
      staticData.moon.illuminationFraction,
      staticData.sun.sunset,
      now,
      cloudCover,
      positions.moonPosition.altitude,
      positions.sunPosition.altitude,
    );
    return {
      ...staticData,
      ...positions,
      stargazing,
    };
  }, [staticData, positions, cloudCover]);
}
