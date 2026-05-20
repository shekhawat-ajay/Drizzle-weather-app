import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { CurrentWeatherSchema, CurrentWeatherType } from "@/schema/weather";

export default function useCurrentWeather(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.currentWeather(latitude, longitude),
    fetcher,
  );

  const parsedData = useMemo(() => {
    if (!data) return undefined;
    try {
      const camelCaseData = toCamelCase(data);
      return CurrentWeatherSchema.parse(camelCaseData);
    } catch (e) {
      console.error("CurrentWeather Schema Validation Failed:", e);
      return undefined;
    }
  }, [data]);

  return { data: parsedData, isLoading, error };
}
