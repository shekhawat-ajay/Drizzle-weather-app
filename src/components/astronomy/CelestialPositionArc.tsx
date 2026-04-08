import { useMemo, useId } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  XAxis,
  ReferenceDot,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
} from "recharts";
import { fmtTime, fmtAzimuth } from "@/utils/formatters";

/* ── Theme configuration ── */

export interface CelestialTheme {
  /** Outer card gradient, e.g. "from-[#0a478c] to-[#042859]" */
  bgGradient: string;
  /** Border color for the footer divider, e.g. "border-sky-800/30" */
  footerBorder: string;
  /** Tooltip border class, e.g. "border-sky-800/50" */
  tooltipBorder: string;
  /** Tooltip background hex, e.g. "#041a33" */
  tooltipBg: string;
  /** Tooltip indicator dot class, e.g. "bg-amber-400" */
  tooltipDot: string;
  /** Tooltip elevation text class, e.g. "text-sky-200" */
  tooltipText: string;
  /** Arc gradient: start color (active traveled), e.g. "#f59e0b" */
  arcStart: string;
  /** Arc gradient: end color (active traveled), e.g. "#fbbf24" */
  arcEnd: string;
  /** Active dot fill, e.g. "#fef3c7" */
  activeDotFill: string;
  /** Active dot stroke, e.g. "#f59e0b" */
  activeDotStroke: string;
  /** Event marker dot fill, e.g. "#fbbf24" */
  eventDotFill: string;
  /** Sub-label color for durations / "Tomorrow", e.g. "#fbbf24" or "#a78bfa" */
  subLabelColor: string;
  /** Transit marker color, e.g. "rgba(251,191,36,0.4)" */
  transitColor: string;
  /** Status text class when above horizon, e.g. "text-amber-400 font-semibold" */
  statusAbove: string;
  /** Status text class when below horizon, e.g. "text-sky-300/60" */
  statusBelow: string;
  /** Footer stat text class, e.g. "text-sky-200/50" */
  footerStatColor: string;
  /** Footer stat dim text class, e.g. "text-sky-200/40" */
  footerStatDim: string;
}

/* ── Event marker descriptor ── */

export interface ArcEventMarker {
  /** Timestamp in ms */
  timeMs: number;
  /** Top label, e.g. "Sunrise", "Moonrise" */
  title: string;
  /** Main label, e.g. formatted time "6:42 AM" */
  mainLabel: string;
  /** Sub-label, e.g. "Tomorrow", "2 hr ago" */
  subLabel?: string | undefined;
}

/* ── Transit event descriptor ── */

export interface ArcTransitEvent {
  /** Timestamp in ms when the body reaches peak altitude */
  timeMs: number;
  /** Peak altitude in degrees */
  altitude: number;
  /** Label, e.g. "Solar Noon", "Lunar Transit" */
  title: string;
  /** Formatted time label */
  timeLabel: string;
}

/* ── Current position descriptor ── */

export interface ArcCurrentPosition {
  timeMs: number;
  altitude: number;
  azimuth: number;
  isAboveHorizon: boolean;
  iconUrl: string;
}

/* ── Status line descriptor ── */

export interface ArcStatusLine {
  text: string;
  colorClass: string;
}

/* ── Component props ── */

export interface CelestialPositionArcProps {
  /** Chart heading, e.g. "Sun Position" */
  title: string;
  /** Altitude curve data points */
  curveData: { timestamp: number; altitude: number }[];
  /** Current celestial body state */
  current: ArcCurrentPosition;
  /** Peak altitude for Y domain */
  peakAltitude: number;
  /** Minimum altitude for Y domain */
  minAltitude: number;
  /** Left-hand event marker (rise/set) */
  startEvent: ArcEventMarker;
  /** Right-hand event marker (rise/set) */
  endEvent: ArcEventMarker;
  /** Optional transit event (meridian crossing / peak altitude) */
  transitEvent?: ArcTransitEvent | undefined;
  /** Visual theme tokens */
  theme: CelestialTheme;
  /** Status line (text + color) */
  status: ArcStatusLine;
  /** Timezone for formatting */
  timezone?: string | undefined;
}

/* ── Tooltip (internal) ── */

