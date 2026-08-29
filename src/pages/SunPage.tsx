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
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <SectionHeader icon={Sun} label="Sun" color="text-accent" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <AstroCard
              imageSrc="/sunrise.svg"
              title="Sunrise"
              value={fmtTime(sun.sunrise, tz)}
              sub={`First light ${fmtTime(sun.civilDawn, tz)}`}
              badge={<CountdownBadge target={sunriseBadgeTarget} />}
              accent="accent"
            />
            <AstroCard
              imageSrc="/sunset.svg"
              title="Sunset"
              value={fmtTime(sun.sunset, tz)}
              sub={`Last light ${fmtTime(sun.civilDusk, tz)}`}
              badge={<CountdownBadge target={sunsetBadgeTarget} />}
              accent="accent"
            />
            <AstroCard
              imageSrc="/sun.svg"
              title="Day Length"
              value={fmtDuration(sun.dayLengthMinutes)}
              sub={`Golden hour ${fmtTime(sun.goldenHourStart, tz)}`}
              badge={
                <CountdownBadge target={sun.goldenHourStart} label="Golden hr" />
              }
              accent="accent"
            />
          </div>
          <div className="mt-4">
            <SunPositionArc
              sunPosition={sunPosition}
              timezone={tz}
            />
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <TwilightTable
            sun={sun}
            sunPosition={sunPosition}
            nextRiseSet={nextRiseSet}
            timezone={tz}
          />
        </div>
      </div>

      {astronomyData.upcomingEclipses.filter(e => e.kind === "solar").length > 0 ? (
        <div className="col-span-12">
          <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
            <SectionHeader icon={Eclipse} label="Upcoming Solar Eclipses" color="text-accent" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
              {astronomyData.upcomingEclipses.filter(e => e.kind === "solar").slice(0, 2).map((eclipse, i) => (
                <div key={eclipse.peak.getTime()} className="rounded-xl border border-accent/15 bg-base-300 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-accent/12 p-2 rounded-lg text-accent">
                        <Eclipse size={16} />
                      </div>
                      <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
                        {i === 0 ? "Next Eclipse" : "Later Eclipse"}
                      </p>
                    </div>
                    {eclipse.isLocal ? (
                      <div className="badge badge-sm bg-accent/15 text-accent border-accent/15">Visible Locally</div>
                    ) : null}
                  </div>
                  <p className="text-base-content text-xl font-semibold capitalize flex items-center gap-2">
                    {eclipse.type}
                  </p>
                  <p className="text-base-content/40 text-xs">
                    {fmtShortDate(eclipse.peak)}
                  </p>
                  <div className="mt-1">
                    <CountdownBadge target={eclipse.peak} className="bg-accent/12 text-accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
