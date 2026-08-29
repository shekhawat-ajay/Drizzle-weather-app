import { useMemo } from "react";
import useCombinedForecast from "@/hooks/weather/useCombinedForecast";

export default function useDailyForecast(latitude: number, longitude: number) {
  const { data, isLoading, error, mutate } = useCombinedForecast(latitude, longitude);

  const parsedData = useMemo(() => {
    if (!data?.daily || !data?.dailyUnits) return undefined;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      generationtimeMs: data.generationtimeMs,
      utcOffsetSeconds: data.utcOffsetSeconds,
      timezone: data.timezone,
      timezoneAbbreviation: data.timezoneAbbreviation,
      elevation: data.elevation,
      dailyUnits: data.dailyUnits,
      daily: data.daily,
    };
  }, [data]);

  return { data: parsedData, isLoading, error, mutate };
}
