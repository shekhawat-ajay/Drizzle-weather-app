import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";

export interface ISSData {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  timestamp: number;
}

const ISS_REFRESH_INTERVAL = 5_000;
const ISS_DEDUP_INTERVAL = 4_000;

export default function useISS() {
  const { data, isLoading, error } = useSWR<ISSData>(
    apiRoutes.iss(),
    fetcher,
    {
      refreshInterval: ISS_REFRESH_INTERVAL,
      dedupingInterval: ISS_DEDUP_INTERVAL,
    },
  );

  return { data: data ?? null, isLoading, error };
}

export function useISSTrajectory() {
  // Generate 10 timestamps for the next 100 minutes (10 min apart)
  // Round to the nearest minute (60s) to keep SWR cache key stable across re-renders
  const roundedNow = Math.floor(Date.now() / 60000) * 60;
  const timestamps = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => roundedNow + (i + 1) * 600);
  }, [roundedNow]);
  
  const { data, isLoading, error } = useSWR<ISSData[]>(
    apiRoutes.issPositions(timestamps),
    fetcher,
    {
      refreshInterval: 60000, // Update trajectory once a minute
      revalidateOnFocus: false,
    }
  );

  return { points: data ?? [], isLoading, error };
}

