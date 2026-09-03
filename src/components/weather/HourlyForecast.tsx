import { use, useMemo } from "react";
import { LocationContext } from "@/context/LocationContext";
import { ResultType } from "@/schema/location";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import useDailyForecast from "@/hooks/weather/useDailyForecast";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import { useUnits } from "@/context/UnitsContext";
import { convertTemp, tempUnit } from "@/utils/unitConversions";
import { fmtTimeFromISO, getNowAsUTC, parseAsUTC } from "@/utils/formatters";
import ErrorRetry from "@/components/ErrorRetry";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

import type { WeatherCard, SunEvent } from "@/types/forecast";

// ── Custom label for sun reference lines ────────────────────────

function SunLabel({
  viewBox,
  kind,
  timeLabel,
}: {
  viewBox?: { x?: number; y?: number };
  kind: "sunrise" | "sunset";
  timeLabel: string;
}) {
  const x = viewBox?.x ?? 0;
  const iconHref = kind === "sunrise" ? "/sunrise.svg" : "/sunset.svg";
  const label = kind === "sunrise" ? "Sunrise" : "Sunset";

  return (
    <g>
      <image href={iconHref} x={x - 10} y={2} width={16} height={16} />
      <text
        x={x}
        y={26}
        textAnchor="middle"
        fontSize={9}
        fontFamily="monospace"
        fill="#fbbf24"
      >
        {timeLabel}
      </text>
      <text x={x} y={36} textAnchor="middle" fontSize={8} fill="#9ca3af">
        {label}
      </text>
    </g>
  );
}

// ── Component ───────────────────────────────────────────────────

