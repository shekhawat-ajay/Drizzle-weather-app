import { useOutletContext } from "react-router";
import { Clock, CalendarDays, Eclipse, Globe } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import CelestialTable from "@/components/astronomy/CelestialTable";
import NightSky from "@/components/astronomy/NightSky";
import StargazingBanner from "@/components/astronomy/StargazingBanner";
import { fmtTime } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

export default function OverviewPage() {
  const { tz, astronomyData, celestialData } = useOutletContext<AstronomyOutletContext>();
  const { sun, nextSeason, upcomingEclipses, stargazing, sunPosition } = astronomyData;

  const isDaytime = sunPosition.isAboveHorizon;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Stargazing banner — full width, like weather hero */}
      <div className="col-span-12">
        <StargazingBanner stargazing={stargazing} isDaytime={isDaytime} />
      </div>

      {/* Celestial table — full width card */}
      <div className="col-span-12">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <SectionHeader icon={Globe} label="Celestial Overview" color="text-primary" />
          <CelestialTable data={astronomyData} celestial={celestialData} timezone={tz} />
        </div>
      </div>

      {/* Night Sky — full width */}
      <div className="col-span-12">
        <NightSky />
      </div>

      {/* Upcoming — two equal cards, weather-style grid */}
      <div className="col-span-12 md:col-span-6">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5 h-full">
          <SectionHeader
            icon={CalendarDays}
            label="Upcoming"
            color="text-primary"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AstroCard
              icon={CalendarDays}
              title="Next Season"
              value={nextSeason.name}
              sub={nextSeason.date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              badge={
                <CountdownBadge
                  target={nextSeason.date}
                  className="bg-primary/12 text-primary"
                />
              }
              info="Equinoxes mark when day and night are roughly equal. Solstices mark the longest and shortest days of the year."
              accent="primary"
            />
            <AstroCard
              icon={Clock}
              title="Twilight"
              value={`Nautical ${fmtTime(sun.nauticalDusk, tz)}`}
              sub={`Astronomical ${fmtTime(sun.astronomicalDusk, tz)}`}
              badge={
                <CountdownBadge
                  target={sun.nauticalDusk}
                  className="bg-primary/12 text-primary"
                />
              }
              info="Nautical twilight is when the horizon becomes difficult to distinguish. Astronomical twilight is when it's dark enough to see faint stars."
              accent="primary"
            />
          </div>
        </div>
      </div>

      <div className="col-span-12 md:col-span-6">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5 h-full">
          <SectionHeader
            icon={Eclipse}
            label="Visible Eclipses"
            color="text-primary"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upcomingEclipses
              .filter((e) => e.isLocal)
              .slice(0, 2)
              .map((eclipse) => (
                <AstroCard
                  key={`${eclipse.type}-${eclipse.kind}-${eclipse.peak.getTime()}`}
                  icon={Eclipse}
                  title={`${eclipse.type} ${eclipse.kind} Eclipse`}
                  value={eclipse.peak.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  badge={
                    <CountdownBadge
                      target={eclipse.peak}
                      className="bg-accent/12 text-accent"
                    />
                  }
                  accent="accent"
                />
              ))}
            {upcomingEclipses.filter((e) => e.isLocal).length === 0 ? (
              <p className="text-base-content/50 text-sm">
                No visible eclipses expected soon.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
