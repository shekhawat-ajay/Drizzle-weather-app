import type { SunPositionData } from "@/types/astronomy";
import { fmtTime } from "@/utils/formatters";

interface SunPositionArcProps {
  sunPosition: SunPositionData;
  sunrise: Date | null;
  sunset: Date | null;
  timezone?: string | undefined;
}

// ── Hoisted constants ──
const W = 400;
const H = 130;
const PAD_X = 40;
const HORIZON_Y = 100;
const PEAK_Y = 28;

// Generate a gentle bell curve with eased edges
function buildCurvePoints(steps: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = PAD_X + t * (W - 2 * PAD_X);
    // Ease-in-out sine curve: gentler at edges, peaks in middle
    // Range -0.08π to 1.08π for subtle dip below horizon
    const angle = -0.08 * Math.PI + t * 1.16 * Math.PI;
    const sinVal = Math.sin(angle);
    const y = HORIZON_Y - sinVal * (HORIZON_Y - PEAK_Y);
    points.push({ x, y });
  }
  return points;
}

function pointsToPath(
  pts: { x: number; y: number }[],
  start: number,
  end: number,
): string {
  const sliced = pts.slice(start, end + 1);
  return sliced
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

// Find the step index where the curve crosses the horizon
function findHorizonStep(
  pts: { x: number; y: number }[],
  fromStep: number,
  toStep: number,
): number {
  for (let i = fromStep; i <= toStep; i++) {
    if (pts[i].y >= HORIZON_Y) return Math.max(fromStep, i - 1);
  }
  return toStep;
}

const TOTAL_STEPS = 80;
const ALL_POINTS = buildCurvePoints(TOTAL_STEPS);

// Hoisted SVG defs
const svgDefs = (
  <defs>
    <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="traveledGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
      <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
    </linearGradient>
  </defs>
);

export default function SunPositionArc({
  sunPosition,
  sunrise,
  sunset,
  timezone,
}: SunPositionArcProps) {
  const { arcFraction, altitude, noonAltitude, isAboveHorizon } = sunPosition;

  const sunFrac =
    arcFraction !== null ? Math.max(0, Math.min(1, arcFraction)) : null;
  const sunStep = sunFrac !== null ? Math.round(sunFrac * TOTAL_STEPS) : null;
  const sunPt = sunStep !== null ? ALL_POINTS[sunStep] : null;

  // Full arc path (background track)
  const fullPath = pointsToPath(ALL_POINTS, 0, TOTAL_STEPS);

  // Golden path: only the traveled portion ABOVE the horizon
  let goldenPath: string | null = null;
  if (sunStep !== null && sunStep > 0) {
    // Find where the arc first rises above horizon
    let aboveStart = 0;
    for (let i = 0; i <= sunStep; i++) {
      if (ALL_POINTS[i].y < HORIZON_Y) {
        aboveStart = i;
        break;
      }
    }
    // Clamp to only above-horizon portion
    const aboveEnd = Math.min(
      sunStep,
      findHorizonStep(ALL_POINTS, aboveStart, sunStep),
    );
    if (aboveEnd > aboveStart && ALL_POINTS[aboveEnd].y < HORIZON_Y) {
      goldenPath = pointsToPath(ALL_POINTS, aboveStart, sunStep);
    }
  }

  // Below-horizon traveled path (subtle)
  let belowPath: string | null = null;
  if (sunStep !== null && sunStep > 0 && ALL_POINTS[0].y >= HORIZON_Y) {
    let belowEnd = 0;
    for (let i = 0; i <= sunStep; i++) {
      if (ALL_POINTS[i].y < HORIZON_Y) {
        belowEnd = i;
        break;
      }
    }
    if (belowEnd > 0) {
      belowPath = pointsToPath(ALL_POINTS, 0, belowEnd);
    }
  }

  // Remaining arc
  const remainingPath =
    sunStep !== null && sunStep < TOTAL_STEPS
      ? pointsToPath(ALL_POINTS, sunStep, TOTAL_STEPS)
      : null;

  // Status
  let statusText: string;
  let statusColor: string;
  if (isAboveHorizon) {
    statusText = `${Math.round(altitude)}° above horizon`;
    statusColor = "text-amber-400";
  } else if (altitude > -6) {
    statusText = "Twilight";
    statusColor = "text-orange-400/70";
  } else {
    statusText = "Below horizon";
    statusColor = "text-base-content/40";
  }

  // Dynamic background gradient based on sun status
  const bgGradient = isAboveHorizon
    ? "bg-gradient-to-br from-sky-600 to-sky-400"
    : altitude > -6
      ? "bg-gradient-to-br from-slate-600 to-sky-800"
      : "bg-gradient-to-br from-slate-700 to-slate-900";

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/10">
      {/* Header */}
      <div className="bg-base-200/40 px-5 pt-4 pb-2">
        <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
          Sun Position
        </p>
      </div>

      {/* Arc visualization */}
      <div className={`relative ${bgGradient}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-label="Sun position arc"
        >
          {svgDefs}

          {/* Horizon line */}
          <line
            x1="0"
            y1={HORIZON_Y}
            x2={W}
            y2={HORIZON_Y}
            stroke="white"
            strokeOpacity="0.15"
            strokeWidth="1"
          />

          {/* Full arc track (dim) */}
          <path
            d={fullPath}
            fill="none"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="1.5"
          />

          {/* Below-horizon traveled (subtle white) */}
          {belowPath ? (
            <path
              d={belowPath}
              fill="none"
              stroke="white"
              strokeOpacity="0.25"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : null}

          {/* Above-horizon traveled (golden gradient) */}
          {goldenPath ? (
            <path
              d={goldenPath}
              fill="none"
              stroke="url(#traveledGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : null}

          {/* Remaining arc (subtle white) */}
          {remainingPath && isAboveHorizon ? (
            <path
              d={remainingPath}
              fill="none"
              stroke="white"
              strokeOpacity="0.18"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ) : null}

          {/* Sunrise time */}
          <text
            x={PAD_X}
            y={HORIZON_Y + 16}
            textAnchor="middle"
            fill="white"
            fillOpacity="0.45"
            fontSize="9"
            fontFamily="inherit"
          >
            {fmtTime(sunrise, timezone)}
          </text>

          {/* Sunset time */}
          <text
            x={W - PAD_X}
            y={HORIZON_Y + 16}
            textAnchor="middle"
            fill="white"
            fillOpacity="0.45"
            fontSize="9"
            fontFamily="inherit"
          >
            {fmtTime(sunset, timezone)}
          </text>

          {/* Horizon label */}
          <text
            x={10}
            y={HORIZON_Y - 5}
            fill="white"
            fillOpacity="0.2"
            fontSize="7"
            fontFamily="inherit"
          >
            Horizon
          </text>

          {/* Sun SVG icon (above horizon) — medium size */}
          {sunPt && isAboveHorizon ? (
            <g filter="url(#sunGlow)">
              <image
                href="/sun.svg"
                x={sunPt.x - 14}
                y={sunPt.y - 14}
                width="28"
                height="28"
              />
            </g>
          ) : null}

          {/* Sun below horizon — dim small icon on horizon */}
          {!isAboveHorizon ? (
            <image
              href="/sun.svg"
              x={W / 2 - 10}
              y={HORIZON_Y - 10}
              width="20"
              height="20"
              opacity="0.2"
            />
          ) : null}

          {/* Altitude label */}
          {sunPt && isAboveHorizon ? (
            <text
              x={sunPt.x}
              y={sunPt.y - 18}
              textAnchor="middle"
              fill="white"
              fillOpacity="0.8"
              fontSize="10"
              fontWeight="600"
              fontFamily="inherit"
            >
              {Math.round(altitude)}°
            </text>
          ) : null}
        </svg>
      </div>

      {/* Status bar */}
      <div className="bg-base-200/40 flex items-center justify-between px-5 py-2.5 text-xs">
        <span className={statusColor + " font-medium"}>{statusText}</span>
        {noonAltitude > 0 ? (
          <span className="text-base-content/30">
            Peak {Math.round(noonAltitude)}°
          </span>
        ) : null}
      </div>
    </div>
  );
}
