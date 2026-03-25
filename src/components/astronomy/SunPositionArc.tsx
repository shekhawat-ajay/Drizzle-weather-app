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
import type { SunPositionData } from "@/types/astronomy";
import { fmtTime, fmtAzimuth } from "@/utils/formatters";

interface SunPositionArcProps {
  sunPosition: SunPositionData;
  sunrise: Date | null;
  sunset: Date | null;
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
      <div className="rounded-xl border border-sky-800/50 bg-[#041a33]/90 p-2.5 text-xs shadow-2xl backdrop-blur-md">
        <p className="flex items-center gap-1.5 font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          {timeStr}
        </p>
        <p className="mt-1 ml-3.5 font-medium text-sky-200">{elevText}</p>
      </div>
    );
  }
  return null;
};

// Helper to determine if an event is on the following local day
function getDayOffsetLabel(
  baseDateMs: number,
  eventDateMs: number,
  timezone?: string,
) {
  const baseDay = new Date(baseDateMs).toLocaleDateString("en-US", {
    timeZone: timezone,
  });
  const eventDay = new Date(eventDateMs).toLocaleDateString("en-US", {
    timeZone: timezone,
  });
  if (baseDay !== eventDay) {
    return "Tomorrow";
  }
  return "";
}

export default function SunPositionArc({
  sunPosition,
  sunrise,
  sunset,
  timezone,
}: SunPositionArcProps) {
  const {
    altitude,
    azimuth,
    isAboveHorizon,
    altitudeCurve,
    noonAltitude,
    minAltitude,
  } = sunPosition;

  const curveData = useMemo(() => {
    // If altitudeCurve is undefined (fallback)
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
  const sunriseMs = sunrise?.getTime() || minX + (maxX - minX) * 0.3;
  const sunsetMs = sunset?.getTime() || minX + (maxX - minX) * 0.7;

  const riseTomorrow = getDayOffsetLabel(nowMs, sunriseMs, timezone);
  const setTomorrow = getDayOffsetLabel(nowMs, sunsetMs, timezone);

  const getOffset = (val: number) => {
    if (maxX === minX) return 0;
    return Math.max(0, Math.min(100, ((val - minX) / (maxX - minX)) * 100));
  };

  const sunriseOffset = getOffset(sunriseMs);
  const activeOffset = getOffset(Math.min(nowMs, sunsetMs));

  const activeY = altitude;

  let statusText = "Below horizon";
  let statusColor = "text-base-content/50";
  if (isAboveHorizon) {
    statusText = `${Math.round(altitude)}° above horizon`;
    statusColor = "text-amber-400 font-semibold";
  } else if (altitude > -6) {
    statusText = "Twilight";
    statusColor = "text-indigo-300 font-medium";
  } else {
    statusText = `${Math.round(Math.abs(altitude))}° below horizon`;
    statusColor = "text-sky-300/60";
  }

  // Padding for Y axis to prevent clipping sun glow
  const yDomainMinimum = minAltitude - 5;
  const yDomain = [
    Number.isNaN(yDomainMinimum) ? 0 : yDomainMinimum,
    Math.max(noonAltitude + 15, 15),
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a478c] to-[#042859] shadow-lg">
      <div className="flex items-center justify-between px-6 pt-5 pb-2 text-sm font-medium tracking-wide">
        <span className="text-xs text-white/90 uppercase">Sun Position</span>
      </div>

      <div className="-mt-2 -mb-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={curveData}
            margin={{ top: 10, right: 30, bottom: 60, left: 30 }}
          >
            <defs>
              <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="traveledGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity={0.15} />
                <stop
                  offset={`${sunriseOffset}%`}
                  stopColor="white"
                  stopOpacity={0.15}
                />
                <stop
                  offset={`${sunriseOffset}%`}
                  stopColor="#f59e0b"
                  stopOpacity={1}
                />
                <stop
                  offset={`${activeOffset}%`}
                  stopColor="#fbbf24"
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
              stroke="url(#traveledGrad)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#fef3c7",
                stroke: "#f59e0b",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />

            {/* Sunrise Dot & Text */}
            <ReferenceDot
              x={sunriseMs}
              y={0}
              r={5}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={sunriseMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: "Sunrise",
                fill: "rgba(255,255,255,0.7)",
                fontSize: 12,
                dy: 10,
              }}
            />
            {riseTomorrow && (
              <ReferenceDot
                x={sunriseMs}
                y={0}
                r={0}
                label={{
                  position: "bottom",
                  value: riseTomorrow,
                  fill: "#fbbf24",
                  fontSize: 10,
                  dy: 40,
                }}
              />
            )}
            <ReferenceDot
              x={sunriseMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: fmtTime(sunrise, timezone),
                fill: "white",
                fontSize: 13,
                fontWeight: 600,
                dy: 24,
              }}
            />

            {/* Sunset Dot & Text */}
            <ReferenceDot
              x={sunsetMs}
              y={0}
              r={5}
              fill="#fbbf24"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <ReferenceDot
              x={sunsetMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: "Sunset",
                fill: "rgba(255,255,255,0.7)",
                fontSize: 12,
                dy: 10,
              }}
            />
            {setTomorrow && (
              <ReferenceDot
                x={sunsetMs}
                y={0}
                r={0}
                label={{
                  position: "bottom",
                  value: setTomorrow,
                  fill: "#fbbf24",
                  fontSize: 10,
                  dy: 40,
                }}
              />
            )}
            <ReferenceDot
              x={sunsetMs}
              y={0}
              r={0}
              label={{
                position: "bottom",
                value: fmtTime(sunset, timezone),
                fill: "white",
                fontSize: 13,
                fontWeight: 600,
                dy: 24,
              }}
            />

            {/* Current Sun Position */}
            <g>
              <image
                href="/sun.svg"
                x={getOffset(nowMs) + "%"}
                y="0%"
                opacity={0}
              />
            </g>
            <ReferenceDot
              shape={({ cx, cy }) => (
                <g filter={isAboveHorizon ? "url(#sunGlow)" : undefined}>
                  <image
                    href="/sun.svg"
                    x={cx - 14}
                    y={cy - 14}
                    width={28}
                    height={28}
                    opacity={isAboveHorizon ? 1 : 0.4}
                  />
                </g>
              )}
              x={nowMs}
              y={activeY}
              r={12}
              fill="none"
              stroke="none"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-sky-800/30 bg-[#020617]/40 px-6 pt-5 pb-4 text-xs">
        <span className={statusColor}>{statusText}</span>
        <div className="flex gap-4 font-medium">
          <span className="text-sky-200/50">
            Azimuth {Math.round(azimuth)}&deg; {fmtAzimuth(azimuth)}
          </span>
          {noonAltitude > 0 ? (
            <span className="text-sky-200/50">
              Peak {Math.round(noonAltitude)}°
            </span>
          ) : null}
          <span className="text-sky-200/40">
            Low {Math.round(minAltitude)}°
          </span>
        </div>
      </div>
    </div>
  );
}
