import { useOutletContext } from "react-router";
import { CalendarDays, Eclipse, Globe } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import CelestialTable from "@/components/astronomy/CelestialTable";
import NightSky from "@/components/astronomy/NightSky";
import StargazingBanner from "@/components/astronomy/StargazingBanner";
import useStargazingIndex from "@/hooks/astronomy/useStargazingIndex";
import PlanetaryEventsTimeline from "@/components/astronomy/PlanetaryEventsTimeline";
import MeteorShowers from "@/components/astronomy/MeteorShowers";
import TonightStrip from "@/components/astronomy/TonightStrip";
import VisibleTonight from "@/components/astronomy/VisibleTonight";
import SevenNightOutlook from "@/components/astronomy/SevenNightOutlook";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

export default function OverviewPage() {
  const { tz, location, astronomyData, celestialData } = useOutletContext<AstronomyOutletContext>();
  const { nextSeason, upcomingEclipses, stargazing, sunPosition } = astronomyData;

  const isDaytime = sunPosition.isAboveHorizon;
  // Same source of truth as the NightSky card (falls back while hourly loads)
  const liveStargazing = useStargazingIndex(
    location.latitude,
    location.longitude,
    tz,
    astronomyData.moon.illuminationFraction,
    astronomyData.sunPosition.altitude,
    astronomyData.moonPosition.altitude,
    sunPosition.isAboveHorizon,
  );
  const nextSolar = upcomingEclipses.find((e) => e.kind === "solar") ?? null;
  const nextLunar = upcomingEclipses.find((e) => e.kind === "lunar") ?? null;

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Stargazing banner — full width, like weather hero */}
      <div className="col-span-12">
        <StargazingBanner stargazing={liveStargazing ?? stargazing} isDaytime={isDaytime} />
      </div>

      {/* Tonight at a glance — chronological strip */}
      <div className="col-span-12">
        <TonightStrip astronomyData={astronomyData} timezone={tz} />
      </div>

      {/* Visible tonight — naked-eye filter */}
      <div className="col-span-12">
        <VisibleTonight astronomyData={astronomyData} celestialData={celestialData} timezone={tz} />
      </div>

      {/* Celestial table — full width card */}
      <div className="col-span-12">
        <div className="card bg-base-200 border border-base-content/5 p-5">
          <SectionHeader icon={Globe} label="Celestial Overview" color="text-primary" />
          <CelestialTable data={astronomyData} celestial={celestialData} timezone={tz} />
        </div>
      </div>

      {/* Night Sky — full width */}
      <div className="col-span-12">
        <NightSky />
      </div>

      {/* 7-night outlook — best dark-hour score per night */}
      <div className="col-span-12">
        <SevenNightOutlook />
      </div>

      {/* Upcoming — consolidated: Season + Solar & Lunar eclipses */}
      <div className="col-span-12">
        <div className="card bg-base-200 border border-base-content/5 p-5">
          <SectionHeader
            icon={CalendarDays}
            label="Upcoming"
            color="text-primary"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  className="badge-primary"
                />
              }
              info="Equinoxes mark when day and night are roughly equal. Solstices mark the longest and shortest days of the year."
              accent="primary"
            />
            {nextSolar ? (
              <AstroCard
                icon={Eclipse}
                title={`Solar — ${nextSolar.type}`}
                value={nextSolar.peak.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                sub={nextSolar.isLocal ? "Visible locally" : "Not visible locally"}
                badge={
                  <CountdownBadge
                    target={nextSolar.peak}
                    className={nextSolar.isLocal ? "badge-accent" : "badge-ghost"}
                  />
                }
                accent={nextSolar.isLocal ? "accent" : "muted"}
              />
            ) : (
              <div className="card border border-base-content/5 bg-base-300 p-5 items-center justify-center">
                <p className="text-base-content/40 text-sm">No upcoming solar eclipse</p>
              </div>
            )}
            {nextLunar ? (
              <AstroCard
                icon={Eclipse}
                title={`Lunar — ${nextLunar.type}`}
                value={nextLunar.peak.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                sub={nextLunar.isLocal ? "Visible locally" : "Not visible locally"}
                badge={
                  <CountdownBadge
                    target={nextLunar.peak}
                    className={nextLunar.isLocal ? "badge-primary" : "badge-ghost"}
                  />
                }
                accent={nextLunar.isLocal ? "primary" : "muted"}
              />
            ) : (
              <div className="card border border-base-content/5 bg-base-300 p-5 items-center justify-center">
                <p className="text-base-content/40 text-sm">No upcoming lunar eclipse</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planetary Events Timeline */}
      <div className="col-span-12">
        <PlanetaryEventsTimeline />
      </div>

      {/* Meteor Showers */}
      <div className="col-span-12">
        <MeteorShowers />
      </div>
    </div>
  );
}
