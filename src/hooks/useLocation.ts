import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { toCamelCase } from "@/utils/api/transformer";
import { LocationSchema, LocationType } from "@/schema/location";

export default function useLocation(query: string) {
  const { data, isLoading, error } = useSWR(
    !query || query.trim().length < 2 ? null : apiRoutes.location(query),
    fetcher,
  );

  let parsedData: LocationType | undefined = undefined;

  if (data) {
    try {
      const camelCaseData = toCamelCase(data);
      parsedData = LocationSchema.parse(camelCaseData);
    } catch (e) {
      console.error("Location Schema Validation Failed:", e);
    }
  }

  return { data: parsedData, isLoading, error };
}
