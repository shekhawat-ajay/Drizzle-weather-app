import { useParams, Navigate, useOutletContext } from "react-router";
import { ArrowUp, ArrowDown, Star, Sun, ArrowUpRight, ArrowDownRight } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import CelestialIcon from "@/components/astronomy/CelestialIcon";
import PlanetPositionArc from "@/components/astronomy/PlanetPositionArc";
import { fmtTime, fmtAzimuth } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

const VALID_PLANETS = new Set([
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
]);

const PlanetIcon = (props: { className?: string; size?: number }) => {
  const { planet } = useParams<{ planet: string }>();
  const planetName = planet
    ? planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase()
    : "";
  return <CelestialIcon name={planetName} {...props} />;
};

export default function PlanetPage() {
  const { planet } = useParams<{ planet: string }>();
  const { tz, astronomyData, celestialData, location } = useOutletContext<AstronomyOutletContext>();

  // Title case the parameter (e.g., "mars" -> "Mars")
  const planetName = planet
    ? planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase()
    : "";

  // Validate it's a known planet (excluding Earth/Moon) — show 404 for unknown
  if (!VALID_PLANETS.has(planetName)) {
    return <Navigate to="/404" replace />;
  }

  const celestial = celestialData.find((c) => c.body === planetName);
  const positional = astronomyData.planets.find((p) => p.name === planetName);

  if (!celestial || !positional) {
    return (
      <div className="p-4 text-center text-base-content/50">
        Data unavailable for {planetName}.
      </div>
    );
  }

  const isAbove = celestial.state === "ABOVE";

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <SectionHeader
            icon={PlanetIcon}
            label={`${planetName} Overview`}
            color="text-primary"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AstroCard
              icon={celestial.pastEvent?.type === "RISE" ? ArrowUpRight : ArrowDownRight}
              title={`Last Event: ${celestial.pastEvent?.type === "RISE" ? "Rise" : "Set"}`}
              value={
                celestial.pastEvent?.timestamp
                  ? fmtTime(celestial.pastEvent.timestamp, tz)
                  : "--"
              }
              sub={celestial.pastLabel}
              accent="primary"
            />
            <AstroCard
               icon={celestial.futureEvent?.type === "RISE" ? ArrowUpRight : ArrowDownRight}
               title={`Next Event: ${celestial.futureEvent?.type === "RISE" ? "Rise" : "Set"}`}
               value={
                 celestial.futureEvent?.timestamp
                   ? fmtTime(celestial.futureEvent.timestamp, tz)
                   : "--"
               }
               badge={
                 celestial.futureEvent?.timestamp ? (
                   <CountdownBadge
                     target={celestial.futureEvent.timestamp}
                     className="bg-primary/12 text-primary"
                   />
                 ) : undefined
               }
               accent="primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
            <AstroCard
              icon={isAbove ? ArrowUp : ArrowDown}
              title="Current Position"
              value={`${positional.altitude.toFixed(1)}°`}
              sub={`Azimuth: ${positional.azimuth.toFixed(1)}° (${fmtAzimuth(positional.azimuth)})`}
              badge={
                isAbove ? (
                  <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/12 uppercase tracking-wide">Above Horizon</span>
                ) : (
                  <span className="text-xs text-base-content/40 font-medium px-2 py-0.5 rounded-full bg-base-content/5 uppercase tracking-wide">Below Horizon</span>
                )
              }
              accent={isAbove ? "primary" : "muted"}
            />

            <AstroCard
              icon={Star}
              title="Visibility & Magnitude"
              value={positional.magnitude.toFixed(1)}
              sub={celestial.visibilityNote || "No visibility notes"}
              badge={
                celestial.elongation !== null ? (
                  <span className="inline-flex items-center gap-1 text-accent text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/12">
                    <Sun size={10} />
                    {celestial.elongation.toFixed(0)}° from Sun
                  </span>
                ) : undefined
              }
               info="Visual magnitude measures brightness. Lower numbers mean brighter objects (e.g., Venus is highly negative). Above +6 requires a telescope."
              accent="accent"
            />
          </div>

          <div className="mt-4">
            <PlanetPositionArc
              planetName={planetName}
              latitude={location.latitude}
              longitude={location.longitude}
              celestial={celestial}
              positional={positional}
              timezone={tz}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
