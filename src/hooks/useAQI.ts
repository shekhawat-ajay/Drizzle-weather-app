import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { AirQualitySchema, AirQualityType } from "@/schema/weather";
import { calculateNAQI } from "@/utils/naqi/calculateNAQI";
import type { NAQIResult } from "@/utils/naqi/types";
import type { AirQualityHourlyData } from "@/utils/naqi/types";

export default function useAQI(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.aqi(latitude, longitude),
    fetcher,
  );

  let naqiResult: NAQIResult | undefined = undefined;
  let calcError: string | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      const parsedData: AirQualityType = AirQualitySchema.parse(camelCaseData);
      naqiResult = calculateNAQI(parsedData as unknown as AirQualityHourlyData);
    } catch (e) {
      console.error("NAQI Calculation Failed:", e);
      calcError =
        e instanceof Error ? e.message : "Unknown error computing NAQI";
    }
  }

  return {
    data: naqiResult,
    isLoading,
    error: error || calcError,
  };
}
