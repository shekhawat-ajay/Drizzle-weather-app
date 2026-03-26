import { useOutletContext } from "react-router";
import { Moon, Eye } from "lucide-react";
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
      {/* ── Moon Section ── */}
      <div>
        <SectionHeader icon={Moon} label="Moon" color="text-violet-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <AstroCard
            imageSrc={moon.icon}
            title="Phase"
            value={moon.phaseName}
            sub={`${Math.round(moon.phaseDegrees)}°`}
            accent="violet"
          />
          <AstroCard
            icon={Eye}
            title="Illumination"
            value={`${Math.round(moon.illuminationFraction * 100)}%`}
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
        <div className="mt-3">
          <MoonPositionArc
            moonPosition={moonPosition}
            phaseIcon={moon.icon}
            timezone={tz}
          />
        </div>
        <div className="mt-3">
          <MoonPhaseTimeline phases={nextMoonPhases} />
        </div>
      </div>
    </div>
  );
}
