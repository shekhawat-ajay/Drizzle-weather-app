import { LocationContext } from "@/context/LocationContext";
import useAQI from "@/hooks/weather/useAQI";
import { useContext } from "react";
import {
  getNaqiCategoryStyle,
  getEuAqiCategory,
  getUsAqiCategory,
} from "@/utils/maps/aqiMap";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";
import ErrorRetry from "@/components/ErrorRetry";

export default function AirQuality() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, isLoading, error, mutate } = useAQI(
    location.latitude,
    location.longitude,
  );

  const categoryStyle = data
    ? getNaqiCategoryStyle(data.category)
    : getNaqiCategoryStyle("");

  const pollutantList = data ? Object.values(data.pollutants) : [];

  const euAqi = data?.europeanAqi;
  const usAqi = data?.usAqi;
  const euCategory = euAqi != null ? getEuAqiCategory(euAqi) : null;
  const usCategory = usAqi != null ? getUsAqiCategory(usAqi) : null;

  return (
    <div className="border-base-content/5 bg-base-200 relative h-full rounded-xl border p-5">
      {error && (
        <ErrorRetry message={(error as Error).message || "Failed to load air quality."} onRetry={() => mutate?.()} />
      )}

      {isLoading && (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full rounded-xl"></div>
        </div>
      )}

      {data && (
        <div>
          {/* Header */}
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-base-content text-lg font-semibold">
              Air Quality
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={cn("status animate-pulse", categoryStyle.dotColor)}
              ></span>
              <span className="text-base-content/50 text-xs">NAQI · LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              {/* AQI Indices — 3-column row */}
              <div className="grid grid-cols-3 gap-2">
                {/* NAQI (primary) */}
                <div
                  className={cn(
                    "flex flex-col items-center rounded-lg border py-4",
                    categoryStyle.bgColor,
                    categoryStyle.borderColor,
                  )}
                >
                  <p className="text-base-content/40 mb-1 text-[10px] font-medium tracking-wider uppercase">
                    NAQI
                  </p>
                  <p
                    className={cn(
                      "font-mono text-3xl font-bold",
                      categoryStyle.textColor,
                    )}
                  >
                    {data.aqi}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      categoryStyle.textColor,
                    )}
                  >
                    {data.category}
                  </p>
                </div>

                {/* European AQI */}
                <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border py-4">
                  <p className="text-base-content/40 mb-1 text-[10px] font-medium tracking-wider uppercase">
                    EU AQI
                  </p>
                  {euAqi != null && euCategory ? (
                    <>
                      <p
                        className={cn(
                          "font-mono text-3xl font-bold",
                          euCategory.textColor,
                        )}
                      >
                        {euAqi}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-medium",
                          euCategory.textColor,
                        )}
                      >
                        {euCategory.label}
                      </p>
                    </>
                  ) : (
                    <p className="text-base-content/30 font-mono text-2xl">—</p>
                  )}
                </div>

                {/* US AQI */}
                <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border py-4">
                  <p className="text-base-content/40 mb-1 text-[10px] font-medium tracking-wider uppercase">
                    US AQI
                  </p>
                  {usAqi != null && usCategory ? (
                    <>
                      <p
                        className={cn(
                          "font-mono text-3xl font-bold",
                          usCategory.textColor,
                        )}
                      >
                        {usAqi}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-medium",
                          usCategory.textColor,
                        )}
                      >
                        {usCategory.label}
                      </p>
                    </>
                  ) : (
                    <p className="text-base-content/30 font-mono text-2xl">—</p>
                  )}
                </div>
              </div>

              {/* Prominent pollutant */}
              {data.prominentPollutant && (
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/40 text-xs">
                    Prominent pollutant:
                  </span>
                  <span
                    className={cn(
                      "badge badge-sm border font-medium",
                      categoryStyle.bgColor,
                      categoryStyle.borderColor,
                      categoryStyle.textColor,
                    )}
                  >
                    {data.prominentPollutant}
                  </span>
                </div>
              )}
            </div>

            {/* Pollutant Table */}
            <div className="overflow-x-auto rounded-lg -mx-2 px-2 sm:mx-0 sm:px-0">
              <table className="table-zebra table-sm table w-full min-w-[340px]" aria-label="Air quality pollutants">
                <thead>
                  <tr className="text-base-content/50 text-xs">
                    <th scope="col" className="font-medium">Pollutant</th>
                    <th scope="col" className="text-center font-medium">Conc.</th>
                    <th scope="col" className="text-center font-medium">Sub-Index</th>
                    <th scope="col" className="text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pollutantList.map((p) => {
                    const pStyle = getNaqiCategoryStyle(p.category);
                    return (
                      <tr key={p.label}>
                        <td className="text-base-content/80 text-sm">
                          {p.label}
                          <span className="text-base-content/30 ml-1 text-[10px]">
                            {p.unit}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "text-center font-mono text-sm",
                            pStyle.textColor,
                          )}
                        >
                          {p.concentration}
                        </td>
                        <td className="text-base-content/60 text-center font-mono text-sm">
                          {p.subIndex}
                        </td>
                        <td className="text-right">
                          <span
                            className={cn(
                              "badge badge-sm border text-xs",
                              pStyle.bgColor,
                              pStyle.borderColor,
                              pStyle.textColor,
                            )}
                          >
                            {p.category}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
