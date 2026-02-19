import { useMemo } from "react";
import {
  calcSunData,
  calcMoonData,
  calcNextMoonPhases,
  calcNextSeason,
  calcPlanetData,
  getStargazingQuality,
  type SunData,
  type MoonData,
  type PlanetData,
  type NextMoonPhaseData,
  type SeasonData,
} from "@/utils/astronomy";

export interface AstronomyData {
  sun: SunData;
  moon: MoonData;
  planets: PlanetData[];
  nextMoonPhases: NextMoonPhaseData[];
  nextSeason: SeasonData;
  stargazing: { label: string; description: string };
}

export default function useAstronomy(
  latitude: number,
  longitude: number,
): AstronomyData {
  return useMemo(() => {
    const now = new Date();

    // Set "today" at midnight local time to get today's events
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const sun = calcSunData(latitude, longitude, todayStart);
    const moon = calcMoonData(latitude, longitude, todayStart);
    const planets = calcPlanetData(latitude, longitude, todayStart);
    const nextMoonPhases = calcNextMoonPhases(now, 4);
    const nextSeason = calcNextSeason(now);
    const stargazing = getStargazingQuality(
      moon.illuminationFraction,
      sun.sunset,
      now,
    );

    return { sun, moon, planets, nextMoonPhases, nextSeason, stargazing };
  }, [latitude, longitude]);
}
