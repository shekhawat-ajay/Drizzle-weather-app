import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";

/**
 * Ground elevation in meters for observer-correct rise/set math.
 * Static per location — no focus/reconnect revalidation, SWR-deduped
 * so multiple callers share a single request.
 */
export default function useElevation(latitude: number, longitude: number) {
  const { data, isLoading, error } = useSWR(
    apiRoutes.elevation(latitude, longitude),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600_000,
      keepPreviousData: true,
    },
  );

  const arr = (data as { elevation?: unknown } | undefined)?.elevation;
  const elevation =
    Array.isArray(arr) && typeof arr[0] === "number" ? (arr[0] as number) : undefined;

  return { elevation, isLoading, error };
}
