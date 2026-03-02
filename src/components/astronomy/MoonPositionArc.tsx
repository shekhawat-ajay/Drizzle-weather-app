import { useMemo } from "react";
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
import type { MoonPositionData } from "@/types/astronomy";
import { fmtTime, fmtDurationMs, fmtAzimuth } from "@/utils/formatters";

interface MoonPositionArcProps {
  moonPosition: MoonPositionData;
  phaseIcon: string;
  timezone?: string | undefined;
}

const CustomTooltip = ({
  active,
  payload,
  timezone,
}: {
  active?: boolean;
  payload?: readonly any[];
  timezone?: string | undefined;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const timeStr = fmtTime(new Date(data.x), timezone);
    const elev = Math.round(data.y);
    const elevText =
      elev > 0 ? `${elev}° above horizon` : `${Math.abs(elev)}° below horizon`;
    return (
      <div className="rounded-xl border border-violet-800/50 bg-[#0f172a]/90 p-2.5 text-xs shadow-2xl backdrop-blur-md">
        <p className="flex items-center gap-1.5 font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-violet-400"></span>
          {timeStr}
        </p>
        <p className="mt-1 ml-3.5 font-medium text-violet-200">{elevText}</p>
      </div>
    );
  }
  return null;
};

/** Format a millisecond duration as "X hr Y m". */

