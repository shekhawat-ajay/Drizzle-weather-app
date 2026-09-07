import { useMemo } from "react";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import { computeStargazingIndex, type StargazingResult } from "@/utils/astronomy";
import { getNowAsUTC, parseAsUTC } from "@/utils/formatters";

/**
 * Single source of truth for the "right now" stargazing score.
 *
 * Uses full hourly atmosphere data + live sun/moon altitudes, so the
 * Overview banner and the NightSky card always agree. Returns null while
 * hourly data loads — callers fall back to the lightweight
 * `useAstronomy` value meanwhile.
 */
export default function useStargazingIndex(
  latitude: number,
  longitude: number,
  timezone: string | undefined,
  moonIllumination: number,
  liveSunAlt: number | null | undefined,
  liveMoonAlt: number | null | undefined,
  sunUpNow: boolean,
): StargazingResult | null {
  const tz = timezone ?? "UTC";
  const { data } = useHourlyForecast(latitude, longitude);

  return useMemo(() => {
    const hourly = data?.hourly;
    const minutely15 = data?.minutely15;
    if (!hourly) return null;

    const nowMs = getNowAsUTC(tz);
    let idx = -1;
    for (let i = 0; i < hourly.time.length; i++) {
      if (parseAsUTC(hourly.time[i]!).getTime() <= nowMs) idx = i;
      else break;
    }
    if (idx < 0) idx = 0;

    const slotMs = parseAsUTC(hourly.time[idx]!).getTime();
    const hourMs = Math.floor(slotMs / 3600000) * 3600000;
    let visibility = 20000;
    let precipProb = 0;
    if (minutely15) {
      for (let i = 0; i < minutely15.time.length; i++) {
        const h = Math.floor(parseAsUTC(minutely15.time[i]!).getTime() / 3600000) * 3600000;
        if (h === hourMs) {
          visibility = minutely15.visibility[i]!;
          precipProb = minutely15.precipitationProbability[i]!;
        } else if (h > hourMs) break;
      }
    }

    return computeStargazingIndex({
      cloudCover: hourly.cloudCover[idx]!,
      cloudCoverLow: hourly.cloudCoverLow[idx]!,
      cloudCoverMid: hourly.cloudCoverMid[idx]!,
      cloudCoverHigh: hourly.cloudCoverHigh[idx]!,
      humidity: hourly.relativeHumidity2M[idx]!,
      pressure: hourly.surfacePressure[idx]!,
      wind: hourly.windSpeed10M[idx]!,
      visibility,
      precipProb,
      temperature: hourly.temperature2M[idx]!,
      dewPoint: hourly.dewPoint2M[idx]!,
      isDay: sunUpNow,
      moonIllumination,
      moonAltitudeDeg: liveMoonAlt ?? null,
      sunAltitudeDeg: liveSunAlt ?? null,
    });
  }, [data, tz, moonIllumination, liveSunAlt, liveMoonAlt, sunUpNow]);
}
