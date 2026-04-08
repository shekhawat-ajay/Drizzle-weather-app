import { useOutletContext } from "react-router";
import { Sun, Eclipse } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import SunPositionArc from "@/components/astronomy/SunPositionArc";
import TwilightTable from "@/components/astronomy/TwilightTable";
import { fmtTime, fmtDuration, fmtShortDate } from "@/utils/formatters";
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
            timezone={tz}
          />
        </div>
        <div className="mt-6">
          <TwilightTable
            sun={sun}
            sunPosition={sunPosition}
            nextRiseSet={nextRiseSet}
            timezone={tz}
          />
        </div>
      </div>

      {astronomyData.upcomingEclipses.filter(e => e.kind === "solar").length > 0 && (
        <div className="mt-6">
          <SectionHeader icon={Eclipse} label="Upcoming Solar Eclipses" color="text-amber-500" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
            {astronomyData.upcomingEclipses.filter(e => e.kind === "solar").slice(0, 2).map((eclipse, i) => (
              <div key={i} className="card card-border border-amber-500/10 bg-base-200/40 group hover:bg-base-200/60 transition-colors">
                <div className="card-body p-5 gap-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                        <Eclipse size={16} />
                      </div>
                      <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
                        {i === 0 ? "Next Eclipse" : "Later Eclipse"}
                      </p>
                    </div>
                    {eclipse.isLocal && (
                      <div className="badge badge-warning badge-sm opacity-80">Visible Locally</div>
                    )}
                  </div>
                  <p className="text-base-content text-xl font-semibold capitalize flex items-center gap-2">
                    {eclipse.type}
                  </p>
                  <p className="text-base-content/40 text-xs">
                    {fmtShortDate(eclipse.peak)}
                  </p>
                  <div className="mt-1">
                    <CountdownBadge target={eclipse.peak} className="bg-amber-500/10 text-amber-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
