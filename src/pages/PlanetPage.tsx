import { useParams, Navigate, useOutletContext } from "react-router";
import { ArrowUp, ArrowDown, Star, Sun, Globe, ArrowUpRight, ArrowDownRight } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import { fmtTime, fmtAzimuth } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

const PLANET_EMOJI: Record<string, string> = {
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "⛢",
  Neptune: "♆",
};

export default function PlanetPage() {
  const { planet } = useParams<{ planet: string }>();
  const { tz, astronomyData, celestialData } = useOutletContext<AstronomyOutletContext>();

  // Title case the parameter (e.g., "mars" -> "Mars")
  const planetName = planet
    ? planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase()
    : "";

  // Validate it's a known planet (excluding Earth/Moon)
  if (!PLANET_EMOJI[planetName as keyof typeof PLANET_EMOJI]) {
    return <Navigate to="/astronomy/sun" replace />;
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
    <div className="space-y-4">
      <SectionHeader
        icon={Globe}
        label={`${PLANET_EMOJI[planetName]} ${planetName} Overview`}
        color="text-teal-400"
      />

      {/* Primary Event Cards */}
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
          accent="teal"
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
                 className="bg-teal-500/10 text-teal-400"
               />
             ) : undefined
           }
           sub={celestial.futureLabel}
           accent="teal"
        />
      </div>

      {/* Detailed Position & Visibility cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AstroCard
          icon={isAbove ? ArrowUp : ArrowDown}
          title="Current Position"
          value={`${positional.altitude.toFixed(1)}°`}
          sub={`Azimuth: ${positional.azimuth.toFixed(1)}° (${fmtAzimuth(positional.azimuth)})`}
          badge={
            isAbove ? (
              <span className="text-xs text-teal-400 font-medium px-2 py-0.5 rounded-full bg-teal-500/10 uppercase tracking-wide">Above Horizon</span>
            ) : (
              <span className="text-xs text-base-content/40 font-medium px-2 py-0.5 rounded-full bg-base-content/5 uppercase tracking-wide">Below Horizon</span>
            )
          }
          accent={isAbove ? "teal" : "violet"}
        />

        <AstroCard
          icon={Star}
          title="Visibility & Magnitude"
          value={positional.magnitude.toFixed(1)}
          sub={celestial.visibilityNote || "No visibility notes"}
          badge={
            celestial.elongation !== null ? (
              <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10">
                <Sun size={10} />
                {celestial.elongation.toFixed(0)}° from Sun
              </span>
            ) : undefined
          }
           info="Visual magnitude measures brightness. Lower numbers mean brighter objects (e.g., Venus is highly negative). Above +6 requires a telescope."
          accent="amber"
        />
      </div>
    </div>
  );
}
