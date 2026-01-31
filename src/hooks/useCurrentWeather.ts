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

  let parsedData: CurrentWeatherType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = CurrentWeatherSchema.parse(camelCaseData);
    } catch (e) {
      console.error("CurrentWeather Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
