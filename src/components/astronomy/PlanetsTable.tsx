import type { PlanetData } from "@/types/astronomy";
import type { CelestialStatus } from "@/types/celestial";
import { fmtTime, fmtAzimuth } from "@/utils/formatters";
import {
  ArrowUp,
  ArrowDown,
  Compass,
  Info,
  Star,
  Sun,
  Eye,
} from "lucide-react";

/* ── Helpers ── */

/** Planet emoji lookup */
const PLANET_EMOJI: Record<string, string> = {
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
  // From PlanetData (position)
  rise: Date | null;
  set: Date | null;
  altitude: number;
  azimuth: number;
  isAboveHorizon: boolean;
  magnitude: number;
  // From CelestialStatus (state + labels)
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
  planets: PlanetData[],
  celestial: CelestialStatus[],
): MergedPlanet[] {
  // Build lookup from celestial data by body name
  const celestialMap = new Map<string, CelestialStatus>();
  for (const c of celestial) celestialMap.set(c.body, c);

  // First, map all planets
  const merged: MergedPlanet[] = planets.map((p) => {
    const c = celestialMap.get(p.name);
    return {
      name: p.name,
      rise: p.rise,
      set: p.set,
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

  return merged;
}

/* ── Component ── */

interface PlanetsTableProps {
  planets: PlanetData[];
  celestial: CelestialStatus[];
  timezone?: string | undefined;
}

export default function PlanetsTable({
  planets,
  celestial,
  timezone,
}: PlanetsTableProps) {
  const merged = mergePlanetData(planets, celestial);
  const isMoon = (name: string) => name === "Moon";

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
                  {!isMoon(p.name) ? (
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
                  ) : (
                    <span className="text-base-content/30 text-xs">—</span>
                  )}
                </td>

                {/* Azimuth */}
                <td>
                  {!isMoon(p.name) ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base-content text-sm font-medium">
                        {p.azimuth.toFixed(1)}°
                      </span>
                      <span className="text-base-content/40 text-xs">
                        {fmtAzimuth(p.azimuth)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base-content/30 text-xs">—</span>
                  )}
                </td>

                {/* Magnitude */}
                <td>
                  {!isMoon(p.name) ? (
                    <span className="text-base-content text-sm font-medium">
                      {p.magnitude.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-base-content/30 text-xs">—</span>
                  )}
                </td>

                {/* Visibility */}
                <td className="pr-5">
                  {p.elongation !== null ? (
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-base-content/60 inline-flex items-center gap-1 text-xs">
                        <Sun size={10} className="text-amber-400" />
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
              {!isMoon(p.name) && (
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
              )}

              {/* Azimuth */}
              {!isMoon(p.name) && (
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
              )}

              {/* Magnitude */}
              {!isMoon(p.name) && (
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
              )}

              {/* Elongation */}
              {p.elongation !== null && (
                <div>
                  <p className="text-base-content/40 mb-0.5 text-[10px] font-medium tracking-wider uppercase">
                    Elongation
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Sun size={14} className="text-amber-400" />
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
