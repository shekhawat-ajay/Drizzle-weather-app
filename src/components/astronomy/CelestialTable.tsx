import type { AstronomyData } from "@/types/astronomy";
import type { CelestialStatus } from "@/types/celestial";
import { fmtTime, fmtAzimuth, fmtDurationMs } from "@/utils/formatters";
import {
  ArrowUp,
  ArrowDown,
  Compass,
  Info,
  Star,
  Sun as SunIcon,
  Eye,
} from "lucide-react";

/* ── Helpers ── */

/** Planet emoji lookup */
const PLANET_EMOJI: Record<string, string> = {
  Sun: "☀️",
  Moon: "🌙",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "⛢",
  Neptune: "♆",
};

const MAG_TOOLTIP =
  "Visual magnitude measures brightness as seen from Earth. Lower = brighter. Negative values are very bright (e.g. Venus at −4). Above +6 needs a telescope.";

const ELEV_TOOLTIP =
  "Elevation angle: the height of the object in degrees relative to your horizon. 90° is directly overhead, 0° is on the horizon, and negative values are below the horizon.";

const AZIMUTH_TOOLTIP =
  "Compass direction of the object in degrees. 0° is North (0°), 90° is East (90°), 180° is South (180°), and 270° is West (270°).";

const VISIBILITY_TOOLTIP =
  "Observational conditions based on altitude, angular separation (elongation) from the Sun, and current skylight phases.";

/** Merged data for a single row */
interface MergedPlanet {
  name: string;
  altitude: number;
  azimuth: number;
  isAboveHorizon: boolean;
  magnitude: number;
  state: "ABOVE" | "BELOW";
  pastLabel: string;
  pastType: "RISE" | "SET";
  pastTimestamp: Date | null;
  futureLabel: string;
  futureType: "RISE" | "SET";
  futureTimestamp: Date | null;
  elongation: number | null;
  visibilityNote: string;
}

function mergePlanetData(
  astro: AstronomyData,
  celestial: CelestialStatus | null
): MergedPlanet[] {
  if (!celestial) return [];

  const { sun, moon, planets } = celestial;
  const { sunRiseSet, moonRiseSet, planetsRiseSet } = astro;

  const merged: MergedPlanet[] = [];

  // 1. Sun
  const sunRise = sunRiseSet.sunrise;
  const sunSet = sunRiseSet.sunset;
  const sunIsAbove = sun.altitude > 0;
  const sunState = sunIsAbove ? "ABOVE" : "BELOW";
  const sunPast = sunIsAbove
    ? { label: "Sunrise", type: "RISE" as const, time: sunRise }
    : { label: "Sunset", type: "SET" as const, time: sunSet };
  const sunFuture = sunIsAbove
    ? { label: "Sunset", type: "SET" as const, time: sunSet }
    : { label: "Sunrise", type: "RISE" as const, time: sunRise };

  merged.push({
    name: "Sun",
    altitude: sun.altitude,
    azimuth: sun.azimuth,
    isAboveHorizon: sunIsAbove,
    magnitude: -26.74,
    state: sunState,
    pastLabel: sunPast.label,
    pastType: sunPast.type,
    pastTimestamp: sunPast.time,
    futureLabel: sunFuture.label,
    futureType: sunFuture.type,
    futureTimestamp: sunFuture.time,
    elongation: null,
    visibilityNote: sunIsAbove
      ? "Daylight: floods sky with bright light."
      : "Below horizon: creates twilight/night conditions.",
  });

  // 2. Moon
  const moonRise = moonRiseSet.moonrise;
  const moonSet = moonRiseSet.moonset;
  const moonIsAbove = moon.altitude > 0;
  const moonState = moonIsAbove ? "ABOVE" : "BELOW";
  const moonPast = moonIsAbove
    ? { label: "Moonrise", type: "RISE" as const, time: moonRise }
    : { label: "Moonset", type: "SET" as const, time: moonSet };
  const moonFuture = moonIsAbove
    ? { label: "Moonset", type: "SET" as const, time: moonSet }
    : { label: "Moonrise", type: "RISE" as const, time: moonRise };

  const moonPhaseDesc = `${(moon.phase.fraction * 100).toFixed(0)}% ${moon.phase.name}`;

  merged.push({
    name: "Moon",
    altitude: moon.altitude,
    azimuth: moon.azimuth,
    isAboveHorizon: moonIsAbove,
    magnitude: moon.phase.fraction > 0 ? -12.7 * moon.phase.fraction : -3.0,
    state: moonState,
    pastLabel: moonPast.label,
    pastType: moonPast.type,
    pastTimestamp: moonPast.time,
    futureLabel: moonFuture.label,
    futureType: moonFuture.type,
    futureTimestamp: moonFuture.time,
    elongation: null,
    visibilityNote: moonIsAbove
      ? `Visible (${moonPhaseDesc}). Light wash: moderate.`
      : `Hidden (${moonPhaseDesc}). Sky background: dark.`,
  });

  // 3. Planets
  for (const name of Object.keys(planets) as Array<keyof typeof planets>) {
    const p = planets[name];
    const r = planetsRiseSet[name];
    if (!r) continue;

    const isAbove = p.altitude > 0;
    const state = isAbove ? "ABOVE" : "BELOW";
    const past = isAbove
      ? { label: "Rise", type: "RISE" as const, time: r.rise }
      : { label: "Set", type: "SET" as const, time: r.set };
    const future = isAbove
      ? { label: "Set", type: "SET" as const, time: r.set }
      : { label: "Rise", type: "RISE" as const, time: r.rise };

    merged.push({
      name,
      altitude: p.altitude,
      azimuth: p.azimuth,
      isAboveHorizon: isAbove,
      magnitude: p.magnitude,
      state: state,
      pastLabel: isAbove ? "Risen" : "Set",
      pastType: past.type,
      pastTimestamp: past.time,
      futureLabel: isAbove ? "Will set" : "Will rise",
      futureType: future.type,
      futureTimestamp: future.time,
      elongation: p.elongation,
      visibilityNote: p.visibilityNote,
    });
  }

  return merged;
}

