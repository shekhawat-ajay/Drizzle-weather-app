import { useMemo } from "react";
import { Clock, Sunset, Sunrise, Moon } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import { fmtTime } from "@/utils/formatters";
import type { AstronomyData } from "@/types/astronomy";

interface TonightStripProps {
  astronomyData: AstronomyData;
  timezone?: string;
}

interface StripEvent {
  key: string;
  label: string;
  time: Date | null;
  icon: typeof Sunset;
  accent: "accent" | "primary" | "muted";
  hint?: string;
}

/**
 * Tonight at a glance — single chronological strip:
 * sunset → civil/nautical/astro dusk → moonrise/set → next sunrise.
 * Uses only existing astronomyData (no new fetch).
 */
export default function TonightStrip({ astronomyData, timezone }: TonightStripProps) {
  const { sun, nextRiseSet } = astronomyData;

  const events = useMemo<StripEvent[]>(() => {
    const list: StripEvent[] = [
      { key: "sunset", label: "Sunset", time: sun.sunset, icon: Sunset, accent: "accent", hint: "Golden hour ends" },
      { key: "civilDusk", label: "Civil dusk", time: sun.civilDusk, icon: Clock, accent: "accent", hint: "Brightest stars out" },
      { key: "nauticalDusk", label: "Nautical dusk", time: sun.nauticalDusk, icon: Clock, accent: "primary", hint: "Horizon fades" },
      { key: "astroDusk", label: "True night", time: sun.astronomicalDusk, icon: Moon, accent: "primary", hint: "Best darkness" },
      { key: "moonrise", label: "Moonrise", time: nextRiseSet.nextMoonrise, icon: Moon, accent: "primary" },
      { key: "moonset", label: "Moonset", time: nextRiseSet.nextMoonset, icon: Moon, accent: "muted" },
      { key: "sunrise", label: "Sunrise", time: nextRiseSet.nextSunrise, icon: Sunrise, accent: "accent", hint: "Night ends" },
    ];
    // Chronological, nulls last
    return list
      .filter((e) => e.time !== null)
      .sort((a, b) => (a.time as Date).getTime() - (b.time as Date).getTime());
  }, [sun, nextRiseSet]);

  const nextFuture = useMemo(() => {
    const now = Date.now();
    return events.find((e) => (e.time as Date).getTime() > now) ?? null;
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionHeader icon={Clock} label="Tonight at a glance" color="text-primary" />
        {nextFuture?.time ? (
          <CountdownBadge target={nextFuture.time} label={nextFuture.label} className="badge-primary" />
        ) : null}
      </div>
      <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {events.map((e) => {
          const isPast = (e.time as Date).getTime() <= Date.now();
          const Icon = e.icon;
          const isNext = nextFuture?.key === e.key;
          return (
            <div
              key={e.key}
              className={`flex min-w-[132px] flex-shrink-0 snap-start flex-col items-center rounded-lg border px-3 py-3 text-center transition-colors ${
                isNext
                  ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                  : isPast
                    ? "bg-base-300 border-base-content/5 opacity-45"
                    : "bg-base-300 border-base-content/10"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  e.accent === "accent" ? "bg-accent/12 text-accent" : e.accent === "primary" ? "bg-primary/12 text-primary" : "bg-base-content/5 text-base-content/60"
                }`}
              >
                <Icon size={15} />
              </span>
              <p className="mt-1.5 text-xs font-medium">{e.label}</p>
              <p className="font-mono text-sm font-semibold">{fmtTime(e.time, timezone)}</p>
              {e.hint ? <p className="text-base-content/40 text-[10px]">{e.hint}</p> : null}
              {isNext ? (
                <span className="mt-1 inline-block h-1 w-1 animate-pulse rounded-full bg-primary" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
