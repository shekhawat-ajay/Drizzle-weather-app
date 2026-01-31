import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/transformer";
import { TodayWeatherSchema, TodayWeatherType } from "@/schema/weather";

export default function useTodayWeather(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.todayWeather(latitude, longitude),
    fetcher,
  );

  let parsedData: TodayWeatherType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = TodayWeatherSchema.parse(camelCaseData);
    } catch (e) {
      console.error("TodayWeather Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
