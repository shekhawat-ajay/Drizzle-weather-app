import { useMemo } from "react";
import { Body, Elongation, Illumination } from "astronomy-engine";
import CelestialIcon from "@/components/astronomy/CelestialIcon";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import SectionHeader from "@/components/astronomy/SectionHeader";
import { Orbit, CalendarDays, Eye, Star, Info, Sun } from "lucide-react";
import { fmtShortDate, fmtTime } from "@/utils/formatters";

type EventKind = "Opposition" | "Conjunction" | "Max Elongation";

interface PlanetaryEvent {
  planet: string;
  body: Body;
  kind: EventKind;
  date: Date;
  elongation: number;
  magnitude: number | null;
  description: string;
  viewing: string;
}

const PLANETS: { name: string; body: Body }[] = [
  { name: "Mercury", body: Body.Mercury },
  { name: "Venus", body: Body.Venus },
  { name: "Mars", body: Body.Mars },
  { name: "Jupiter", body: Body.Jupiter },
  { name: "Saturn", body: Body.Saturn },
  { name: "Uranus", body: Body.Uranus },
  { name: "Neptune", body: Body.Neptune },
];

function describeEvent(planet: string, kind: EventKind, elongation: number): { description: string; viewing: string } {
  if (kind === "Opposition") {
    return {
      description: `${planet} opposite the Sun — rises at sunset, visible all night high in the sky.`,
      viewing: elongation > 170 ? "Excellent all-night visibility" : "Good evening visibility",
    };
  }
  if (kind === "Max Elongation") {
    const isMercury = planet === "Mercury";
    return {
      description: `${planet} farthest from the Sun in the sky — best chance to spot it low near horizon at ${isMercury ? "dawn or dusk" : "evening/morning"}.`,
      viewing: elongation >= 30 ? "Prominent — easy with naked eye (Venus)" : elongation >= 18 ? "Best window for Mercury — find dark horizon" : "Low, needs clear horizon",
    };
  }
  return {
    description: `${planet} behind the Sun — not observable, lost in solar glare.`,
    viewing: "Not visible — too close to Sun",
  };
}

function computeEvents(): PlanetaryEvent[] {
  const now = new Date();
  const events: PlanetaryEvent[] = [];
  const DAYS = 365;
  const STEP_MS = 24 * 3600000; // 1 day

  for (const { name, body } of PLANETS) {
    const series: { t: number; e: number }[] = [];
    for (let d = 0; d <= DAYS; d++) {
      const date = new Date(now.getTime() + d * STEP_MS);
      try {
        const e = Elongation(body, date).elongation;
        series.push({ t: date.getTime(), e });
      } catch { /* ignore */ }
    }
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
        if (name === "Mercury" || name === "Venus") {
          if (cur >= 18) kind = "Max Elongation";
        } else if (cur >= 150) kind = "Opposition";
      }
      if (isValley && cur <= 10) kind = "Conjunction";
      if (!kind) continue;
      let mag: number | null = null;
      try { mag = Illumination(body, date).mag; } catch { /* ignore */ }
      const { description, viewing } = describeEvent(name, kind, cur);
      events.push({ planet: name, body, kind, date, elongation: cur, magnitude: mag, description, viewing });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  const filtered: PlanetaryEvent[] = [];
  for (const ev of events) {
    const last = filtered[filtered.length - 1];
    if (last && last.planet === ev.planet && last.kind === ev.kind && Math.abs(ev.date.getTime() - last.date.getTime()) < 20 * 24 * 3600000) {
      if (ev.elongation > last.elongation) filtered[filtered.length - 1] = ev;
      continue;
    }
    filtered.push(ev);
  }

  return filtered.slice(0, 12);
}

function kindStyle(kind: EventKind): string {
  if (kind === "Opposition") return "bg-primary/12 text-primary border-primary/15";
  if (kind === "Max Elongation") return "bg-accent/12 text-accent border-accent/15";
  return "bg-base-content/5 text-base-content/60 border-base-content/10";
}

export default function PlanetaryEventsTimeline() {
  const events = useMemo(() => computeEvents(), []);

  if (events.length === 0) return null;

  return (
    <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
      <SectionHeader icon={Orbit} label="Planetary Events — Next 12 Months" color="text-primary" />
      <div className="relative">
        <div className="absolute left-4 top-6 bottom-6 w-px bg-base-content/10 hidden sm:block" />
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={`${ev.planet}-${ev.kind}-${ev.date.toISOString()}`} className="relative flex gap-3">
              <div className={`hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-base-300 ${kindStyle(ev.kind)}`}>
                <CelestialIcon name={ev.planet} size={14} />
              </div>
              <div className={`flex flex-1 flex-col rounded-xl border bg-base-300 p-3 sm:p-4 ${kindStyle(ev.kind)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">{ev.planet}</span>
                      <span className={`badge badge-xs ${ev.kind === "Opposition" ? "badge-primary" : ev.kind === "Max Elongation" ? "badge-accent" : "badge-ghost"}`}>{ev.kind}</span>
                      <span className="inline-flex items-center gap-1 text-xs opacity-60"><Sun size={10} /> {ev.elongation.toFixed(0)}°</span>
                      {ev.magnitude != null ? (
                        <span className="inline-flex items-center gap-1 text-xs opacity-60"><Star size={10} /> mag {ev.magnitude.toFixed(1)}</span>
                      ) : null}
                    </div>
                    <p className="text-xs opacity-60 flex items-center gap-1 mt-1">
                      <CalendarDays size={12} /> {fmtShortDate(ev.date)} · {fmtTime(ev.date)}
                    </p>
                    <p className="text-xs leading-relaxed opacity-80 mt-1.5">{ev.description}</p>
                    <p className="text-xs mt-1 inline-flex items-center gap-1 rounded-full bg-base-100 px-2 py-0.5">
                      <Eye size={10} /> {ev.viewing}
                    </p>
                  </div>
                  <CountdownBadge target={ev.date} className="bg-base-100/50 text-base-content/70 text-xs shrink-0" />
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] opacity-40">
                  <Info size={10} /> Elongation = Sun-Earth-Planet angle; Opposition ~180° best, Conjunction ~0° hidden.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
