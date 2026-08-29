import { useMemo } from "react";
import useCombinedForecast from "@/hooks/weather/useCombinedForecast";

export default function useHourlyForecast(latitude: number, longitude: number) {
  const { data, isLoading, error, mutate } = useCombinedForecast(latitude, longitude);

  const parsedData = useMemo(() => {
    if (!data?.minutely15 || !data?.minutely15Units) return undefined;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      generationtimeMs: data.generationtimeMs,
      utcOffsetSeconds: data.utcOffsetSeconds,
      timezone: data.timezone,
      timezoneAbbreviation: data.timezoneAbbreviation,
      elevation: data.elevation,
      minutely15Units: data.minutely15Units,
      minutely15: data.minutely15,
      hourlyUnits: data.hourlyUnits,
      hourly: data.hourly,
    };
  }, [data]);

  return { data: parsedData, isLoading, error, mutate };
}
