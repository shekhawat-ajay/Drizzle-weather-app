import { useMemo } from "react";
import { Body, Observer, Equator, Horizon } from "astronomy-engine";
import CelestialPositionArc from "@/components/astronomy/CelestialPositionArc";
import type {
  CelestialTheme,
  ArcEventMarker,
  ArcCurrentPosition,
  ArcStatusLine,
  ArcTransitEvent,
} from "@/components/astronomy/CelestialPositionArc";
import type { CelestialStatus } from "@/types/celestial";
import type { PlanetData } from "@/types/astronomy";
import { fmtTime, fmtDurationMs } from "@/utils/formatters";

const PLANET_BODY_MAP: Record<string, Body> = {
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
};

const PLANET_THEME: CelestialTheme = {
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

function planetIconDataUrl(planet: string): string {
  const letter = planet.charAt(0).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'><circle cx='14' cy='14' r='12' fill='%238b5cf6' stroke='white' stroke-width='1.5'/><text x='14' y='18' text-anchor='middle' font-size='12' font-family='sans-serif' font-weight='700' fill='white'>${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface PlanetPositionArcProps {
  planetName: string;
  latitude: number;
  longitude: number;
  celestial: CelestialStatus;
  positional: PlanetData;
  timezone?: string;
}

export default function PlanetPositionArc({
  planetName,
  latitude,
  longitude,
  celestial,
  positional,
  timezone,
}: PlanetPositionArcProps) {
  const { state, pastEvent, futureEvent } = celestial;

  const nowMs = Date.now();

  const arcData = useMemo(() => {
    const body = PLANET_BODY_MAP[planetName];
    if (!body) return null;

    const observer = new Observer(latitude, longitude, 0);

    // Determine window from past/future events, fallback to 24h around now
    const prevMs = pastEvent?.timestamp.getTime() ?? nowMs - 12 * 3600000;
    const nextMs = futureEvent?.timestamp.getTime() ?? nowMs + 12 * 3600000;

    let windowStartMs = Math.min(prevMs, nextMs);
    let windowEndMs = Math.max(prevMs, nextMs);
    // Ensure window is at least 6h if events are very close or missing
    if (windowEndMs - windowStartMs < 6 * 3600000) {
      windowStartMs = nowMs - 12 * 3600000;
      windowEndMs = nowMs + 12 * 3600000;
    }

    const padMs = 60 * 60 * 1000;
    const sampleStartMs = windowStartMs - padMs;
    const sampleEndMs = windowEndMs + padMs;
    const spanMs = sampleEndMs - sampleStartMs;

    const SAMPLES = 32;
    const curve: { timestamp: number; altitude: number }[] = [];
    let peakAltitude = positional.altitude;
    let minAltitude = positional.altitude;

    for (let i = 0; i <= SAMPLES; i++) {
      const fraction = i / SAMPLES;
      const ms = sampleStartMs + fraction * spanMs;
      const d = new Date(ms);
      const equ = Equator(body, d, observer, true, true);
      const hor = Horizon(d, observer, equ.ra, equ.dec, "normal");
      curve.push({ timestamp: ms, altitude: hor.altitude });
      if (ms >= windowStartMs && ms <= windowEndMs) {
        if (hor.altitude > peakAltitude) peakAltitude = hor.altitude;
        if (hor.altitude < minAltitude) minAltitude = hor.altitude;
      }
    }

    // Ensure bounds considered
    for (const boundMs of [windowStartMs, windowEndMs]) {
      const d = new Date(boundMs);
      const equ = Equator(body, d, observer, true, true);
      const hor = Horizon(d, observer, equ.ra, equ.dec, "normal");
      if (hor.altitude > peakAltitude) peakAltitude = hor.altitude;
      if (hor.altitude < minAltitude) minAltitude = hor.altitude;
    }

    return { curve, peakAltitude, minAltitude, windowStartMs, windowEndMs };
  }, [planetName, latitude, longitude, pastEvent, futureEvent, positional.altitude]);

  if (!arcData) return null;

  const { curve, peakAltitude, minAltitude } = arcData;

  const prevMs = pastEvent?.timestamp.getTime() ?? arcData.windowStartMs;
  const nextMs = futureEvent?.timestamp.getTime() ?? arcData.windowEndMs;

  const startEvent: ArcEventMarker = {
    timeMs: prevMs,
    title: pastEvent?.type === "RISE" ? "Rise" : "Set",
    mainLabel: pastEvent ? fmtTime(pastEvent.timestamp, timezone) : fmtTime(new Date(prevMs), timezone),
    subLabel: pastEvent ? `${fmtDurationMs(nowMs - prevMs)} ago` : undefined,
  };

  const endEvent: ArcEventMarker = {
    timeMs: nextMs,
    title: futureEvent?.type === "RISE" ? "Rise" : "Set",
    mainLabel: futureEvent ? fmtTime(futureEvent.timestamp, timezone) : fmtTime(new Date(nextMs), timezone),
    subLabel: futureEvent ? `in ${fmtDurationMs(nextMs - nowMs)}` : undefined,
  };

  // Transit = peak altitude within window
  let transitEvent: ArcTransitEvent | undefined;
  if (curve.length > 0) {
    let peakIdx = 0;
    for (let i = 1; i < curve.length; i++) {
      if (curve[i]!.altitude > curve[peakIdx]!.altitude) peakIdx = i;
    }
    const peak = curve[peakIdx]!;
    if (peak.altitude > 0) {
      transitEvent = {
        timeMs: peak.timestamp,
        altitude: peak.altitude,
        title: `${planetName} Transit`,
        timeLabel: fmtTime(new Date(peak.timestamp), timezone),
      };
    }
  }

  const isAbove = state === "ABOVE";

  const current: ArcCurrentPosition = {
    timeMs: nowMs,
    altitude: positional.altitude,
    azimuth: positional.azimuth,
    isAboveHorizon: isAbove,
    iconUrl: planetIconDataUrl(planetName),
  };

  const status: ArcStatusLine = isAbove
    ? { text: `${Math.round(positional.altitude)}° above horizon`, colorClass: PLANET_THEME.statusAbove }
    : { text: `${Math.round(Math.abs(positional.altitude))}° below horizon`, colorClass: PLANET_THEME.statusBelow };

  return (
    <CelestialPositionArc
      title={`${planetName} Position`}
      curveData={curve}
      current={current}
      peakAltitude={peakAltitude}
      minAltitude={minAltitude}
      startEvent={startEvent}
      endEvent={endEvent}
      transitEvent={transitEvent}
      theme={PLANET_THEME}
      status={status}
      timezone={timezone}
    />
  );
}
