import { use, useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Star, Cloud, Clock, Info } from "lucide-react";
import { LocationContext } from "@/context/LocationContext";
import { ResultType } from "@/schema/location";
import { useOutletContext } from "react-router";
import { Body, Observer, Equator, Horizon } from "astronomy-engine";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import { getNowAsUTC, parseAsUTC, fmtTimeFromISO, fmtTime, fmtDateShortFromISO } from "@/utils/formatters";
import { computeStargazingIndex } from "@/utils/astronomy";
import type { StargazingParams } from "@/utils/astronomy";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import useStargazingIndex from "@/hooks/astronomy/useStargazingIndex";
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

// ── Score color ────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-accent";
  if (score >= 20) return "text-accent";
  return "text-base-content/40";
}

// ── Types ──────────────────────────────────────────────────────

interface HourPoint {
  ts: number;
  time: string;
  sunAlt: number;
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
  const { location } = use(LocationContext) as unknown as {
    location: ResultType;
  };
  const { astronomyData } = useOutletContext<AstronomyOutletContext>();
  const tz = location.timezone ?? "UTC";
  const { data } = useHourlyForecast(location.latitude, location.longitude);
  const hourly = data?.hourly;
  const minutely15 = data?.minutely15;
  // API times are wall-clock local pretended as UTC (see formatters.ts).
  // astronomy-engine needs true UTC, so shift back by the zone offset for engine calls only.
  const utcOffsetMs = (data?.utcOffsetSeconds ?? 0) * 1000;

  const moonIllumination = astronomyData.moon.illuminationFraction;
  const liveSunAlt = astronomyData.sunPosition.altitude;
  const liveMoonAlt = astronomyData.moonPosition.altitude;
  const sunUpNow = astronomyData.sunPosition.isAboveHorizon;

