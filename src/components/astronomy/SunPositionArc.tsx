import CelestialPositionArc from "@/components/astronomy/CelestialPositionArc";
import type {
  CelestialTheme,
  ArcEventMarker,
  ArcCurrentPosition,
  ArcStatusLine,
  ArcTransitEvent,
} from "@/components/astronomy/CelestialPositionArc";
import type { SunPositionData } from "@/types/astronomy";
import { fmtTime, fmtDurationMs } from "@/utils/formatters";

interface SunPositionArcProps {
  sunPosition: SunPositionData;
  timezone?: string | undefined;
}

/* ── Sun theme tokens ── */

const SUN_THEME: CelestialTheme = {
  bgGradient: "from-[#0a478c] to-[#042859]",
  footerBorder: "border-sky-800/30",
  tooltipBorder: "border-sky-800/50",
  tooltipBg: "#041a33",
  tooltipDot: "bg-amber-400",
  tooltipText: "text-sky-200",
  arcStart: "#f59e0b",
  arcEnd: "#fbbf24",
  activeDotFill: "#fef3c7",
  activeDotStroke: "#f59e0b",
  eventDotFill: "#fbbf24",
  subLabelColor: "#fbbf24",
  transitColor: "rgba(251,191,36,0.4)",
  statusAbove: "text-amber-400 font-semibold",
  statusBelow: "text-sky-300/60",
  footerStatColor: "text-sky-200/50",
  footerStatDim: "text-sky-200/40",
};

export default function SunPositionArc({
  sunPosition,
  timezone,
}: SunPositionArcProps) {
  const {
    altitude,
    azimuth,
    isAboveHorizon,
    altitudeCurve,
    peakAltitude,
    minAltitude,
    previousEvent,
    nextEvent,
  } = sunPosition;

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
    title: isAboveHorizon ? "Sunrise" : "Sunset",
    mainLabel: fmtTime(new Date(prevMs), timezone),
    subLabel: `${fmtDurationMs(nowMs - prevMs)} ago`,
  };

  const endEvent: ArcEventMarker = {
    timeMs: nextMs,
    title: isAboveHorizon ? "Sunset" : "Sunrise",
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
        title: "Solar Noon",
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
    iconUrl: "/sun.svg",
  };

  // Status line
  let status: ArcStatusLine;
  if (isAboveHorizon) {
    status = {
      text: `${Math.round(altitude)}° above horizon`,
      colorClass: SUN_THEME.statusAbove,
    };
  } else if (altitude > -6) {
    status = {
      text: "Twilight",
      colorClass: "text-indigo-300 font-medium",
    };
  } else {
    status = {
      text: `${Math.round(Math.abs(altitude))}° below horizon`,
      colorClass: SUN_THEME.statusBelow,
    };
  }

  return (
    <CelestialPositionArc
      title="Sun Position"
      curveData={curveData}
      current={current}
      peakAltitude={peakAltitude}
      minAltitude={minAltitude}
      startEvent={startEvent}
      endEvent={endEvent}
      transitEvent={transitEvent}
      theme={SUN_THEME}
      status={status}
      timezone={timezone}
    />
  );
}
