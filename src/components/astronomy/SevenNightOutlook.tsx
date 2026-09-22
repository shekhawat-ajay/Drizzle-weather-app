import { use, useMemo } from "react";
import { Body, Observer, Equator, Horizon, Illumination } from "astronomy-engine";
import { CalendarDays, Star, Moon, Cloud } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import { LocationContext } from "@/context/LocationContext";
import { ResultType } from "@/schema/location";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import { getNowAsUTC, parseAsUTC, fmtTimeFromISO, fmtDateShortFromISO, fmtWeekdayFromISO } from "@/utils/formatters";
import { computeStargazingIndex } from "@/utils/astronomy";

interface NightBest {
  nightKey: string;
  displayDate: string;
  weekday: string;
  bestTime: string;
  bestTs: number;
  score: number;
  label: string;
  cloud: number;
  moonPct: number;
}

function getScoreColor(score: number): string {
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-accent";
  if (score >= 20) return "text-accent";
  return "text-base-content/40";
}

/** Local YYYY-MM-DD in tz for a UTC-ms timestamp */
function localDateKey(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

/** Local hour (0-23) in tz */
function localHour(ms: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).formatToParts(new Date(ms));
  return parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
}

/**
 * 7-night outlook — per-night best stargazing score in darkness.
 * Like WeeklyForecast for astro: aggregates hourly + sun/moon alt + cloud.
 * Uses existing hourly (14d) + minutely15 vis/precip where available.
 */
export default function SevenNightOutlook() {
  const { location } = use(LocationContext) as unknown as { location: ResultType };
  const tz = location.timezone ?? "UTC";
  const { data } = useHourlyForecast(location.latitude, location.longitude);
  const hourly = data?.hourly;
  const minutely15 = data?.minutely15;
  // Same pretend-UTC → true-UTC correction as NightSky for engine calls
  const utcOffsetMs = (data?.utcOffsetSeconds ?? 0) * 1000;

  const nights = useMemo<NightBest[]>(() => {
    if (!hourly) return [];
    const nowMs = getNowAsUTC(tz);
    const endMs = nowMs + 7 * 24 * 3600_000;
    const observer = new Observer(location.latitude, location.longitude, 0);

    const visMap = new Map<number, number>();
    const precipMap = new Map<number, number>();
    if (minutely15) {
      for (let i = 0; i < minutely15.time.length; i++) {
        const hourMs = Math.floor(parseAsUTC(minutely15.time[i]!).getTime() / 3600000) * 3600000;
        visMap.set(hourMs, minutely15.visibility[i]!);
        precipMap.set(hourMs, minutely15.precipitationProbability[i]!);
      }
    }

    // nightKey -> best
    const bestByNight = new Map<string, NightBest & { ts: number }>();

    for (let i = 0; i < hourly.time.length; i++) {
      const ms = parseAsUTC(hourly.time[i]!).getTime();
      if (ms < nowMs || ms > endMs) continue;

      // sun/moon alt at this hour — ms is wall-clock pretend-UTC, engine needs true UTC
      let sunAlt = -90, moonAlt = -90, moonIllum = 0;
      try {
        const d = new Date(ms - utcOffsetMs);
        const sunEqu = Equator(Body.Sun, d, observer, true, true);
        sunAlt = Horizon(d, observer, sunEqu.ra, sunEqu.dec, "normal").altitude;
        const moonEqu = Equator(Body.Moon, d, observer, true, true);
        moonAlt = Horizon(d, observer, moonEqu.ra, moonEqu.dec, "normal").altitude;
        moonIllum = Illumination(Body.Moon, d).phase_fraction;
      } catch { continue; }

      // only darkness counts for "night" score
      if (sunAlt > -6) continue;

      const hourMs = Math.floor(ms / 3600000) * 3600000;
      const result = computeStargazingIndex({
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
        isDay: false,
        moonIllumination: moonIllum,
        moonAltitudeDeg: moonAlt,
        sunAltitudeDeg: sunAlt,
      });

      // assign to evening date: hours before noon belong to previous night
      const h = localHour(ms, tz);
      const baseKey = localDateKey(ms, tz);
      let nightKey = baseKey;
      if (h < 12) {
        const prevMs = ms - 24 * 3600_000;
        nightKey = localDateKey(prevMs, tz);
      }

      const prev = bestByNight.get(nightKey);
      if (!prev || result.score > prev.score) {
        bestByNight.set(nightKey, {
          nightKey,
          displayDate: fmtDateShortFromISO(hourly.time[i]!),
          weekday: fmtWeekdayFromISO(hourly.time[i]!),
          bestTime: hourly.time[i]!,
          bestTs: ms,
          ts: ms,
          score: result.score,
          label: result.label,
          cloud: hourly.cloudCover[i]!,
          moonPct: Math.round(moonIllum * 100),
        });
      }
    }

    return [...bestByNight.values()]
      .sort((a, b) => a.bestTs - b.bestTs)
      .slice(0, 7)
      .map(({ ts: _ts, ...rest }) => rest);
  }, [hourly, minutely15, tz, location.latitude, location.longitude, utcOffsetMs]);

  if (!hourly) return null;
  if (nights.length === 0) return null;

  const bestNight = nights.reduce((a, b) => (b.score > a.score ? b : a), nights[0]!);

  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <SectionHeader icon={CalendarDays} label="7-night outlook — best score" color="text-primary" />
      <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {nights.map((n) => {
          const isBest = n.nightKey === bestNight.nightKey;
          return (
            <div
              key={n.nightKey}
              className={`flex min-w-[132px] flex-shrink-0 snap-start flex-col items-center rounded-lg border px-3 py-3 text-center transition-colors ${
                isBest
                  ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                  : "bg-base-300 border-base-content/10"
              }`}
            >
              <p className="text-base-content/50 text-[10px] uppercase tracking-wider">{n.weekday}</p>
              <p className="text-xs font-medium">{n.displayDate}</p>
              <p className={`mt-1 font-mono text-xl font-bold ${getScoreColor(n.score)}`}>
                {n.score}
              </p>
              <p className="text-base-content/50 text-[10px]">{n.label}</p>
              <p className="mt-1 font-mono text-xs">{fmtTimeFromISO(n.bestTime)}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-base-content/50">
                <span className="inline-flex items-center gap-0.5"><Cloud size={10} />{n.cloud}%</span>
                <span className="inline-flex items-center gap-0.5"><Moon size={10} />{n.moonPct}%</span>
              </div>
              {isBest ? (
                <span className="mt-1.5 badge badge-xs badge-primary gap-1"><Star size={8} />Best</span>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-base-content/30 mt-1 text-[10px]">Best dark-hour score per night · cloud + moon at that hour.</p>
    </div>
  );
}
