import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { HourlyForecastSchema, HourlyForecastType } from "@/schema/weather";

export default function useHourlyForecast(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.hourlyForecast(latitude, longitude),
    fetcher,
  );

  const parsedData = useMemo(() => {
    if (!data) return undefined;
    try {
      const camelCaseData = toCamelCase(data);
      return HourlyForecastSchema.parse(camelCaseData);
    } catch (e) {
      console.error("HourlyWeather Schema Validation Failed:", e);
      return undefined;
    }
  }, [data]);

  return { data: parsedData, isLoading, error };
}
