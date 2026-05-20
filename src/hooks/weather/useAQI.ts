import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { AirQualitySchema, AirQualityType } from "@/schema/weather";
import { calculateNAQI } from "@/utils/naqi/calculateNAQI";
import type { NAQIResult } from "@/types/naqi";
import type { AirQualityHourlyData } from "@/types/naqi";

export default function useAQI(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.aqi(latitude, longitude),
    fetcher,
  );

  const { naqiResult, calcError } = useMemo(() => {
    if (!data) return { naqiResult: undefined, calcError: undefined };
    try {
      const camelCaseData = toCamelCase(data);
      const parsedData: AirQualityType = AirQualitySchema.parse(camelCaseData);
      const result = calculateNAQI(parsedData as unknown as AirQualityHourlyData);
      return { naqiResult: result, calcError: undefined };
    } catch (e) {
      console.error("NAQI Calculation Failed:", e);
      return {
        naqiResult: undefined,
        calcError: e instanceof Error ? e.message : "Unknown error computing NAQI",
      };
    }
  }, [data]);

  return {
    data: naqiResult,
    isLoading,
    error: error || calcError,
  };
}