  const { chartPoints, cards, bestWindow } = useMemo(() => {
    if (!hourly) return { chartPoints: [], cards: [], bestWindow: null as HourPoint | null };

    const nowMs = getNowAsUTC(tz);
    const endMs = nowMs + 24 * 60 * 60 * 1000;
    const points: HourPoint[] = [];
    const observer = new Observer(location.latitude, location.longitude, 0);

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

    // Per-hour sun/moon altitude (cheap: 24 × 4 calls).
    // ms is pretend-UTC wall-clock — convert to true UTC for the engine.
    const sunMoonAlt = (ms: number): { sunAlt: number; moonAlt: number } => {
      try {
        const d = new Date(ms - utcOffsetMs);
        const sunEqu = Equator(Body.Sun, d, observer, true, true);
        const sunHor = Horizon(d, observer, sunEqu.ra, sunEqu.dec, "normal");
        const moonEqu = Equator(Body.Moon, d, observer, true, true);
        const moonHor = Horizon(d, observer, moonEqu.ra, moonEqu.dec, "normal");
        return { sunAlt: sunHor.altitude, moonAlt: moonHor.altitude };
      } catch {
        return { sunAlt: -90, moonAlt: -90 };
      }
    };

    for (let i = 0; i < hourly.time.length; i++) {
      const ms = parseAsUTC(hourly.time[i]!).getTime();
      if (ms >= nowMs && ms <= endMs) {
        const hourMs = Math.floor(ms / 3600000) * 3600000;
        const { sunAlt, moonAlt } = sunMoonAlt(ms);
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
          isDay: sunAlt > 0,
          moonIllumination,
          moonAltitudeDeg: moonAlt,
          sunAltitudeDeg: sunAlt,
        };
        const result = computeStargazingIndex(params);
        points.push({
          ts: ms,
          time: hourly.time[i]!,
          sunAlt,
          cloudCover: hourly.cloudCover[i]!,
          cloudCoverLow: hourly.cloudCoverLow[i]!,
          cloudCoverMid: hourly.cloudCoverMid[i]!,
          cloudCoverHigh: hourly.cloudCoverHigh[i]!,
          isDay: sunAlt > 0 ? 1 : 0,
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

    // Best viewing window — highest score in true darkness, else any night hour
    const dark = points.filter((p) => p.sunAlt <= -12);
    const night = points.filter((p) => p.sunAlt < 0);
    const pool = dark.length > 0 ? dark : night;
    let bestHour: HourPoint | null = null;
    for (const pt of pool) {
      if (bestHour === null || pt.score > bestHour.score) bestHour = pt;
    }

    return {
      chartPoints: points,
      cards: points,
      bestWindow: bestHour,
    };
  }, [hourly, minutely15, tz, moonIllumination, location.latitude, location.longitude, utcOffsetMs]);

  // Single source of truth for "right now" — same hook the Overview banner uses
  const currentResult = useStargazingIndex(
    location.latitude,
    location.longitude,
    tz,
    moonIllumination,
    liveSunAlt,
    liveMoonAlt,
    sunUpNow,
  );

  if (!hourly) {
    return (
      <div>
        <SectionHeader icon={Star} label="Night Sky" color="text-primary" />
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5 text-center">
          <p className="text-base-content/50 text-sm">Night-sky data unavailable — hourly forecast failed to load.</p>
        </div>
      </div>
    );
  }
  if (chartPoints.length === 0) return null;

  // Current hour's cloud (not just the first future point)
  const nowMsForCloud = getNowAsUTC(tz);
  let currentCloud = chartPoints[0]?.cloudCover ?? 0;
  for (const p of chartPoints) {
    if (p.ts <= nowMsForCloud) currentCloud = p.cloudCover;
    else break;
  }
  const isDaytime = sunUpNow;

  // Stargazing starts at true darkness, not sunset (sunset can be hours
  // earlier, and the static sunset value may belong to a past day)
  const nowReal = Date.now();
  const dusk = astronomyData.sun.astronomicalDusk;
  const set = astronomyData.sun.sunset;
  const nextRise = astronomyData.nextRiseSet.nextSunrise;
  const startsAt =
    dusk && dusk.getTime() > nowReal
      ? dusk
      : set && set.getTime() > nowReal
        ? set
        : nextRise;
  const startsAtIsDusk = startsAt != null && startsAt === dusk;

  return (
    <div>
      <SectionHeader icon={Star} label="Night Sky" color="text-primary" />

      <div className="space-y-4">
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Stargazing Index — same formula as the Overview banner */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-1 border border-primary/10">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Stargazing Index
              </span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${getScoreColor(currentResult?.score ?? 0)}`}>
              {currentResult?.score ?? 0}
              <span className="text-sm font-medium ml-1.5">/100</span>
            </p>
            <progress
              className="progress progress-primary mt-1.5 w-full"
              value={currentResult?.score ?? 0}
              max={100}
              aria-label={`Stargazing score ${currentResult?.score ?? 0} out of 100`}
            />
            <p className="text-xs text-base-content/50 mt-0.5">
              {currentResult?.label}: {currentResult?.description}
            </p>
          </div>

          {/* Cloud Cover */}
          <AstroCard
            icon={Cloud}
            title="Cloud Cover"
            value={`${currentCloud}%`}
            sub={getCloudLabel(currentCloud)}
            accent="primary"
          />

          {/* Best Viewing Window / Sunset Info */}
          <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-1 border border-primary/10">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                {isDaytime ? "Starts At" : "Best Window"}
              </span>
            </div>
            {isDaytime ? (
              <>
                <p className="text-2xl font-bold mt-1">
                  {startsAt ? fmtTime(startsAt, tz) : "--"}
                </p>
                <p className="text-xs text-base-content/50">
                  {startsAtIsDusk
                    ? "Astronomical dusk — true darkness"
                    : startsAt
                      ? "Sunset — dark skies after astronomical dusk"
                      : "Sun does not set today"}
                </p>
                {startsAt ? (
                  <div className="mt-1">
                    <CountdownBadge target={startsAt} className="badge-primary" />
                  </div>
                ) : null}
              </>
            ) : bestWindow ? (
              <>
                <p className="text-2xl font-bold mt-1">
                  {fmtTimeFromISO(bestWindow.time)}
                </p>
                <p className="text-xs text-base-content/50">
                  {fmtDateShortFromISO(bestWindow.time)} · Score {bestWindow.score}/100 ({bestWindow.label})
                </p>
              </>
            ) : (
              <p className="text-base-content/50 text-sm mt-1">No clear window</p>
            )}
          </div>
        </div>

        {/* ── Contributing Factors ── */}
        {currentResult && currentResult.factors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentResult.factors.map((f) => (
              <span
                key={f.param}
                className={`badge badge-xs ${f.impact === "positive" ? "badge-primary" : f.impact === "negative" ? "badge-accent" : "badge-ghost"}`}
              >
                {f.impact === "positive" ? "✓" : f.impact === "negative" ? "✕" : "–"}{" "}
                {f.param}: {f.detail}
              </span>
            ))}
          </div>
        ) : null}

        {/* ── How the score is calculated ── */}
        <details className="collapse collapse-arrow border border-base-content/5 bg-base-200 text-xs">
          <summary className="collapse-title flex items-center gap-1.5 font-medium">
            <Info size={12} /> How is the stargazing score calculated?
          </summary>
          <div className="collapse-content">
            <div className="grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1 text-base-content/50 leading-relaxed list-disc pl-4">
                <li>Starts at 100. Daylight (sun above horizon) forces 0; twilight penalizes −45 civil, −15 nautical, −5 astronomical.</li>
                <li>Clouds: weighted low×50% + mid×30% + high×20%, times 0.40 (up to −40).</li>
                <li>Moonlight scaled by moon altitude — a full moon below the horizon costs 0; overhead bright moon costs −20.</li>
                <li>Humidity &gt;80% (−0.5/pt), low pressure &lt;1005 (−10), wind &gt;25 km/h (−0.3/pt), visibility &lt;10 km (−15), rain chance &gt;50% (−0.3/pt), dew spread &lt;3° (−15).</li>
              </ul>
              <div>
                <p className="text-xs font-semibold mb-2">Score scale</p>
                <ul className="space-y-1.5">
                  {[
                    { label: "Excellent", range: "80+", cls: "bg-primary" },
                    { label: "Good", range: "60+", cls: "bg-primary/60" },
                    { label: "Fair", range: "40+", cls: "bg-accent" },
                    { label: "Poor", range: "20+", cls: "bg-accent/60" },
                    { label: "Very Poor", range: "<20", cls: "bg-base-content/30" },
                  ].map((r) => (
                    <li key={r.label} className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${r.cls}`} />
                      <span className="font-medium">{r.label}</span>
                      <span className="text-base-content/40 font-mono">{r.range}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-base-content/40 mt-2">The Overview banner uses this same score.</p>
              </div>
            </div>
          </div>
        </details>

        {/* ── 24h Cloud Cover Chart ── */}
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <h3 className="text-base-content mb-4 text-lg font-semibold">
            Cloud Cover{" "}
            <span className="text-base-content/50 text-sm font-normal">
              (Next 24-Hours)
            </span>
          </h3>
          <p className="text-[10px] text-base-content/40 -mt-2 mb-2">★ = stargazing score for that hour (0–100, higher is better)</p>

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
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
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
                    stroke: "#a78bfa",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cloudCover"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#cloudGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#a78bfa",
                    stroke: "#2e1065",
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
            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
