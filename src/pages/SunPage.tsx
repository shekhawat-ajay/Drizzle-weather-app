import { useOutletContext } from "react-router";
import { Sun } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import SunPositionArc from "@/components/astronomy/SunPositionArc";
import { fmtTime, fmtDuration } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

const isPast = (d: Date | null) => d !== null && d.getTime() < Date.now();

export default function SunPage() {
  const { tz, astronomyData } = useOutletContext<AstronomyOutletContext>();
  const { sun, sunPosition, nextRiseSet } = astronomyData;

  const bothSunFuture = !isPast(sun.sunrise) && !isPast(sun.sunset);
  const bothSunPast = isPast(sun.sunrise) && isPast(sun.sunset);

  const sunriseBadgeTarget = bothSunPast
    ? nextRiseSet.nextSunrise
    : sun.sunrise;

  const sunsetBadgeTarget = bothSunFuture
    ? nextRiseSet.prevSunset
    : sun.sunset;

  return (
    <div className="space-y-4">
      {/* ── Sun Section ── */}
      <div>
        <SectionHeader icon={Sun} label="Sun" color="text-amber-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AstroCard
            imageSrc="/sunrise.svg"
            title="Sunrise"
            value={fmtTime(sun.sunrise, tz)}
            sub={`First light ${fmtTime(sun.civilDawn, tz)}`}
            badge={<CountdownBadge target={sunriseBadgeTarget} />}
            accent="amber"
          />
          <AstroCard
            imageSrc="/sunset.svg"
            title="Sunset"
            value={fmtTime(sun.sunset, tz)}
            sub={`Last light ${fmtTime(sun.civilDusk, tz)}`}
            badge={<CountdownBadge target={sunsetBadgeTarget} />}
            accent="rose"
          />
          <AstroCard
            imageSrc="/sun.svg"
            title="Day Length"
            value={fmtDuration(sun.dayLengthMinutes)}
            sub={`Golden hour ${fmtTime(sun.goldenHourStart, tz)}`}
            badge={
              <CountdownBadge target={sun.goldenHourStart} label="Golden hr" />
            }
            accent="amber"
          />
        </div>
        <div className="mt-3">
          <SunPositionArc
            sunPosition={sunPosition}
            sunrise={sun.sunrise}
            sunset={sun.sunset}
            timezone={tz}
          />
        </div>
      </div>

    </div>
  );
}
