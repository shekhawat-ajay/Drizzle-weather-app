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
  const { data, isLoading, error, mutate } = useSWR(
    apiRoutes.aqi(latitude, longitude),
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 10_000,
      focusThrottleInterval: 5_000,
      refreshInterval: 10 * 60_000,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      keepPreviousData: true,
    },
  );

  const { naqiResult, calcError, raw } = useMemo(() => {
    if (!data) return { naqiResult: undefined, calcError: undefined, raw: undefined as AirQualityType | undefined };
    try {
      const camelCaseData = toCamelCase(data);
      const parsedData: AirQualityType = AirQualitySchema.parse(camelCaseData);
      const result = calculateNAQI(parsedData as unknown as AirQualityHourlyData);
      return { naqiResult: result, calcError: undefined, raw: parsedData };
    } catch (e) {
      console.error("NAQI Calculation Failed:", e);
      return {
        naqiResult: undefined,
        calcError: e instanceof Error ? e.message : "Unknown error computing NAQI",
        raw: undefined,
      };
    }
  }, [data]);

  return {
    data: naqiResult,
    raw,
    isLoading,
    error: (error as Error | undefined) || (calcError ? new Error(calcError) : undefined),
    mutate,
  };
}
