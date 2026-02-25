import type { MoonPositionData } from "@/types/astronomy";
import { fmtTime } from "@/utils/formatters";

interface MoonPositionArcProps {
  moonPosition: MoonPositionData;
  moonrise: Date | null;
  moonset: Date | null;
  phaseIcon: string;
  timezone?: string | undefined;
}

// ── Layout (same dimensions as SunPositionArc) ──
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
  ALL_CURVE.push({ x: curveX(i / STEPS), y: curveY(i / STEPS) });
}
const FULL_PATH = smoothPath(ALL_CURVE);

// Horizon crossing steps
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

// SVG defs — violet theme
const svgDefs = (
  <defs>
    <filter id="moonGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="moonTraveledGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
      <stop offset="100%" stopColor="#a78bfa" stopOpacity="1" />
    </linearGradient>
  </defs>
);

export default function MoonPositionArc({
  moonPosition,
  moonrise,
  moonset,
  phaseIcon,
  timezone,
}: MoonPositionArcProps) {
  const { altitude, isAboveHorizon, dayFraction, peakAltitude, minAltitude } =
    moonPosition;

  const clamped = Math.max(0, Math.min(STEPS, Math.round(dayFraction * STEPS)));
  const moonPt = ALL_CURVE[clamped];

  // Violet path: only above-horizon traveled portion
  const goldenStart = Math.max(RISE_STEP, 0);
  const goldenEnd = Math.min(clamped, SET_STEP);
  const violetPts =
    goldenEnd > goldenStart ? ALL_CURVE.slice(goldenStart, goldenEnd + 1) : [];
  const remainingPts = ALL_CURVE.slice(clamped);

  const violetPath = violetPts.length > 1 ? smoothPath(violetPts) : null;
  const remainingPath =
    remainingPts.length > 1 ? smoothPath(remainingPts) : null;

  // Status
  let statusText: string;
  let statusColor: string;
  if (isAboveHorizon) {
    statusText = `${Math.round(altitude)}° above horizon`;
    statusColor = "text-violet-400";
  } else {
    statusText = `${Math.round(Math.abs(altitude))}° below horizon`;
    statusColor = "text-base-content/40";
  }

  const bgGradient = isAboveHorizon
    ? "bg-gradient-to-br from-indigo-800 to-violet-700"
    : "bg-gradient-to-br from-slate-800 to-slate-900";

  return (
    <div className="overflow-hidden rounded-xl border border-violet-500/10">
      <div className="bg-base-200/40 px-5 pt-4 pb-2">
        <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
          Moon Position
        </p>
      </div>

      <div className={`relative ${bgGradient}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-label="Moon position arc"
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

          {/* Full curve (dim) */}
          <path
            d={FULL_PATH}
            fill="none"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="1"
          />

          {/* Above-horizon traveled (violet) */}
          {violetPath ? (
            <path
              d={violetPath}
              fill="none"
              stroke="url(#moonTraveledGrad)"
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

          {/* Moonrise time */}
          <text
            x={PAD + 20}
            y={HORIZON_Y - 6}
            textAnchor="middle"
            fill="white"
            fillOpacity="0.5"
            fontSize="5.5"
            fontFamily="inherit"
          >
            {fmtTime(moonrise, timezone)}
          </text>

          {/* Moonset time */}
          <text
            x={W - PAD - 20}
            y={HORIZON_Y - 6}
            textAnchor="middle"
            fill="white"
            fillOpacity="0.5"
            fontSize="5.5"
            fontFamily="inherit"
          >
            {fmtTime(moonset, timezone)}
          </text>

          {/* Moon icon */}
          {moonPt ? (
            <g filter="url(#moonGlow)">
              <image
                href={phaseIcon}
                x={moonPt.x - 12}
                y={moonPt.y - 12}
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
          {peakAltitude > 0 ? (
            <span className="text-base-content/30">
              Peak {Math.round(peakAltitude)}°
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
