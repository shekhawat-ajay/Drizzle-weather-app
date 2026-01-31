import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { AirQualitySchema, AirQualityType } from "@/schema/weather";

export default function useAQI(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.aqi(latitude, longitude),
    fetcher,
  );

  let parsedData: AirQualityType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = AirQualitySchema.parse(camelCaseData);
    } catch (e) {
      console.error("AQI Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
