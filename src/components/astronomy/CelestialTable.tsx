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

/** Merged data for a single row */
interface MergedPlanet {
  name: string;
  altitude: number;
  azimuth: number;
  isAboveHorizon: boolean;
  magnitude: number;
  state: "ABOVE" | "BELOW" | null;
  pastLabel: string;
  futureLabel: string;
  elongation: number | null;
  visibilityNote: string;
  pastType: "RISE" | "SET" | null;
  futureType: "RISE" | "SET" | null;
  pastTimestamp: Date | null;
  futureTimestamp: Date | null;
}

function mergePlanetData(
  data: AstronomyData,
  celestial: CelestialStatus[],
): MergedPlanet[] {
  const nowMs = Date.now();

  // 1. Synthesize Sun
  const { sun, sunPosition } = data;
  const sunEvents = [
    { type: "RISE" as const, ts: sun.sunrise },
    { type: "SET" as const, ts: sun.sunset },
    { type: "RISE" as const, ts: data.nextRiseSet.nextSunrise },
    { type: "SET" as const, ts: data.nextRiseSet.prevSunset },
  ].filter((e) => e.ts !== null) as { type: "RISE" | "SET"; ts: Date }[];

  const pastSunEvents = sunEvents.filter((e) => e.ts.getTime() <= nowMs).sort((a, b) => b.ts.getTime() - a.ts.getTime());
  const futureSunEvents = sunEvents.filter((e) => e.ts.getTime() > nowMs).sort((a, b) => a.ts.getTime() - b.ts.getTime());
  
  const pastSun = pastSunEvents[0] || null;
  const futureSun = futureSunEvents[0] || null;

  const sunRow: MergedPlanet = {
    name: "Sun",
    altitude: sunPosition.altitude,
    azimuth: sunPosition.azimuth,
    isAboveHorizon: sunPosition.isAboveHorizon,
    magnitude: -26.74, 
    state: sunPosition.isAboveHorizon ? "ABOVE" : "BELOW",
    pastType: pastSun?.type || null,
    pastTimestamp: pastSun?.ts || null,
    pastLabel: pastSun ? `${fmtDurationMs(nowMs - pastSun.ts.getTime())} ago` : "--",
    futureType: futureSun?.type || null,
    futureTimestamp: futureSun?.ts || null,
    futureLabel: futureSun ? `in ${fmtDurationMs(futureSun.ts.getTime() - nowMs)}` : "--",
    elongation: null,
    visibilityNote: "Our closest star. NEVER look directly without a solar filter.",
  };

  // 2. Synthesize Moon
  const { moonPosition } = data;
  let pastMoonLabel = "--";
  let futureMoonLabel = "--";
  const prevMoon = moonPosition.previousEvent;
  const nextMoon = moonPosition.nextEvent;

  if (prevMoon) pastMoonLabel = `${fmtDurationMs(nowMs - prevMoon.getTime())} ago`;
  if (nextMoon) futureMoonLabel = `in ${fmtDurationMs(nextMoon.getTime() - nowMs)}`;

  const moonRow: MergedPlanet = {
    name: "Moon",
    altitude: moonPosition.altitude,
    azimuth: moonPosition.azimuth,
    isAboveHorizon: moonPosition.isAboveHorizon,
    magnitude: -12.7, 
    state: moonPosition.isAboveHorizon ? "ABOVE" : "BELOW",
    pastType: moonPosition.isAboveHorizon ? "RISE" : "SET",
    pastTimestamp: prevMoon,
    pastLabel: pastMoonLabel,
    futureType: moonPosition.isAboveHorizon ? "SET" : "RISE",
    futureTimestamp: nextMoon,
    futureLabel: futureMoonLabel,
    elongation: null,
    visibilityNote: "Visible consistently except during New Moon phases.",
  };

  // 3. Process Planets
  const celestialMap = new Map<string, CelestialStatus>();
  for (const c of celestial) celestialMap.set(c.body, c);

  const planetRows: MergedPlanet[] = data.planets.map((p) => {
    const c = celestialMap.get(p.name);
    return {
      name: p.name,
      altitude: p.altitude,
      azimuth: p.azimuth,
      isAboveHorizon: p.isAboveHorizon,
      magnitude: p.magnitude,
      state: c?.state ?? null,
      pastLabel: c?.pastLabel ?? "",
      futureLabel: c?.futureLabel ?? "",
      elongation: c?.elongation ?? null,
      visibilityNote: c?.visibilityNote ?? "",
      pastType: c?.pastEvent?.type ?? null,
      futureType: c?.futureEvent?.type ?? null,
      pastTimestamp: c?.pastEvent?.timestamp ?? null,
      futureTimestamp: c?.futureEvent?.timestamp ?? null,
    };
  });

  return [sunRow, moonRow, ...planetRows];
}

/* ── Component ── */

interface CelestialTableProps {
  data: AstronomyData;
  celestial: CelestialStatus[];
  timezone?: string | undefined;
}

export default function CelestialTable({
  data,
  celestial,
  timezone,
}: CelestialTableProps) {
  const merged = mergePlanetData(data, celestial);

  return (
    <>
      {/* ── Desktop: Table (hidden on mobile) ── */}
      <div className="bg-base-200/40 hidden overflow-x-auto rounded-xl border border-teal-500/10 md:block">
        <table className="table-sm table w-full">
          <thead>
            <tr className="text-base-content/50 border-b border-teal-500/10 text-xs tracking-wider uppercase">
              <th className="pl-5 font-medium">Body</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Last Event</th>
              <th className="font-medium">Next Event</th>
              <th className="font-medium">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp size={12} />
                  Elev
                </span>
              </th>
              <th className="font-medium">
                <span className="inline-flex items-center gap-1">
                  <Compass size={12} />
                  Azimuth
                </span>
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
                <span className="inline-flex items-center gap-1">
                  <Eye size={12} />
                  Visibility
                </span>
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
    </>
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
