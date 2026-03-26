import { useOutletContext } from "react-router";
import { Clock, CalendarDays, Eclipse, Globe, Star, Cloud } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import CelestialTable from "@/components/astronomy/CelestialTable";
import { fmtTime } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

export default function OverviewPage() {
  const { tz, cloudCover, astronomyData, celestialData } = useOutletContext<AstronomyOutletContext>();
  const { sun, nextSeason, upcomingEclipses, stargazing } = astronomyData;

  return (
    <div className="space-y-6">
      {/* ── All Bodies Table ── */}
      <div>
        <SectionHeader icon={Globe} label="Celestial Overview" color="text-teal-400" />
        <CelestialTable data={astronomyData} celestial={celestialData} timezone={tz} />
      </div>

      {/* ── Night Sky Section ── */}
      <div className="mt-4">
        <SectionHeader icon={Star} label="Night Sky" color="text-violet-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AstroCard
            icon={Star}
            title="Stargazing Suitability"
            value={stargazing.label}
            sub={stargazing.description}
            accent="violet"
          />
          <AstroCard
            icon={Cloud}
            title="Cloud Cover"
            value={cloudCover != null ? `${cloudCover}%` : "--"}
            sub="Current sky coverage"
            accent="cyan"
          />
        </div>
      </div>

      {/* ── Upcoming Event ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
        <div className="flex flex-col">
          <SectionHeader
            icon={CalendarDays}
            label="Upcoming"
            color="text-cyan-400"
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
                  className="bg-cyan-500/10 text-cyan-400"
                />
              }
              info="Equinoxes mark when day and night are roughly equal. Solstices mark the longest and shortest days of the year."
              accent="cyan"
            />
            <AstroCard
              icon={Clock}
              title="Twilight"
              value={`Nautical ${fmtTime(sun.nauticalDusk, tz)}`}
              sub={`Astronomical ${fmtTime(sun.astronomicalDusk, tz)}`}
              badge={
                <CountdownBadge
                  target={sun.nauticalDusk}
                  className="bg-violet-500/10 text-violet-400"
                />
              }
              info="Nautical twilight is when the horizon becomes difficult to distinguish. Astronomical twilight is when it's dark enough to see faint stars."
              accent="violet"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <SectionHeader
            icon={Eclipse}
            label="Eclipses this Year"
            color="text-rose-400"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upcomingEclipses.slice(0, 2).map((eclipse, i) => (
              <AstroCard
                key={i}
                icon={Eclipse}
                title={`${eclipse.type} ${eclipse.kind} Eclipse`}
                value={eclipse.peak.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                badge={
                  <CountdownBadge
                    target={eclipse.peak}
                    className="bg-rose-500/10 text-rose-400"
                  />
                }
                accent="rose"
              />
            ))}
            {upcomingEclipses.length === 0 && (
              <p className="text-base-content/50 text-sm">
                No more eclipses this year.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
