import { useMemo } from "react";
import useCombinedForecast from "@/hooks/weather/useCombinedForecast";

export default function useCurrentWeather(latitude: number, longitude: number) {
  const { data, isLoading, error, mutate } = useCombinedForecast(latitude, longitude);

  const parsedData = useMemo(() => {
    if (!data?.current || !data?.currentUnits) return undefined;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      generationtimeMs: data.generationtimeMs,
      utcOffsetSeconds: data.utcOffsetSeconds,
      timezone: data.timezone,
      timezoneAbbreviation: data.timezoneAbbreviation,
      elevation: data.elevation,
      currentUnits: data.currentUnits,
      current: data.current,
    };
  }, [data]);

  return { data: parsedData, isLoading, error, mutate };
}
