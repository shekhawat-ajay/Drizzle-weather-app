import { Info } from "lucide-react";
import type { SunData, SunPositionData, NextRiseSetData } from "@/types/astronomy";
import { fmtTime } from "@/utils/formatters";

interface TwilightTableProps {
  sun: SunData;
  sunPosition: SunPositionData;
  nextRiseSet: NextRiseSetData; // Used for "True Night" duration calculations spanning across midnight
  timezone?: string;
}

const safeDiff = (d1: Date | null, d2: Date | null) => {
  if (!d1 || !d2) return null;
  return Math.abs(d1.getTime() - d2.getTime());
};

const formatDur = (ms: number | null) => {
  if (ms === null) return "--";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function TwilightTable({
  sun,
  sunPosition,
  nextRiseSet,
  timezone,
}: TwilightTableProps) {
  // Compute Durations
  const civilMs = safeDiff(sun.sunrise, sun.civilDawn);
  const nauticalMs = safeDiff(sun.civilDawn, sun.nauticalDawn);
  const astroMs = safeDiff(sun.nauticalDawn, sun.astronomicalDawn);
  const dayMs = safeDiff(sun.sunset, sun.sunrise);

  // True Night: From today's astronomical dusk to tomorrow's astronomical dawn
  let nightMs: number | null = null;
  if (sun.astronomicalDusk && nextRiseSet.nextAstronomicalDawn) {
    nightMs = nextRiseSet.nextAstronomicalDawn.getTime() - sun.astronomicalDusk.getTime();
    if (nightMs < 0) nightMs = null; // Failsafe
  }

  // Current altitude to highlight the active row
  const alt = sunPosition.altitude;

  // Row data
  const rows = [
    {
      id: "day",
      name: "Daytime",
      tooltip: "The sun is completely above the horizon. Full daylight conditions.",
      elevation: "> 0°",
      isActive: alt > 0,
      morning: sun.sunrise ? fmtTime(sun.sunrise, timezone) : "--",
      evening: sun.sunset ? fmtTime(sun.sunset, timezone) : "--",
      duration: formatDur(dayMs),
    },
    {
      id: "civil",
      name: "Civil Twilight",
      tooltip:
        "Enough light for most outdoor activities without artificial lighting. Only the brightest stars/planets are visible.",
      elevation: "0° to -6°",
      isActive: alt <= 0 && alt > -6,
      morning:
        sun.civilDawn && sun.sunrise
          ? `${fmtTime(sun.civilDawn, timezone)} – ${fmtTime(sun.sunrise, timezone)}`
          : "--",
      evening:
        sun.sunset && sun.civilDusk
          ? `${fmtTime(sun.sunset, timezone)} – ${fmtTime(sun.civilDusk, timezone)}`
          : "--",
      duration: formatDur(civilMs),
    },
    {
      id: "nautical",
      name: "Nautical Twilight",
      tooltip:
        "Horizon remains visible. General outlines of shapes are visible, but outdoor activities require artificial light.",
      elevation: "-6° to -12°",
      isActive: alt <= -6 && alt > -12,
      morning:
        sun.nauticalDawn && sun.civilDawn
          ? `${fmtTime(sun.nauticalDawn, timezone)} – ${fmtTime(sun.civilDawn, timezone)}`
          : "--",
      evening:
        sun.civilDusk && sun.nauticalDusk
          ? `${fmtTime(sun.civilDusk, timezone)} – ${fmtTime(sun.nauticalDusk, timezone)}`
          : "--",
      duration: formatDur(nauticalMs),
    },
    {
      id: "astronomical",
      name: "Astronomical Twilight",
      tooltip:
        "The sky starts to look truly dark. Excellent for stargazing, except for faint deep-sky objects depending on light pollution.",
      elevation: "-12° to -18°",
      isActive: alt <= -12 && alt > -18,
      morning:
        sun.astronomicalDawn && sun.nauticalDawn
          ? `${fmtTime(sun.astronomicalDawn, timezone)} – ${fmtTime(sun.nauticalDawn, timezone)}`
          : "--",
      evening:
        sun.nauticalDusk && sun.astronomicalDusk
          ? `${fmtTime(sun.nauticalDusk, timezone)} – ${fmtTime(sun.astronomicalDusk, timezone)}`
          : "--",
      duration: formatDur(astroMs),
    },
    {
      id: "night",
      name: "True Night",
      tooltip: "The sun does not contribute any light to the sky. Optimal conditions for astronomical observations.",
      elevation: "< -18°",
      isActive: alt <= -18,
      morning: sun.astronomicalDawn ? `Ends ${fmtTime(sun.astronomicalDawn, timezone)}` : "--",
      evening: sun.astronomicalDusk ? `Starts ${fmtTime(sun.astronomicalDusk, timezone)}` : "--",
      duration: formatDur(nightMs),
    },
  ];

  return (
    <div className="card rounded-2xl bg-base-200/50 shadow-sm border border-base-content/5 mt-6">
      <div className="card-body p-0">
        <div className="px-6 py-4 border-b border-base-content/10 bg-base-300/30 rounded-t-2xl">
          <h2 className="text-sm font-bold text-base-content tracking-wide uppercase">
            Twilight Phases
          </h2>
        </div>
        <div className="overflow-x-auto pb-4">
          <table className="table table-sm md:table-md w-full text-left border-collapse">
            <thead className="bg-base-200/50 text-base-content/70">
              <tr>
                <th className="font-semibold px-6">Phase</th>
                <th className="font-semibold">Elevation</th>
                <th className="font-semibold">Morning</th>
                <th className="font-semibold">Evening</th>
                <th className="font-semibold text-right px-6">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-content/5">
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={`
                    transition-colors duration-200 ease-in-out
                    ${r.isActive ? "bg-amber-400/10" : "hover:bg-base-300/40"}
                  `}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          r.isActive ? "text-amber-500" : "text-base-content"
                        }`}
                      >
                        {r.name}
                      </span>
                      <div
                        className={`tooltip ${
                          i < 2 ? "tooltip-bottom" : "tooltip-top"
                        } tooltip-right sm:tooltip-right before:w-48 before:whitespace-normal outline-none z-50`}
                        style={{ zIndex: 50 }}
                        data-tip={r.tooltip}
                      >
                        <Info className="w-3.5 h-3.5 text-base-content/40 hover:text-base-content/80 cursor-help transition-colors" />
                      </div>
                    </div>
                  </td>
                  <td className="text-base-content/70 whitespace-nowrap">{r.elevation}</td>
                  <td className="text-base-content/80 whitespace-nowrap">{r.morning}</td>
                  <td className="text-base-content/80 whitespace-nowrap">{r.evening}</td>
                  <td className="text-right px-6 font-medium text-base-content/90 whitespace-nowrap">
                    {r.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
