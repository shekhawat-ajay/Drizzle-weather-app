import type { SunPositionData } from "@/types/astronomy";
import { fmtTime } from "@/utils/formatters";

interface SunPositionArcProps {
  sunPosition: SunPositionData;
  sunrise: Date | null;
  sunset: Date | null;
  timezone?: string | undefined;
}

// ── Layout ──
const W = 400;
const H = 100;
const PAD = 30;
const HORIZON_Y = 72;
const PEAK_Y = 14;
const DIP_Y = 90;

function curveY(t: number): number {
  const angle = -0.2 * Math.PI + t * 1.4 * Math.PI;
  const s = Math.sin(angle);
  if (s >= 0) return HORIZON_Y - s * (HORIZON_Y - PEAK_Y);
  return HORIZON_Y - (s * (DIP_Y - HORIZON_Y)) / 0.59;
}

function curveX(t: number): number {
  return PAD + t * (W - 2 * PAD);
}

// Build smooth SVG cubic bezier via Catmull-Rom
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  const a = 0.25;
  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    d += ` C ${(p1.x + (p2.x - p0.x) * a).toFixed(1)} ${(p1.y + (p2.y - p0.y) * a).toFixed(1)}, ${(p2.x - (p3.x - p1.x) * a).toFixed(1)} ${(p2.y - (p3.y - p1.y) * a).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// Pre-compute curve
const STEPS = 80;
const ALL_CURVE: Array<{ x: number; y: number }> = [];
for (let i = 0; i <= STEPS; i++) {
  const t = i / STEPS;
  ALL_CURVE.push({ x: curveX(t), y: curveY(t) });
}
const FULL_PATH = smoothPath(ALL_CURVE);

// Find horizon crossing steps (pre-computed)
let RISE_STEP = 0;
let SET_STEP = STEPS;
for (let i = 0; i < ALL_CURVE.length; i++) {
  if (ALL_CURVE[i]!.y < HORIZON_Y) {
    RISE_STEP = i;
    break;
  }
}
for (let i = ALL_CURVE.length - 1; i >= 0; i--) {
  if (ALL_CURVE[i]!.y < HORIZON_Y) {
    SET_STEP = i;
    break;
  }
}

// SVG defs
const svgDefs = (
  <defs>
    <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="traveledGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#d4a017" stopOpacity="0.5" />
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
  const { altitude, noonAltitude, isAboveHorizon, dayFraction, minAltitude } =
    sunPosition;

  // Sun step on the curve
  const clamped = Math.max(0, Math.min(STEPS, Math.round(dayFraction * STEPS)));
  const sunPt = ALL_CURVE[clamped];

  // Golden: only above-horizon traveled portion
  const goldenStart = Math.max(RISE_STEP, 0);
  const goldenEnd = Math.min(clamped, SET_STEP);
  const goldenPts =
    goldenEnd > goldenStart ? ALL_CURVE.slice(goldenStart, goldenEnd + 1) : [];
  const remainingPts = ALL_CURVE.slice(clamped);

  const goldenPath = goldenPts.length > 1 ? smoothPath(goldenPts) : null;
  const remainingPath =
    remainingPts.length > 1 ? smoothPath(remainingPts) : null;

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
    statusText = `${Math.round(Math.abs(altitude))}° below horizon`;
    statusColor = "text-base-content/40";
  }

  const bgGradient = isAboveHorizon
    ? "bg-gradient-to-br from-sky-600 to-sky-400"
    : altitude > -6
      ? "bg-gradient-to-br from-slate-600 to-sky-800"
      : "bg-gradient-to-br from-slate-700 to-slate-900";

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/10">
      <div className="bg-base-200/40 px-5 pt-4 pb-2">
        <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
          Sun Position
        </p>
      </div>

      <div className={`relative ${bgGradient}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-label="Sun position arc"
        >
          {svgDefs}

          {/* Horizon */}
          <line
            x1="0"
            y1={HORIZON_Y}
            x2={W}
            y2={HORIZON_Y}
            stroke="white"
            strokeOpacity="0.07"
            strokeWidth="0.75"
          />

          {/* Full curve (dim track) */}
          <path
            d={FULL_PATH}
            fill="none"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="1"
          />

          {/* Above-horizon traveled (golden) */}
          {goldenPath ? (
            <path
              d={goldenPath}
              fill="none"
              stroke="url(#traveledGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ) : null}

          {/* Remaining (gray) */}
          {remainingPath ? (
            <path
              d={remainingPath}
              fill="none"
              stroke="white"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeLinecap="round"
            />
          ) : null}

          {/* Sunrise time */}
          <text
            x={PAD + 20}
            y={HORIZON_Y - 6}
            textAnchor="middle"
            fill="white"
            fillOpacity="0.5"
            fontSize="5.5"
            fontFamily="inherit"
          >
            {fmtTime(sunrise, timezone)}
          </text>

          {/* Sunset time */}
          <text
            x={W - PAD - 20}
            y={HORIZON_Y - 6}
            textAnchor="middle"
            fill="white"
            fillOpacity="0.5"
            fontSize="5.5"
            fontFamily="inherit"
          >
            {fmtTime(sunset, timezone)}
          </text>

          {/* Sun */}
          {sunPt ? (
            <g filter="url(#sunGlow)">
              <image
                href="/sun.svg"
                x={sunPt.x - 12}
                y={sunPt.y - 12}
                width="24"
                height="24"
                opacity={isAboveHorizon ? 1 : 0.3}
              />
            </g>
          ) : null}
        </svg>
      </div>

      <div className="bg-base-200/40 flex items-center justify-between px-5 py-2.5 text-xs">
        <span className={statusColor + " font-medium"}>{statusText}</span>
        <div className="flex gap-3">
          {noonAltitude > 0 ? (
            <span className="text-base-content/30">
              Peak {Math.round(noonAltitude)}°
            </span>
          ) : null}
          <span className="text-base-content/20">
            Low {Math.round(minAltitude)}°
          </span>
        </div>
      </div>
    </div>
  );
}
