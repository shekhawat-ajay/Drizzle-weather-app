import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { CombinedForecastSchema, CombinedForecastType } from "@/schema/weather";

export default function useCombinedForecast(latitude: number, longitude: number) {
  const { data, isLoading, error, mutate } = useSWR(
    apiRoutes.combinedForecast(latitude, longitude),
    fetcher,
    {
      // Core SWR live behavior: refetch when tab regains focus or network reconnects,
      // plus 5-min background polling so data stays fresh without switching tabs.
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
      dedupingInterval: 10_000,
      focusThrottleInterval: 5_000,
      refreshInterval: 5 * 60_000,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      keepPreviousData: true,
    },
  );

  const { parsedData, parseError } = useMemo(() => {
    if (!data) return { parsedData: undefined, parseError: undefined as string | undefined };
    try {
      const camelCaseData = toCamelCase(data);
      return { parsedData: CombinedForecastSchema.parse(camelCaseData) as CombinedForecastType, parseError: undefined };
    } catch (e) {
      console.error("CombinedForecast Schema Validation Failed:", e);
      return { parsedData: undefined, parseError: e instanceof Error ? e.message : "Invalid forecast data" };
    }
  }, [data]);

  const combinedError = (error as Error | undefined) ?? (parseError ? new Error(parseError) : undefined);

  return { data: parsedData, isLoading, error: combinedError, mutate };
}