function ArcTooltip({
  active,
  payload,
  timezone,
  theme,
}: {
  active?: boolean | undefined;
  payload?: readonly any[] | undefined;
  timezone?: string | undefined;
  theme: CelestialTheme;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const timeStr = fmtTime(new Date(data.x), timezone);
    const elev = Math.round(data.y);
    const elevText =
      elev > 0 ? `${elev}° above horizon` : `${Math.abs(elev)}° below horizon`;
    const transitLabel: string | undefined = data.transitLabel;
    return (
      <div
        className={`rounded-xl border ${theme.tooltipBorder} p-2.5 text-xs shadow-2xl backdrop-blur-md`}
        style={{ backgroundColor: `${theme.tooltipBg}e6` }}
      >
        <p className="flex items-center gap-1.5 font-semibold text-white">
          <span className={`h-2 w-2 rounded-full ${theme.tooltipDot}`}></span>
          {timeStr}
        </p>
        <p className={`mt-1 ml-3.5 font-medium ${theme.tooltipText}`}>
          {elevText}
        </p>
        {transitLabel ? (
          <p className="mt-1 ml-3.5 font-semibold text-white/70">
            ✦ {transitLabel}
          </p>
        ) : null}
      </div>
    );
  }
  return null;
}

/* ── Main component ── */

