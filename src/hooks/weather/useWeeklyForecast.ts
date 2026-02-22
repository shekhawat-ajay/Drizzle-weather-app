import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { WeeklyForecastSchema, WeeklyForecastType } from "@/schema/weather";

export default function useWeeklyForecast(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.weeklyForecast(latitude, longitude),
    fetcher,
  );

  let parsedData: WeeklyForecastType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = WeeklyForecastSchema.parse(camelCaseData);
    } catch (e) {
      console.error("WeeklyForecast Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
