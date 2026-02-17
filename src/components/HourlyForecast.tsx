import { useContext, useMemo } from "react";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useHourlyForecast from "@/hooks/useHourlyForecast";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────

type WeatherCard = {
  time: string;
  temp: number;
  weatherCode: number;
  isDay: number;
  humidity: number;
};

type SunEvent = {
  kind: "sunrise" | "sunset";
  time: string;
  ts: number;
};

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
      <image href={iconHref} x={x - 10} y={4} width={20} height={20} />
      <text
        x={x}
        y={30}
        textAnchor="middle"
        fontSize={10}
        fontFamily="monospace"
        fill="#fbbf24"
      >
        {timeLabel}
      </text>
      <text x={x} y={42} textAnchor="middle" fontSize={9} fill="#9ca3af">
        {label}
      </text>
    </g>
  );
}

// ── Component ───────────────────────────────────────────────────

export default function HourlyForecast() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, isLoading, error } = useHourlyForecast(
    location.latitude,
    location.longitude,
  );

  const minutely15 = data?.minutely15;
  const daily = data?.daily;

  // ── helpers ─────────────────────────────────────────────────

  const getWeatherImage = (code: number, isDay: number) => {
    const suffix = isDay ? "d" : "n";
    return weatherImageMap[`${code}${suffix}`];
  };

  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
    return d.toLocaleString("default", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── Chart data (now → now+25h) with highest/lowest flags ─────

  const { chartData, chartStartMs, chartEndMs } = useMemo(() => {
    if (!minutely15) return { chartData: [], chartStartMs: 0, chartEndMs: 0 };
    const nowMs = Date.now();
    const endMs = nowMs + 25 * 60 * 60 * 1000;

    const points: {
      ts: number;
      time: string;
      temp: number;
      isHighest?: boolean;
      isLowest?: boolean;
    }[] = [];
    for (let i = 0; i < minutely15.time.length; i++) {
      const ms = new Date(minutely15.time[i]!).getTime();
      if (ms >= nowMs && ms <= endMs) {
        points.push({
          ts: ms,
          time: minutely15.time[i]!,
          temp: minutely15.temperature2M[i]!,
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

    return { chartData: points, chartStartMs: nowMs, chartEndMs: endMs };
  }, [minutely15]);

  // ── Sunrise/sunset events within range ──────────────────────

  const sunEvents: SunEvent[] = useMemo(() => {
    if (!daily) return [];
    const events: SunEvent[] = [];
    for (const sr of daily.sunrise) {
      const ms = new Date(sr).getTime();
      if (ms >= chartStartMs && ms <= chartEndMs) {
        events.push({ kind: "sunrise", time: sr, ts: ms });
      }
    }
    for (const ss of daily.sunset) {
      const ms = new Date(ss).getTime();
      if (ms >= chartStartMs && ms <= chartEndMs) {
        events.push({ kind: "sunset", time: ss, ts: ms });
      }
    }
    return events;
  }, [daily, chartStartMs, chartEndMs]);

  // ── Weather cards (next :30 from now, for 24h) ──────────────

  const cards: WeatherCard[] = useMemo(() => {
    if (!minutely15) return [];
    const nowMs = Date.now();
    const cardEndMs = nowMs + 24 * 60 * 60 * 1000;
    const result: WeatherCard[] = [];
    for (let i = 0; i < minutely15.time.length; i++) {
      const t = minutely15.time[i]!;
      const d = new Date(t);
      const ms = d.getTime();
      if (ms < nowMs || ms > cardEndMs) continue;
      if (d.getMinutes() !== 30) continue;

      result.push({
        time: t,
        temp: minutely15.temperature2M[i]!,
        weatherCode: minutely15.weatherCode[i]!,
        isDay: minutely15.isDay[i]!,
        humidity: minutely15.relativeHumidity2M[i]!,
      });
    }
    return result;
  }, [minutely15]);

  // ── Temp range for chart padded domain ──────────────────────

  const { tempMin, tempMax } = useMemo(() => {
    if (chartData.length === 0) return { tempMin: 0, tempMax: 10 };
    const temps = chartData.map((d) => d.temp);
    return {
      tempMin: Math.floor(Math.min(...temps)) - 1,
      tempMax: Math.ceil(Math.max(...temps)) + 1,
    };
  }, [chartData]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="border-base-content/5 bg-base-200 relative rounded-xl border p-5">
      {error && (
        <div className="flex h-full items-center justify-center py-8">
          <p className="text-error text-sm">Something went wrong!</p>
        </div>
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
          {chartData.length > 0 && (
            <div className="mb-4 h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 48,
                    right: 10,
                    left: 10,
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
                        isHighest?: boolean;
                        isLowest?: boolean;
                      };
                      const extremeLabel = d.isHighest
                        ? "Highest"
                        : d.isLowest
                          ? "Lowest"
                          : null;
                      return (
                        <div className="border-base-content/10 bg-base-300 rounded-lg border px-3 py-2 shadow-lg">
                          <p className="text-base-content/60 text-xs">
                            {formatTime(d.time)}
                          </p>
                          <p className="font-mono text-sm font-semibold">
                            {d.temp}°
                          </p>
                          {extremeLabel && (
                            <p
                              className={`text-xs font-medium ${
                                d.isHighest
                                  ? "text-orange-400"
                                  : "text-cyan-400"
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
                          timeLabel={formatTime(ev.time)}
                        />
                      }
                    />
                  ))}

                  <Area
                    type="monotone"
                    dataKey="temp"
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
                    {formatTime(card.time)}
                  </p>
                  <img
                    className="my-2 size-9"
                    src={weather?.imageSrc}
                    alt={weather?.description}
                  />
                  <p className="font-mono text-sm font-semibold">
                    {card.temp}°
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <img
                      className="size-4"
                      src="/humidity.svg"
                      alt="humidity"
                    />
                    <span className="text-base-content/60 font-mono text-xs">
                      {card.humidity}%
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
