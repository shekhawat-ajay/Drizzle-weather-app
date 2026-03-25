import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { DailyForecastSchema, DailyForecastType } from "@/schema/weather";

export default function useDailyForecast(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.dailyForecast(latitude, longitude),
    fetcher
  );

  let parsedData: DailyForecastType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = DailyForecastSchema.parse(camelCaseData);
    } catch (e) {
      console.error("DailyForecast Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