/* ── Component ── */

interface CelestialTableProps {
  astro: AstronomyData;
  celestial: CelestialStatus | null;
  timezone?: string | undefined;
}

export default function CelestialTable({
  astro,
  celestial,
  timezone,
}: CelestialTableProps) {
  const merged = mergePlanetData(astro, celestial);

  if (!merged.length) {
    return (
      <div className="bg-base-200/50 py-8 text-center text-sm text-base-content/40">
        Loading celestial positions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Desktop: Full table (hidden on mobile) ── */}
      <div className="bg-base-200/40 hidden overflow-x-auto rounded-xl border border-teal-500/10 md:block">
        <table className="table-sm table w-full">
          <thead>
            <tr className="text-base-content/50 border-b border-teal-500/10 text-xs tracking-wider uppercase">
              <th className="pl-5 font-medium">Body</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Last Event</th>
              <th className="font-medium">Next Event</th>
              <th className="font-medium">
                <div
                  className="tooltip tooltip-bottom z-[100]"
                  data-tip={ELEV_TOOLTIP}
                >
                  <button
                    type="button"
                    className="inline-flex cursor-help items-center gap-1"
                    aria-label="What is elevation?"
                  >
                    <ArrowUp size={12} />
                    Elev
                    <Info className="text-base-content/30 h-3 w-3" />
                  </button>
                </div>
              </th>
              <th className="font-medium">
                <div
                  className="tooltip tooltip-bottom z-[100]"
                  data-tip={AZIMUTH_TOOLTIP}
                >
                  <button
                    type="button"
                    className="inline-flex cursor-help items-center gap-1"
                    aria-label="What is azimuth?"
                  >
                    <Compass size={12} />
                    Azimuth
                    <Info className="text-base-content/30 h-3 w-3" />
                  </button>
                </div>
              </th>
              <th className="font-medium">
                <div
                  className="tooltip tooltip-bottom z-[100]"
                  data-tip={MAG_TOOLTIP}
                >
                  <button
                    type="button"
                    className="inline-flex cursor-help items-center gap-1"
                    aria-label="What is magnitude?"
                  >
                    <Star size={12} />
                    Mag
                    <Info className="text-base-content/30 h-3 w-3" />
                  </button>
                </div>
              </th>
              <th className="pr-5 font-medium">
                <div
                  className="tooltip tooltip-bottom z-[100] tooltip-left"
                  data-tip={VISIBILITY_TOOLTIP}
                >
                  <button
                    type="button"
                    className="inline-flex cursor-help items-center gap-1"
                    aria-label="What is visibility?"
                  >
                    <Eye size={12} />
                    Visibility
                    <Info className="text-base-content/30 h-3 w-3" />
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {merged.map((p) => (
              <tr
                key={p.name}
                className="hover:bg-base-200/60 border-b border-teal-500/5 transition-colors"
              >
                {/* Body name */}
                <td className="pl-5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">
                      {PLANET_EMOJI[p.name] ?? "🪐"}
                    </span>
                    <span className="text-base-content font-medium">
                      {p.name}
                    </span>
                  </div>
                </td>

                {/* State badge */}
                <td>
                  <StateBadge state={p.state} />
                </td>

                {/* Past event */}
                <td>
                  <div className="flex flex-col items-start gap-0.5">
                    {p.pastTimestamp && (
                      <span className="text-base-content/70 text-xs">
                        {p.pastType === "RISE" ? "↑" : "↓"}{" "}
                        {fmtTime(p.pastTimestamp, timezone)}
                      </span>
                    )}
                    <span className="text-base-content/40 text-[10px]">
                      {p.pastLabel}
                    </span>
                  </div>
                </td>

                {/* Future event */}
                <td>
                  <div className="flex flex-col items-start gap-0.5">
                    {p.futureTimestamp && (
                      <span className="text-base-content text-xs font-medium">
                        {p.futureType === "RISE" ? "↑" : "↓"}{" "}
                        {fmtTime(p.futureTimestamp, timezone)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-400">
                      <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-teal-400" />
                      {p.futureLabel}
                    </span>
                  </div>
                </td>

                {/* Elevation */}
                <td>
                  <div className="flex items-center gap-1">
                    {p.isAboveHorizon ? (
                       <ArrowUp size={14} className="text-emerald-400" />
                    ) : (
                       <ArrowDown size={14} className="text-rose-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        p.isAboveHorizon
                          ? "text-emerald-400"
                          : "text-base-content/50"
                      }`}
                    >
                      {p.altitude.toFixed(1)}°
                    </span>
                  </div>
                </td>

                {/* Azimuth */}
                <td>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base-content text-sm font-medium">
                      {p.azimuth.toFixed(1)}°
                    </span>
                    <span className="text-base-content/40 text-xs">
                      {fmtAzimuth(p.azimuth)}
                    </span>
                  </div>
                </td>

                {/* Magnitude */}
                <td>
                  <span className="text-base-content text-sm font-medium">
                    {p.magnitude.toFixed(1)}
                  </span>
                </td>

                {/* Visibility */}
                <td className="pr-5">
                  {p.elongation !== null ? (
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-base-content/60 inline-flex items-center gap-1 text-xs">
                        <SunIcon size={10} className="text-amber-400" />
                        {p.elongation.toFixed(0)}° from Sun
                      </span>
                      <span className="text-base-content/40 max-w-[180px] text-[10px] leading-tight">
                        {p.visibilityNote}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base-content/40 text-xs">
                      {p.visibilityNote || "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: Card list (hidden on desktop) ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {merged.map((p) => (
          <div
            key={p.name}
            className="bg-base-200/40 rounded-xl border border-teal-500/10 p-4"
          >
            {/* Header: name + state */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">
                  {PLANET_EMOJI[p.name] ?? "🪐"}
                </span>
                <span className="text-base-content text-base font-semibold">
                  {p.name}
                </span>
              </div>
              <StateBadge state={p.state} />
            </div>

            {/* Past + Future event labels */}
            <div className="bg-base-300/30 mb-3 space-y-1 rounded-lg border border-teal-500/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-base-content/40 text-[10px]">
                  {p.pastLabel}
                </span>
                {p.pastTimestamp && (
                  <span className="text-base-content/30 text-[10px]">
                    ({fmtTime(p.pastTimestamp, timezone)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-400">
                  <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-teal-400" />
                  {p.futureLabel}
                </span>
                {p.futureTimestamp && (
                  <span className="text-base-content/30 text-[10px]">
                    ({fmtTime(p.futureTimestamp, timezone)})
                  </span>
                )}
              </div>
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {/* Elevation */}
              <div>
                <p className="text-base-content/40 mb-0.5 text-[10px] font-medium tracking-wider uppercase">
                  Elevation
                </p>
                <div className="flex items-center gap-1.5">
                  {p.isAboveHorizon ? (
                    <ArrowUp size={14} className="text-emerald-400" />
                  ) : (
                    <ArrowDown size={14} className="text-rose-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      p.isAboveHorizon
                        ? "text-emerald-400"
                        : "text-base-content/50"
                    }`}
                  >
                    {p.altitude.toFixed(1)}°
                  </span>
                </div>
              </div>

              {/* Azimuth */}
              <div>
                <p className="text-base-content/40 mb-0.5 text-[10px] font-medium tracking-wider uppercase">
                  Azimuth
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content text-sm font-medium">
                    {p.azimuth.toFixed(1)}°
                  </span>
                  <span className="text-base-content/40 text-xs">
                    {fmtAzimuth(p.azimuth)}
                  </span>
                </div>
              </div>

              {/* Magnitude */}
              <div>
                <p className="text-base-content/40 mb-0.5 text-[10px] font-medium tracking-wider uppercase">
                  Magnitude
                </p>
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-amber-400" />
                  <span className="text-base-content text-sm font-medium">
                    {p.magnitude.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Elongation */}
              {p.elongation !== null && (
                <div>
                  <p className="text-base-content/40 mb-0.5 text-[10px] font-medium tracking-wider uppercase">
                    Elongation
                  </p>
                  <div className="flex items-center gap-1.5">
                    <SunIcon size={14} className="text-amber-400" />
                    <span className="text-base-content text-sm font-medium">
                      {p.elongation.toFixed(0)}°
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visibility note */}
            {p.visibilityNote && (
              <p className="text-base-content/40 mt-3 border-t border-teal-500/5 pt-2 text-[10px] leading-relaxed">
                {p.visibilityNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Shared state badge ── */

function StateBadge({ state }: { state: "ABOVE" | "BELOW" | null }) {
  if (state === "ABOVE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Above
      </span>
    );
  }
  if (state === "BELOW") {
    return (
      <span className="bg-base-content/5 text-base-content/40 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium">
        Below
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-400">
      Unknown
    </span>
  );
}
