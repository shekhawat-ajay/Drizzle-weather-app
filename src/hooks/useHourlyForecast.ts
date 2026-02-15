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

  let parsedData: HourlyForecastType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = HourlyForecastSchema.parse(camelCaseData);
    } catch (e) {
      console.error("HourlyWeather Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
