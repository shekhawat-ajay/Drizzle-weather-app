import { useOutletContext } from "react-router";
import { Moon, Ruler, Calendar } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import MoonPositionArc from "@/components/astronomy/MoonPositionArc";
import MoonPhaseTimeline from "@/components/astronomy/MoonPhaseTimeline";
import { fmtTime } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

export default function MoonPage() {
  const { tz, astronomyData } = useOutletContext<AstronomyOutletContext>();
  const { moon, moonPosition, nextMoonPhases } = astronomyData;

  const moonBelow = !moonPosition.isAboveHorizon;
  const moonriseTime = moonBelow
    ? moonPosition.nextEvent
    : moonPosition.previousEvent;

  const moonsetTime = moonBelow
    ? moonPosition.previousEvent
    : moonPosition.nextEvent;

  return (
    <div className="space-y-4">
      <div>
        <SectionHeader icon={Moon} label="Moon" color="text-violet-400" />

        {/* ── Hero: Current Moon Phase Image ── */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="relative">
            <img
              src={moon.icon}
              alt={moon.phaseName}
              className="size-68 rounded-full object-cover ring-2 ring-violet-500/20"
              onError={(e) => {
                e.currentTarget.src = moon.iconFallback;
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-base-content text-lg font-semibold">
              {moon.phaseName}
            </p>
            <p className="text-base-content/40 text-sm">
              {Math.round(moon.illuminationFraction * 100)}% illuminated ·{" "}
              {Math.round(moon.phaseDegrees)}°
            </p>
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid gap-3 md:grid-cols-4">
          <AstroCard
            icon={Calendar}
            title="Moon Age"
            value={`${moon.moonAge.toFixed(1)} days`}
            sub="Into current lunation"
            accent="violet"
          />
          <AstroCard
            icon={Ruler}
            title="Distance"
            value={`${(moon.distanceKm / 1000).toFixed(0)}k km`}
            sub={
              moon.distanceKm < 363300
                ? "Near perigee"
                : moon.distanceKm > 405500
                  ? "Near apogee"
                  : "Average distance"
            }
            accent="cyan"
          />
          <AstroCard
            imageSrc="/moonrise.svg"
            title="Moonrise"
            value={fmtTime(moonriseTime, tz)}
            badge={
              <CountdownBadge
                target={moonriseTime}
                className="bg-violet-500/10 text-violet-400"
              />
            }
            accent="violet"
          />
          <AstroCard
            imageSrc="/moonset.svg"
            title="Moonset"
            value={fmtTime(moonsetTime, tz)}
            badge={
              <CountdownBadge
                target={moonsetTime}
                className="bg-violet-500/10 text-violet-400"
              />
            }
            accent="violet"
          />
        </div>

        {/* ── Moon Position Arc ── */}
        <div className="mt-3">
          <MoonPositionArc
            moonPosition={moonPosition}
            phaseIcon={moon.icon}
            timezone={tz}
          />
        </div>

        {/* ── Upcoming Phases ── */}
        <div className="mt-3">
          <MoonPhaseTimeline phases={nextMoonPhases} />
        </div>
      </div>
    </div>
  );
}
