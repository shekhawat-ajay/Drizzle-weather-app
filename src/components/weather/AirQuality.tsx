import { LocationContext } from "@/context/LocationContext";
import useAQI from "@/hooks/weather/useAQI";
import { useContext, useMemo } from "react";
import {
  getNaqiCategoryStyle,
  getEuAqiCategory,
  getUsAqiCategory,
} from "@/utils/maps/aqiMap";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";
import ErrorRetry from "@/components/ErrorRetry";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { fmtTimeFromISO, parseAsUTC, getNowAsUTC } from "@/utils/formatters";

export default function AirQuality() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, raw, isLoading, error, mutate } = useAQI(
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

  const sparkline = useMemo(() => {
    if (!raw?.hourly?.time) return [];
    const nowMs = getNowAsUTC(raw.timezone ?? "UTC");
    const startMs = nowMs - 24 * 3600000;
    const endMs = nowMs + 24 * 3600000;
    const pts: { ts: number; time: string; eu: number | null; us: number | null }[] = [];
    for (let i = 0; i < raw.hourly.time.length; i++) {
      const ms = parseAsUTC(raw.hourly.time[i]!).getTime();
      if (ms < startMs || ms > endMs) continue;
      const eu = raw.hourly.europeanAqi[i] ?? null;
      const us = raw.hourly.usAqi[i] ?? null;
      if (eu == null && us == null) continue;
      pts.push({ ts: ms, time: raw.hourly.time[i]!, eu, us });
    }
    return pts;
  }, [raw]);

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

          {/* AQI trend — 24h EU + US with NAQI reference */}
          {sparkline.length > 1 ? (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-base-content/50 text-xs font-medium uppercase tracking-wider">AQI trend · 48h</p>
                <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-violet-400" /> EU</span>
                <span className="flex items-center gap-1 text-[10px]"><span className="h-2 w-2 rounded-full bg-amber-400" /> US</span>
                <span className="flex items-center gap-1 text-[10px] text-base-content/50"><span className="h-0.5 w-3 border-t border-dashed border-primary/60" /> NAQI {data.aqi}</span>
              </div>
              <div className="h-[90px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkline} margin={{ top: 4, right: 6, left: 6, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aqiGradEU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aqiGradUS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.30} />
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="ts" type="number" domain={["dataMin","dataMax"]} hide />
                    <YAxis hide domain={[0, "dataMax + 2"]} />
                      <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0]!.payload as { time: string; eu: number | null; us: number | null };
                        return (
                          <div className="bg-base-300 border border-base-content/10 rounded-lg px-2 py-1 text-xs shadow">
                            <p className="text-base-content/60">{fmtTimeFromISO(p.time)}</p>
                            <p className="font-mono font-semibold text-violet-400">EU {p.eu ?? "--"}</p>
                            <p className="font-mono font-semibold text-amber-400">US {p.us ?? "--"}</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={data.aqi} stroke="rgba(139,92,246,0.5)" strokeDasharray="6 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="eu" stroke="#a78bfa" strokeWidth={1.5} fill="url(#aqiGradEU)" dot={false} connectNulls isAnimationActive={false} />
                    <Area type="monotone" dataKey="us" stroke="#fbbf24" strokeWidth={1.5} fill="url(#aqiGradUS)" dot={false} connectNulls isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
