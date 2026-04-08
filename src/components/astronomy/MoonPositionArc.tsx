import CelestialPositionArc from "@/components/astronomy/CelestialPositionArc";
import type {
  CelestialTheme,
  ArcEventMarker,
  ArcCurrentPosition,
  ArcStatusLine,
  ArcTransitEvent,
} from "@/components/astronomy/CelestialPositionArc";
import type { MoonPositionData } from "@/types/astronomy";
import { fmtTime, fmtDurationMs } from "@/utils/formatters";

interface MoonPositionArcProps {
  moonPosition: MoonPositionData;
  phaseIcon: string;
  timezone?: string | undefined;
}

/* ── Moon theme tokens ── */

const MOON_THEME: CelestialTheme = {
  bgGradient: "from-[#1e1b4b] to-[#0f172a]",
  footerBorder: "border-violet-800/30",
  tooltipBorder: "border-violet-800/50",
  tooltipBg: "#0f172a",
  tooltipDot: "bg-violet-400",
  tooltipText: "text-violet-200",
  arcStart: "#8b5cf6",
  arcEnd: "#a78bfa",
  activeDotFill: "#c4b5fd",
  activeDotStroke: "#8b5cf6",
  eventDotFill: "#6366f1",
  subLabelColor: "#a78bfa",
  transitColor: "rgba(139,92,246,0.4)",
  statusAbove: "text-violet-400 font-semibold",
  statusBelow: "text-indigo-300/60",
  footerStatColor: "text-violet-200/50",
  footerStatDim: "text-violet-200/40",
};

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

  const nowMs = Date.now();

  // Fallback event times
  const curveData = altitudeCurve || [];
  const minX = curveData[0]?.timestamp || 0;
  const maxX = curveData[curveData.length - 1]?.timestamp || 0;
  const prevMs = previousEvent?.getTime() || minX + (maxX - minX) * 0.3;
  const nextMs = nextEvent?.getTime() || minX + (maxX - minX) * 0.7;

  // Build event markers with duration labels
  const startEvent: ArcEventMarker = {
    timeMs: prevMs,
    title: isAboveHorizon ? "Moonrise" : "Moonset",
    mainLabel: fmtTime(new Date(prevMs), timezone),
    subLabel: `${fmtDurationMs(nowMs - prevMs)} ago`,
  };

  const endEvent: ArcEventMarker = {
    timeMs: nextMs,
    title: isAboveHorizon ? "Moonset" : "Moonrise",
    mainLabel: fmtTime(new Date(nextMs), timezone),
    subLabel: `in ${fmtDurationMs(nextMs - nowMs)}`,
  };

  // Transit — find the curve sample with highest altitude (only when above horizon)
  let transitEvent: ArcTransitEvent | undefined;
  if (isAboveHorizon && curveData.length > 0) {
    let peakIdx = 0;
    for (let i = 1; i < curveData.length; i++) {
      if (curveData[i]!.altitude > curveData[peakIdx]!.altitude) {
        peakIdx = i;
      }
    }
    const peak = curveData[peakIdx]!;
    if (peak.altitude > 0) {
      transitEvent = {
        timeMs: peak.timestamp,
        altitude: peak.altitude,
        title: "Lunar Transit",
        timeLabel: fmtTime(new Date(peak.timestamp), timezone),
      };
    }
  }

  // Current position
  const current: ArcCurrentPosition = {
    timeMs: nowMs,
    altitude,
    azimuth,
    isAboveHorizon,
    iconUrl: phaseIcon,
  };

  // Status line
  let status: ArcStatusLine;
  if (isAboveHorizon) {
    status = {
      text: `${Math.round(altitude)}° above horizon`,
      colorClass: MOON_THEME.statusAbove,
    };
  } else {
    status = {
      text: `${Math.round(Math.abs(altitude))}° below horizon`,
      colorClass: MOON_THEME.statusBelow,
    };
  }

  return (
    <CelestialPositionArc
      title="Moon Position"
      curveData={curveData}
      current={current}
      peakAltitude={peakAltitude}
      minAltitude={minAltitude}
      startEvent={startEvent}
      endEvent={endEvent}
      transitEvent={transitEvent}
      theme={MOON_THEME}
      status={status}
      timezone={timezone}
    />
  );
}
