import { useContext, useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Star, Cloud, Clock } from "lucide-react";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import { useOutletContext } from "react-router";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import { getNowAsUTC, parseAsUTC, fmtTimeFromISO, fmtTime } from "@/utils/formatters";
import { computeStargazingIndex } from "@/utils/astronomy";
import type { StargazingResult, StargazingParams } from "@/utils/astronomy";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

// ── Cloud cover → sky condition SVG mapping ────────────────────

function getCloudSvg(cover: number, isDay: number): string {
  if (cover <= 25) return isDay ? "/clear-day.svg" : "/clear-night.svg";
  if (cover <= 70)
    return isDay ? "/partly-cloudy-day.svg" : "/partly-cloudy-night.svg";
  return isDay ? "/overcast-day.svg" : "/overcast-night.svg";
}

function getCloudLabel(cover: number): string {
  if (cover <= 10) return "Clear";
  if (cover <= 25) return "Mostly Clear";
  if (cover <= 50) return "Partly Cloudy";
  if (cover <= 70) return "Mostly Cloudy";
  if (cover <= 90) return "Cloudy";
  return "Overcast";
}

// ── Factor color helper ────────────────────────────────────────

const FACTOR_STYLES = {
  positive: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  negative: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  neutral: "bg-amber-500/10 text-amber-400 border-amber-500/20",
} as const;

// ── Score color ────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "text-teal-400";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-rose-400";
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-teal-500";
  if (score >= 60) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-rose-500";
}

// ── Types ──────────────────────────────────────────────────────

interface HourPoint {
  ts: number;
  time: string;
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverMid: number;
  cloudCoverHigh: number;
  isDay: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  wind: number;
  temperature: number;
  score: number;
  label: string;
}

// ── Tooltip ────────────────────────────────────────────────────

function CloudTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: HourPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="border-base-content/10 bg-base-300 rounded-lg border px-3 py-2 shadow-lg text-left">
      <p className="text-base-content/60 text-xs mb-1">{fmtTimeFromISO(d.time)}</p>
      <p className="font-mono text-sm font-semibold">{d.cloudCover}%</p>
      <p className="text-base-content/50 text-[10px]">{getCloudLabel(d.cloudCover)}</p>
      <div className="flex gap-3 mt-1.5 text-[10px] text-base-content/40">
        <span>Low {d.cloudCoverLow}%</span>
        <span>Mid {d.cloudCoverMid}%</span>
        <span>High {d.cloudCoverHigh}%</span>
      </div>
      <p className={`text-[10px] font-semibold mt-1 ${getScoreColor(d.score)}`}>
        {d.label} ({d.score})
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function NightSky() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { astronomyData } = useOutletContext<AstronomyOutletContext>();
  const tz = location.timezone ?? "UTC";
  const { data } = useHourlyForecast(location.latitude, location.longitude);
  const hourly = data?.hourly;
  const minutely15 = data?.minutely15;

  const moonIllumination = astronomyData.moon.illuminationFraction;
  const sunset = astronomyData.sun.sunset;
  const astronomicalDusk = astronomyData.sun.astronomicalDusk;

  const { chartPoints, cards, currentResult, bestWindow } = useMemo(() => {
    if (!hourly) return { chartPoints: [], cards: [], currentResult: null, bestWindow: null };

    const nowMs = getNowAsUTC(tz);
    const endMs = nowMs + 24 * 60 * 60 * 1000;
    const points: HourPoint[] = [];

    // Build visibility/precipProb lookup from minutely_15
    const visMap = new Map<number, number>();
    const precipMap = new Map<number, number>();
    if (minutely15) {
      for (let i = 0; i < minutely15.time.length; i++) {
        const hourMs = Math.floor(parseAsUTC(minutely15.time[i]!).getTime() / 3600000) * 3600000;
        // Use the last value for each hour (closest to the full hour)
        visMap.set(hourMs, minutely15.visibility[i]!);
        precipMap.set(hourMs, minutely15.precipitationProbability[i]!);
      }
    }

    for (let i = 0; i < hourly.time.length; i++) {
      const ms = parseAsUTC(hourly.time[i]!).getTime();
      if (ms >= nowMs && ms <= endMs) {
        const hourMs = Math.floor(ms / 3600000) * 3600000;
        const params: StargazingParams = {
          cloudCover: hourly.cloudCover[i]!,
          cloudCoverLow: hourly.cloudCoverLow[i]!,
          cloudCoverMid: hourly.cloudCoverMid[i]!,
          cloudCoverHigh: hourly.cloudCoverHigh[i]!,
          humidity: hourly.relativeHumidity2M[i]!,
          pressure: hourly.surfacePressure[i]!,
          wind: hourly.windSpeed10M[i]!,
          visibility: visMap.get(hourMs) ?? 20000,
          precipProb: precipMap.get(hourMs) ?? 0,
          temperature: hourly.temperature2M[i]!,
          dewPoint: hourly.dewPoint2M[i]!,
          isDay: hourly.isDay[i]! === 1,
          moonIllumination,
        };
        const result = computeStargazingIndex(params);
        points.push({
          ts: ms,
          time: hourly.time[i]!,
          cloudCover: hourly.cloudCover[i]!,
          cloudCoverLow: hourly.cloudCoverLow[i]!,
          cloudCoverMid: hourly.cloudCoverMid[i]!,
          cloudCoverHigh: hourly.cloudCoverHigh[i]!,
          isDay: hourly.isDay[i]!,
          humidity: hourly.relativeHumidity2M[i]!,
          dewPoint: hourly.dewPoint2M[i]!,
          pressure: hourly.surfacePressure[i]!,
          wind: hourly.windSpeed10M[i]!,
          temperature: hourly.temperature2M[i]!,
          score: result.score,
          label: result.label,
        });
      }
    }

    // Current stargazing result
    let curIdx = 0;
    for (let i = 0; i < points.length; i++) {
      if (points[i]!.ts <= nowMs) curIdx = i;
    }
    const cur = points[curIdx];
    let currentRes: StargazingResult | null = null;
    if (cur) {
      // Use real sunset time for current index — not the API's quantized is_day
      const realNow = new Date();
      const isSunUp = sunset ? realNow.getTime() < sunset.getTime() : true;

      currentRes = computeStargazingIndex({
        cloudCover: cur.cloudCover,
        cloudCoverLow: cur.cloudCoverLow,
        cloudCoverMid: cur.cloudCoverMid,
        cloudCoverHigh: cur.cloudCoverHigh,
        humidity: cur.humidity,
        pressure: cur.pressure,
        wind: cur.wind,
        visibility: visMap.get(Math.floor(cur.ts / 3600000) * 3600000) ?? 20000,
        precipProb: precipMap.get(Math.floor(cur.ts / 3600000) * 3600000) ?? 0,
        temperature: cur.temperature,
        dewPoint: cur.dewPoint,
        isDay: isSunUp,
        moonIllumination,
      });
    }

    // Best viewing window — find highest scoring nighttime hour
    let bestHour: HourPoint | null = null;
    for (const pt of points) {
      if (pt.isDay === 0 && (bestHour === null || pt.score > bestHour.score)) {
        bestHour = pt;
      }
    }

    return {
      chartPoints: points,
      cards: points,
      currentResult: currentRes,
      bestWindow: bestHour,
    };
  }, [hourly, minutely15, tz, moonIllumination, sunset]);

  if (!hourly || chartPoints.length === 0) return null;

  const currentCloud = chartPoints[0]?.cloudCover ?? 0;
  const isDaytime = currentResult?.label === "Daytime";

  return (
    <div>
      <SectionHeader icon={Star} label="Night Sky" color="text-violet-400" />

      <div className="space-y-4">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Stargazing Index */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-1 border border-violet-500/10">
            <div className="flex items-center gap-2 text-violet-400">
              <Star className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Stargazing Index
              </span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${getScoreColor(currentResult?.score ?? 0)}`}>
              {currentResult?.score ?? 0}
              <span className="text-sm font-medium ml-1.5">/100</span>
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-base-content/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(currentResult?.score ?? 0)}`}
                style={{ width: `${currentResult?.score ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-base-content/50 mt-0.5">
              {currentResult?.label} — {currentResult?.description}
            </p>
          </div>

          {/* Cloud Cover */}
          <AstroCard
            icon={Cloud}
            title="Cloud Cover"
            value={`${currentCloud}%`}
            sub={getCloudLabel(currentCloud)}
            accent="cyan"
          />

          {/* Best Viewing Window / Sunset Info */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-1 border border-teal-500/10">
            <div className="flex items-center gap-2 text-teal-400">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                {isDaytime ? "Starts At" : "Best Window"}
              </span>
            </div>
            {isDaytime ? (
              <>
                <p className="text-2xl font-bold mt-1">
                  {sunset ? fmtTime(sunset, tz) : "--"}
                </p>
                <p className="text-xs text-base-content/50">
                  {astronomicalDusk
                    ? `Dark skies after ${fmtTime(astronomicalDusk, tz)}`
                    : "Sunset time"}
                </p>
              </>
            ) : bestWindow ? (
              <>
                <p className="text-2xl font-bold mt-1">
                  {fmtTimeFromISO(bestWindow.time)}
                </p>
                <p className="text-xs text-base-content/50">
                  Best score: {bestWindow.score}/100 — {bestWindow.label}
                </p>
              </>
            ) : (
              <p className="text-base-content/50 text-sm mt-1">No clear window</p>
            )}
          </div>
        </div>

        {/* ── Contributing Factors ── */}
        {currentResult && currentResult.factors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentResult.factors.map((f) => (
              <span
                key={f.param}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${FACTOR_STYLES[f.impact]}`}
              >
                {f.impact === "positive" ? "✓" : f.impact === "negative" ? "✕" : "–"}{" "}
                {f.param}: {f.detail}
              </span>
            ))}
          </div>
        )}

        {/* ── 24h Cloud Cover Chart ── */}
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <h3 className="text-base-content mb-4 text-lg font-semibold">
            Cloud Cover{" "}
            <span className="text-base-content/50 text-sm font-normal">
              (Next 24-Hours)
            </span>
          </h3>

          <div className="mb-4 h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartPoints}
                margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="cloudGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  hide
                />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  content={(props) => (
                    <CloudTooltip
                      active={props.active ?? false}
                      payload={
                        (props.payload as { payload: HourPoint }[] | undefined) ?? []
                      }
                    />
                  )}
                  cursor={{
                    stroke: "#818cf8",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cloudCover"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#cloudGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#818cf8",
                    stroke: "#1e1b4b",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Scrollable hourly cards ── */}
          <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {cards.map((card) => (
              <div
                key={card.time}
                className="border-base-content/5 bg-base-300 hover:bg-base-200 flex min-w-[100px] flex-shrink-0 snap-start flex-col items-center rounded-lg border px-3 py-4 transition-colors duration-150"
              >
                <p className="text-base-content/50 text-xs font-medium">
                  {fmtTimeFromISO(card.time)}
                </p>
                <img
                  className="my-2 size-8"
                  src={getCloudSvg(card.cloudCover, card.isDay)}
                  alt={getCloudLabel(card.cloudCover)}
                />
                <p className="font-mono text-sm font-semibold">
                  {card.cloudCover}%
                </p>
                <p className="text-[9px] text-base-content/40">cloud</p>
                <div className={`flex items-center gap-0.5 mt-1.5 text-[10px] font-bold ${getScoreColor(card.score)}`}>
                  <Star className="size-2.5" />
                  <span>{card.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Light Pollution ── */}
        <a
          href={`https://www.lightpollutionmap.info/#zoom=9&lat=${location.latitude}&lon=${location.longitude}&state=eyJiYXNlbWFwIjoiTGF5ZXJCaW5nUm9hZCIsIm92ZXJsYXkiOiJ3YTIwMTUiLCJmZWF0dXJlcyI6W10sIm92ZXJsYXljb2xvciI6ZmFsc2UsIm92ZXJsYXlvcGFjaXR5Ijo2MCwiZmVhdHVyZXNvcGFjaXR5Ijo2MH0=`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block border-base-content/5 bg-base-200 hover:bg-base-300 rounded-xl border p-5 transition-colors duration-200 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base-content text-lg font-semibold">
              Light Pollution{" "}
              <span className="text-base-content/50 text-sm font-normal">
                (Bortle Scale)
              </span>
            </h3>
            <span className="text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Open map ↗
            </span>
          </div>
          <p className="text-sm text-base-content/50">
            View the interactive light pollution map for{" "}
            <span className="text-base-content/70 font-medium">{location.name}</span>.
            Darker areas on the Bortle scale indicate ideal stargazing locations
            with minimal artificial sky glow.
          </p>
        </a>
      </div>
    </div>
  );
}