export default function CelestialPositionArc({
  title,
  curveData: rawCurve,
  current,
  peakAltitude,
  minAltitude,
  startEvent,
  endEvent,
  transitEvent,
  theme,
  status,
  timezone,
}: CelestialPositionArcProps) {
  // Unique IDs so multiple arcs on the same page don't clash SVG defs
  const uid = useId().replace(/:/g, "");
  const glowId = `glow_${uid}`;
  const gradId = `grad_${uid}`;

  // Map curve data and inject transit label into the nearest point
  const chartData = useMemo(() => {
    if (!rawCurve || rawCurve.length === 0) {
      const STEPS = 100;
      const pts = [];
      const now = Date.now();
      const span = 12 * 3600000;
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        pts.push({ x: now - span + t * span * 2, y: Math.sin(t * Math.PI) * 45, transitLabel: undefined as string | undefined });
      }
      return pts;
    }
    const pts = rawCurve.map((pt) => ({ x: pt.timestamp, y: pt.altitude, transitLabel: undefined as string | undefined }));

    // Tag the point closest to the transit time
    if (transitEvent && pts.length > 0) {
      let closestIdx = 0;
      let closestDist = Math.abs(pts[0]!.x - transitEvent.timeMs);
      for (let i = 1; i < pts.length; i++) {
        const dist = Math.abs(pts[i]!.x - transitEvent.timeMs);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
      pts[closestIdx]!.transitLabel = transitEvent.title;
    }

    return pts;
  }, [rawCurve, transitEvent]);

  const minX = chartData[0]?.x || 0;
  const maxX = chartData[chartData.length - 1]?.x || 0;

  const getOffset = (val: number) => {
    if (maxX === minX) return 0;
    return Math.max(0, Math.min(100, ((val - minX) / (maxX - minX)) * 100));
  };

  const startOffset = getOffset(startEvent.timeMs);
  const activeOffset = getOffset(current.timeMs);

  // Y domain with padding
  const yMin = minAltitude - 5;
  const yDomain = [
    Number.isNaN(yMin) ? 0 : yMin,
    Math.max(peakAltitude + 15, 15),
  ];

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${theme.bgGradient} shadow-lg`}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-2 text-sm font-medium tracking-wide">
        <span className="text-xs text-white/90 uppercase">{title}</span>
      </div>

      <div className="-mt-2 -mb-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, bottom: 60, left: 30 }}
          >
            <defs>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity={0.15} />
                <stop
                  offset={`${startOffset}%`}
                  stopColor="white"
                  stopOpacity={0.15}
                />
                <stop
                  offset={`${startOffset}%`}
                  stopColor={
                    current.isAboveHorizon
                      ? theme.arcStart
                      : "rgba(255,255,255,0.15)"
                  }
                  stopOpacity={1}
                />
                <stop
                  offset={`${activeOffset}%`}
                  stopColor={
                    current.isAboveHorizon
                      ? theme.arcEnd
                      : "rgba(255,255,255,0.15)"
                  }
                  stopOpacity={1}
                />
                <stop
                  offset={`${activeOffset}%`}
                  stopColor="white"
                  stopOpacity={0.15}
                />
                <stop offset="100%" stopColor="white" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="x"
              hide
              type="number"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis hide type="number" domain={yDomain} />

            <Tooltip
              content={({ active, payload }) => (
                <ArcTooltip
                  active={active}
                  payload={payload}
                  timezone={timezone}
                  theme={theme}
                />
              )}
              cursor={{
                stroke: "rgba(255,255,255,0.1)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <ReferenceArea
              y1={Number(yDomain[0])}
              y2={0}
              fill="#020617"
              fillOpacity={0.5}
            />

            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />

            <Line
              type="monotone"
              dataKey="y"
              stroke={`url(#${gradId})`}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: theme.activeDotFill,
                stroke: theme.activeDotStroke,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />

            {/* ── Start Event Marker ── */}
            <ReferenceDot
              x={startEvent.timeMs}
              y={0}
              r={5}
              fill={theme.eventDotFill}
              stroke="#fff"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={startEvent.timeMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: startEvent.title,
                fill: "rgba(255,255,255,0.7)",
                fontSize: 10,
                dy: 20,
              }}
            />
            <ReferenceDot
              x={startEvent.timeMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: startEvent.mainLabel,
                fill: "white",
                fontSize: 13,
                fontWeight: 600,
                dy: 34,
              }}
            />
            {startEvent.subLabel ? (
              <ReferenceDot
                x={startEvent.timeMs}
                y={0}
                r={0}
                label={{
                  position: "bottom",
                  value: startEvent.subLabel,
                  fill: theme.subLabelColor,
                  fontSize: 10,
                  dy: 50,
                }}
              />
            ) : null}

            {/* ── End Event Marker ── */}
            <ReferenceDot
              x={endEvent.timeMs}
              y={0}
              r={5}
              fill={theme.eventDotFill}
              stroke="#fff"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={endEvent.timeMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: endEvent.title,
                fill: "rgba(255,255,255,0.7)",
                fontSize: 10,
                dy: 20,
              }}
            />
            <ReferenceDot
              x={endEvent.timeMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: endEvent.mainLabel,
                fill: "white",
                fontSize: 13,
                fontWeight: 600,
                dy: 34,
              }}
            />
            {endEvent.subLabel ? (
              <ReferenceDot
                x={endEvent.timeMs}
                y={0}
                r={0}
                label={{
                  position: "bottom",
                  value: endEvent.subLabel,
                  fill: theme.subLabelColor,
                  fontSize: 10,
                  dy: 50,
                }}
              />
            ) : null}

            {/* ── Transit Dot (no line, tooltip-only info) ── */}
            {transitEvent ? (
              <ReferenceDot
                x={transitEvent.timeMs}
                y={transitEvent.altitude}
                r={5}
                fill={theme.eventDotFill}
                stroke="#fff"
                strokeWidth={1.5}
              />
            ) : null}

            {/* ── Current Position Icon ── */}
            <ReferenceDot
              shape={({ cx, cy }: { cx: number; cy: number }) => (
                <g
                  filter={
                    current.isAboveHorizon ? `url(#${glowId})` : undefined
                  }
                >
                  <image
                    href={current.iconUrl}
                    x={cx - 14}
                    y={cy - 14}
                    width={28}
                    height={28}
                    opacity={current.isAboveHorizon ? 1 : 0.4}
                  />
                </g>
              )}
              x={current.timeMs}
              y={current.altitude}
              r={12}
              fill="none"
              stroke="none"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`mt-auto flex items-center justify-between border-t ${theme.footerBorder} bg-[#020617]/40 px-6 pt-5 pb-4 text-xs`}
      >
        <span className={status.colorClass}>{status.text}</span>
        <div className="flex gap-4 font-medium">
          <span className={theme.footerStatColor}>
            Azimuth {Math.round(current.azimuth)}&deg;{" "}
            {fmtAzimuth(current.azimuth)}
          </span>
          {Math.abs(Math.round(peakAltitude)) > 1 ? (
            <span className={theme.footerStatColor}>
              Peak {Math.round(peakAltitude)}°
            </span>
          ) : null}
          {Math.abs(Math.round(minAltitude)) > 1 ? (
            <span className={theme.footerStatDim}>
              Low {Math.round(minAltitude)}°
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