export default function MoonPositionArc({
  moonPosition,
  phaseIcon,
  timezone,
}: MoonPositionArcProps) {
  const {
    altitude,
    azimuth,
    isAboveHorizon,
    altitudeCurve,
    peakAltitude,
    minAltitude,
    previousEvent,
    nextEvent,
  } = moonPosition;

  // 1. Map sampled points
  const curveData = useMemo(() => {
    if (!altitudeCurve || altitudeCurve.length === 0) {
      const STEPS = 100;
      const pts = [];
      const now = Date.now();
      const span = 12 * 3600000;
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        pts.push({
          x: now - span + t * span * 2,
          y: Math.sin(t * Math.PI) * 45,
        });
      }
      return pts;
    }
    return altitudeCurve.map((pt: { timestamp: number; altitude: number }) => ({
      x: pt.timestamp,
      y: pt.altitude,
    }));
  }, [altitudeCurve]);

  const minX = curveData[0]?.x || 0;
  const maxX = curveData[curveData.length - 1]?.x || 0;

  const nowMs = Date.now();
  const prevMs = previousEvent?.getTime() || minX + (maxX - minX) * 0.3;
  const nextMs = nextEvent?.getTime() || minX + (maxX - minX) * 0.7;

  // Calculate deterministic labels
  const {
    prevTimeLabel,
    nextTimeLabel,
    prevDurationLabel,
    nextDurationLabel,
    prevTitle,
    nextTitle,
  } = useMemo(() => {
    const pTime = fmtTime(new Date(prevMs), timezone);
    const nTime = fmtTime(new Date(nextMs), timezone);
    const pTitle = isAboveHorizon ? "Moonrise" : "Moonset";
    const nTitle = isAboveHorizon ? "Moonset" : "Moonrise";
    const pDur = `${fmtDurationMs(nowMs - prevMs)} ago`;
    const nDur = `in ${fmtDurationMs(nextMs - nowMs)}`;
    return {
      prevTimeLabel: pTime,
      nextTimeLabel: nTime,
      prevTitle: pTitle,
      nextTitle: nTitle,
      prevDurationLabel: pDur,
      nextDurationLabel: nDur,
    };
  }, [prevMs, nextMs, nowMs, isAboveHorizon, timezone]);

  const getOffset = (val: number) => {
    if (maxX === minX) return 0;
    return Math.max(0, Math.min(100, ((val - minX) / (maxX - minX)) * 100));
  };

  const activeOffset = getOffset(nowMs);

  // Calculate where the gradient starts/stops based on state
  // If UP: gradient runs from prevMs to nowMs
  // If DOWN: no gradient (dim)
  const prevOffset = getOffset(prevMs);
  const isRising = isAboveHorizon;

  let statusText = "Below horizon";
  let statusColor = "text-base-content/50";
  if (isAboveHorizon) {
    statusText = `${Math.round(altitude)}° above horizon`;
    statusColor = "text-violet-400 font-semibold";
  } else {
    statusText = `${Math.round(Math.abs(altitude))}° below horizon`;
    statusColor = "text-indigo-300/60";
  }

  const yDomainMinimum = minAltitude - 5;
  const yDomain = [
    Number.isNaN(yDomainMinimum) ? 0 : yDomainMinimum,
    Math.max(peakAltitude + 15, 15),
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] shadow-lg">
      <div className="flex items-center justify-between px-6 pt-5 pb-2 text-sm font-medium tracking-wide">
        <span className="text-xs text-white/90 uppercase">Moon Position</span>
      </div>

      <div className="-mt-2 -mb-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={curveData}
            margin={{ top: 10, right: 30, bottom: 35, left: 30 }}
          >
            <defs>
              <filter
                id="moonGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="moonArcStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity={0.15} />
                <stop
                  offset={`${prevOffset}%`}
                  stopColor="white"
                  stopOpacity={0.15}
                />
                <stop
                  offset={`${prevOffset}%`}
                  stopColor={isRising ? "#8b5cf6" : "rgba(255,255,255,0.15)"}
                  stopOpacity={1}
                />
                <stop
                  offset={`${activeOffset}%`}
                  stopColor={isRising ? "#a78bfa" : "rgba(255,255,255,0.15)"}
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
                <CustomTooltip
                  active={active}
                  payload={payload}
                  timezone={timezone}
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
              stroke="url(#moonArcStroke)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#c4b5fd",
                stroke: "#8b5cf6",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />

            {/* PREVIOUS Event Dot & Text */}
            <ReferenceDot
              x={prevMs}
              y={0}
              r={5}
              fill="#6366f1"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={prevMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: prevTitle,
                fill: "rgba(255,255,255,0.7)",
                fontSize: 10,
                dy: 20,
              }}
            />
            <ReferenceDot
              x={prevMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: prevDurationLabel,
                fill: "#a78bfa",
                fontSize: 10,
                dy: 50,
              }}
            />
            <ReferenceDot
              x={prevMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: prevTimeLabel,
                fill: "white",
                fontSize: 13,
                fontWeight: 600,
                dy: 34,
              }}
            />

            {/* NEXT Event Dot & Text */}
            <ReferenceDot
              x={nextMs}
              y={0}
              r={5}
              fill="#6366f1"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={nextMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: nextTitle,
                fill: "rgba(255,255,255,0.7)",
                fontSize: 10,
                dy: 20,
              }}
            />
            <ReferenceDot
              x={nextMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: nextDurationLabel,
                fill: "#a78bfa",
                fontSize: 10,
                dy: 50,
              }}
            />
            <ReferenceDot
              x={nextMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: nextTimeLabel,
                fill: "white",
                fontSize: 13,
                fontWeight: 600,
                dy: 34,
              }}
            />

            {/* Current Moon Position */}
            <ReferenceDot
              shape={({ cx, cy }) => (
                <g filter={isAboveHorizon ? "url(#moonGlow)" : undefined}>
                  <image
                    href={phaseIcon}
                    x={cx - 14}
                    y={cy - 14}
                    width={28}
                    height={28}
                    opacity={isAboveHorizon ? 1 : 0.4}
                  />
                </g>
              )}
              x={nowMs}
              y={altitude}
              r={12}
              fill="none"
              stroke="none"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-violet-800/30 bg-[#020617]/40 px-6 pt-5 pb-4 text-xs">
        <span className={statusColor}>{statusText}</span>
        <div className="flex gap-4 font-medium">
          <span className="text-violet-200/50">
            Azimuth {Math.round(azimuth)}&deg; {fmtAzimuth(azimuth)}
          </span>
          {peakAltitude > 0 ? (
            <span className="text-violet-200/50">
              Peak {Math.round(peakAltitude)}°
            </span>
          ) : null}
          <span className="text-violet-200/40">
            Low {Math.round(minAltitude)}°
          </span>
        </div>
      </div>
    </div>
  );
}