export default function HourlyForecast() {
  const { location } = use(LocationContext) as unknown as {
    location: ResultType;
  };
  const { units } = useUnits();
  const tz = location.timezone ?? "UTC";
  const { data, isLoading, error, mutate } = useHourlyForecast(
    location.latitude,
    location.longitude,
  );

  const { data: dailyData } = useDailyForecast(
    location.latitude,
    location.longitude
  );

  const minutely15 = data?.minutely15;
  const daily = dailyData?.daily;

  // ── helpers ─────────────────────────────────────────────────

  const getWeatherImage = (code: number, isDay: number) => {
    const suffix = isDay ? "d" : "n";
    return weatherImageMap[`${code}${suffix}`];
  };



  // ── Chart data (last :15 → now+24h) with highest/lowest flags ─────

  const { chartData, chartStartMs, chartEndMs } = useMemo(() => {
    if (!minutely15) return { chartData: [], chartStartMs: 0, chartEndMs: 0 };
    const nowMs = getNowAsUTC(tz);
    const startMs = nowMs - (nowMs % (15 * 60 * 1000));
    const endMs = nowMs + 24 * 60 * 60 * 1000;

    const points: {
      ts: number;
      time: string;
      temp: number;
      weatherCode: number;
      isDay: number;
      isHighest?: boolean;
      isLowest?: boolean;
    }[] = [];
    for (let i = 0; i < minutely15.time.length; i++) {
      const ms = parseAsUTC(minutely15.time[i]!).getTime();
      if (ms >= startMs && ms <= endMs) {
        points.push({
          ts: ms,
          time: minutely15.time[i]!,
          temp: minutely15.temperature2M[i]!,
          weatherCode: minutely15.weatherCode[i]!,
          isDay: minutely15.isDay[i]!,
        });
      }
    }

    // Mark first occurrence of highest and lowest via linear scan
    if (points.length > 0) {
      let minIdx = 0;
      let maxIdx = 0;
      for (let i = 1; i < points.length; i++) {
        const pt = points[i]!;
        if (pt.temp < points[minIdx]!.temp) minIdx = i;
        if (pt.temp > points[maxIdx]!.temp) maxIdx = i;
      }
      const hi = points[maxIdx]!;
      const lo = points[minIdx]!;
      if (hi.temp !== lo.temp) {
        hi.isHighest = true;
        lo.isLowest = true;
      }
    }

    return { chartData: points, chartStartMs: startMs, chartEndMs: endMs };
  }, [minutely15, tz]);

  // ── Sunrise/sunset events within range ──────────────────────

  const sunEvents: SunEvent[] = useMemo(() => {
    if (!daily) return [];
    const events: SunEvent[] = [];
    for (const sr of daily.sunrise) {
      const ms = parseAsUTC(sr).getTime();
      if (ms >= chartStartMs && ms <= chartEndMs) {
        events.push({ kind: "sunrise", time: sr, ts: ms });
      }
    }
    for (const ss of daily.sunset) {
      const ms = parseAsUTC(ss).getTime();
      if (ms >= chartStartMs && ms <= chartEndMs) {
        events.push({ kind: "sunset", time: ss, ts: ms });
      }
    }
    return events;
  }, [daily, chartStartMs, chartEndMs]);

  // ── Weather cards — one per hour for next 24h (robust, not fragiley :30) ──────

  const cards: WeatherCard[] = useMemo(() => {
    if (!minutely15) return [];
    const nowMs = getNowAsUTC(tz);
    const cardEndMs = nowMs + 24 * 60 * 60 * 1000;
    // Find first index >= nowMs
    let startIdx = -1;
    for (let i = 0; i < minutely15.time.length; i++) {
      if (parseAsUTC(minutely15.time[i]!).getTime() >= nowMs) {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) return [];
    // Align to hour boundary: snap to next :00 within that hour if needed
    // Then step by 4 (15min *4 = 60min) for hourly cards
    const result: WeatherCard[] = [];
    // Try to prefer :30 within each hour if available, otherwise nearest to hour
    const seenHours = new Set<string>();
    for (let i = startIdx; i < minutely15.time.length; i++) {
      const t = minutely15.time[i]!;
      const ms = parseAsUTC(t).getTime();
      if (ms > cardEndMs) break;
      const hourKey = t.slice(0, 13); // YYYY-MM-DDTHH
      if (seenHours.has(hourKey)) continue;
      // Look ahead within this hour for :30 preference
      let bestIdx = i;
      for (let j = i; j < Math.min(i + 4, minutely15.time.length); j++) {
        const tj = minutely15.time[j]!;
        if (!tj.startsWith(hourKey)) break;
        if (parseAsUTC(tj).getUTCMinutes() === 30) {
          bestIdx = j;
          break;
        }
      }
      const bt = minutely15.time[bestIdx]!;
      const bms = parseAsUTC(bt).getTime();
      if (bms < nowMs || bms > cardEndMs) {
        seenHours.add(hourKey);
        continue;
      }
      result.push({
        time: bt,
        temp: minutely15.temperature2M[bestIdx]!,
        weatherCode: minutely15.weatherCode[bestIdx]!,
        isDay: minutely15.isDay[bestIdx]!,
        precipitationProbability: minutely15.precipitationProbability[bestIdx]!,
      });
      seenHours.add(hourKey);
      // Skip remaining slots of this hour
      while (i + 1 < minutely15.time.length && minutely15.time[i + 1]!.startsWith(hourKey)) i++;
    }
    return result.slice(0, 24);
  }, [minutely15, tz]);

  // ── Display chart data with converted temp ─────────────────

  const displayChartData = useMemo(
    () =>
      chartData.map((d) => ({
        ...d,
        displayTemp: convertTemp(d.temp, units) ?? d.temp,
      })),
    [chartData, units],
  );

  // ── Temp range for chart padded domain ──────────────────────

  const { tempMin, tempMax } = useMemo(() => {
    if (displayChartData.length === 0) return { tempMin: 0, tempMax: 10 };
    const temps = displayChartData.map((d) => d.displayTemp);
    return {
      tempMin: Math.floor(Math.min(...temps)) - 1,
      tempMax: Math.ceil(Math.max(...temps)) + 1,
    };
  }, [displayChartData]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="border-base-content/5 bg-base-200 relative rounded-xl border p-5">
      {error && (
        <ErrorRetry message={(error as Error).message || "Failed to load hourly forecast."} onRetry={() => mutate?.()} />
      )}

      {isLoading && (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full rounded-xl"></div>
        </div>
      )}

      {data && minutely15 && (
        <div>
          <h3 className="text-base-content mb-4 text-lg font-semibold">
            Hourly Forecast{" "}
            <span className="text-base-content/50 text-sm font-normal">
              (Next 24-Hours)
            </span>
          </h3>

          {/* ── Temperature chart with sunrise/sunset ───── */}
          {displayChartData.length > 0 && (
            <div className="mb-4 h-[140px] w-full overflow-visible" role="img" aria-label={`Temperature chart for next 24 hours, low ${tempMin} to high ${tempMax} ${tempUnit(units)}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={displayChartData}
                  margin={{
                    top: 28,
                    right: 12,
                    left: 12,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="tempGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    hide
                  />
                  <YAxis domain={[tempMin, tempMax]} hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as {
                        time: string;
                        temp: number;
                        displayTemp: number;
                        weatherCode: number;
                        isDay: number;
                        isHighest?: boolean;
                        isLowest?: boolean;
                      };
                      const extremeLabel = d.isHighest
                        ? "Highest"
                        : d.isLowest
                          ? "Lowest"
                          : null;
                      const weatherKey = `${d.weatherCode}${d.isDay ? "d" : "n"}`;
                      const weatherDesc =
                        weatherImageMap[weatherKey]?.description;
                      return (
                        <div className="border-base-content/10 bg-base-300 rounded-lg border px-3 py-2 shadow-lg">
                          <p className="text-base-content/60 text-xs">
                            {fmtTimeFromISO(d.time)}
                          </p>
                          <p className="font-mono text-sm font-semibold">
                            {Math.round(d.displayTemp)}{tempUnit(units)}
                          </p>
                          {weatherDesc && (
                            <p className="text-base-content/50 text-xs">
                              {weatherDesc}
                            </p>
                          )}
                          {extremeLabel && (
                            <p
                              className={`text-xs font-medium ${
                                d.isHighest
                                  ? "text-accent"
                                  : "text-primary"
                              }`}
                            >
                              {extremeLabel}
                            </p>
                          )}
                        </div>
                      );
                    }}
                    cursor={{
                      stroke: "#38bdf8",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />

                  {/* Sunrise/sunset reference lines */}
                  {sunEvents.map((ev) => (
                    <ReferenceLine
                      key={`${ev.kind}-${ev.ts}`}
                      x={ev.ts}
                      stroke="#fbbf24"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      label={
                        <SunLabel
                          kind={ev.kind}
                          timeLabel={fmtTimeFromISO(ev.time)}
                        />
                      }
                    />
                  ))}

                  <Area
                    type="monotone"
                    dataKey="displayTemp"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#tempGradient)"
                    dot={(props: {
                      cx?: number;
                      cy?: number;
                      payload?: {
                        isHighest?: boolean;
                        isLowest?: boolean;
                      };
                    }) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || !payload) {
                        return <g key="empty" />;
                      }
                      if (payload.isHighest) {
                        return (
                          <circle
                            key={`high-${cx}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="#f97316"
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }
                      if (payload.isLowest) {
                        return (
                          <circle
                            key={`low-${cx}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="#22d3ee"
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        );
                      }
                      return <g key={`empty-${cx}`} />;
                    }}
                    activeDot={{
                      r: 4,
                      fill: "#38bdf8",
                      stroke: "#0c4a6e",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Scrollable weather cards ────────────────── */}
          <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {cards.map((card) => {
              const weather = getWeatherImage(card.weatherCode, card.isDay);
              return (
                <div
                  key={card.time}
                  className="border-base-content/5 bg-base-300 hover:bg-base-200 flex min-w-[110px] flex-shrink-0 snap-start flex-col items-center rounded-lg border px-3 py-4 transition-colors duration-150"
                >
                  <p className="text-base-content/50 text-xs font-medium">
                    {fmtTimeFromISO(card.time)}
                  </p>
                  <img
                    className="my-2 size-9"
                    src={weather?.imageSrc}
                    alt={weather?.description}
                  />
                  <p className="font-mono text-sm font-semibold">
                    {Math.round(convertTemp(card.temp, units) ?? 0)}{tempUnit(units)}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <img
                      className="size-4"
                      src="/rain-probability.svg"
                      alt="rain probability"
                    />
                    <span className="text-base-content/60 font-mono text-xs">
                      {card.precipitationProbability}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
