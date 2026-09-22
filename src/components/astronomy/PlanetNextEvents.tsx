import { useMemo } from "react";
import { Body, Elongation, Illumination } from "astronomy-engine";
import { Orbit, Sun, Star } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import CelestialIcon from "@/components/astronomy/CelestialIcon";
import { fmtShortDate } from "@/utils/formatters";

type EventKind = "Opposition" | "Conjunction" | "Max Elongation";

interface PlanetEvent {
  kind: EventKind;
  date: Date;
  elongation: number;
  magnitude: number | null;
  description: string;
  viewing: string;
}

const BODY_BY_NAME: Record<string, Body> = {
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
};

function describeEvent(planet: string, kind: EventKind, elongation: number): { description: string; viewing: string } {
  if (kind === "Opposition") {
    return {
      description: `${planet} opposite the Sun — rises at sunset, visible all night high in the sky.`,
      viewing: elongation > 170 ? "Excellent" : "Good",
    };
  }
  if (kind === "Max Elongation") {
    return {
      description: `${planet} farthest from the Sun — best chance low near horizon at dawn/dusk.`,
      viewing: elongation >= 30 ? "Prominent" : elongation >= 18 ? "Best window" : "Low",
    };
  }
  return {
    description: `${planet} behind the Sun — not observable.`,
    viewing: "Not visible",
  };
}

function computeForPlanet(planet: string, body: Body): PlanetEvent[] {
  const now = new Date();
  const DAYS = 365;
  const STEP_MS = 24 * 3600000;
  const series: { t: number; e: number }[] = [];
  for (let d = 0; d <= DAYS; d++) {
    const date = new Date(now.getTime() + d * STEP_MS);
    try {
      const e = Elongation(body, date).elongation;
      series.push({ t: date.getTime(), e });
    } catch { /* ignore */ }
  }
  const found: PlanetEvent[] = [];
  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1]!.e;
    const cur = series[i]!.e;
    const next = series[i + 1]!.e;
    const isPeak = cur > prev && cur >= next;
    const isValley = cur < prev && cur <= next;
    if (!isPeak && !isValley) continue;
    const date = new Date(series[i]!.t);
    let kind: EventKind | null = null;
    if (isPeak) {
      if (planet === "Mercury" || planet === "Venus") {
        if (cur >= 18) kind = "Max Elongation";
      } else if (cur >= 150) kind = "Opposition";
    }
    if (isValley && cur <= 10) kind = "Conjunction";
    if (!kind) continue;
    let mag: number | null = null;
    try { mag = Illumination(body, date).mag; } catch { /* ignore */ }
    const { description, viewing } = describeEvent(planet, kind, cur);
    found.push({ kind, date, elongation: cur, magnitude: mag, description, viewing });
  }
  // de-dupe same-kind within 20d, keep strongest
  const filtered: PlanetEvent[] = [];
  for (const ev of found.sort((a, b) => a.date.getTime() - b.date.getTime())) {
    const last = filtered[filtered.length - 1];
    if (last && last.kind === ev.kind && Math.abs(ev.date.getTime() - last.date.getTime()) < 20 * 24 * 3600000) {
      if (ev.elongation > last.elongation) filtered[filtered.length - 1] = ev;
      continue;
    }
    filtered.push(ev);
  }
  return filtered.slice(0, 3);
}

function kindBadge(kind: EventKind): string {
  if (kind === "Opposition") return "badge-primary";
  if (kind === "Max Elongation") return "badge-accent";
  return "badge-ghost";
}

export default function PlanetNextEvents({ planetName }: { planetName: string }) {
  const body = BODY_BY_NAME[planetName];
  const events = useMemo(() => (body ? computeForPlanet(planetName, body) : []), [planetName, body]);

  if (!body || events.length === 0) return null;

  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <SectionHeader icon={Orbit} label={`Next events — ${planetName}`} color="text-primary" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {events.map((ev) => (
          <div key={`${ev.kind}-${ev.date.toISOString()}`} className="card border border-base-content/5 bg-base-300 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary">
                <CelestialIcon name={planetName} size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none">{ev.kind}</p>
                <p className="text-base-content/50 text-xs">{fmtShortDate(ev.date)}</p>
              </div>
              <span className={`ml-auto badge badge-xs shrink-0 ${kindBadge(ev.kind)}`}>{ev.viewing}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-base-content/60">
              <span className="inline-flex items-center gap-1"><Sun size={10} className="text-accent" />{ev.elongation.toFixed(0)}°</span>
              {ev.magnitude != null ? (
                <span className="inline-flex items-center gap-1"><Star size={10} />mag {ev.magnitude.toFixed(1)}</span>
              ) : null}
            </div>
            <p className="text-base-content/60 mt-1.5 line-clamp-2 text-xs leading-relaxed">{ev.description}</p>
            <div className="mt-2">
              <CountdownBadge target={ev.date} className="badge-ghost" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
