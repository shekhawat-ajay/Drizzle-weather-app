import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { LocationSchema, LocationType } from "@/schema/location";

export default function useLocation(query: string) {
  const { data, isLoading, error } = useSWR(
    !query || query.trim().length < 2 ? null : apiRoutes.location(query.trim()),
    fetcher,
  );

  const parsedData = useMemo<LocationType | undefined>(() => {
    if (!data) return undefined;
    try {
      const camelCaseData = toCamelCase(data);
      return LocationSchema.parse(camelCaseData);
    } catch (e) {
      console.error("Location Schema Validation Failed:", e);
      return undefined;
    }
  }, [data]);

  return { data: parsedData, isLoading, error };
}
