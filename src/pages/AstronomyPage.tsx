import { useContext } from "react";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useAstronomy from "@/hooks/astronomy/useAstronomy";
import { Sun, Moon, Eye, Globe, Clock, CalendarDays } from "lucide-react";

import AstroCard from "@/components/astronomy/AstroCard";
import AstroHero from "@/components/astronomy/AstroHero";
import SectionHeader from "@/components/astronomy/SectionHeader";
import MoonPhaseTimeline from "@/components/astronomy/MoonPhaseTimeline";
import SunPositionArc from "@/components/astronomy/SunPositionArc";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import { fmtTime, fmtDuration } from "@/utils/formatters";

const isPast = (d: Date | null) => d !== null && d.getTime() < Date.now();

export default function AstronomyPage() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };

  const {
    sun,
    sunPosition,
    moon,
    planets,
    nextMoonPhases,
    nextSeason,
    nextRiseSet,
  } = useAstronomy(location.latitude, location.longitude, location.timezone);

  const tz = location.timezone;

  // ─── Badge targets ───
  // Each card shows ITS OWN event only. Three states:
  //
  // 1. Early morning (both future):
  //    sunrise → today's sunrise "in X"
  //    sunset  → yesterday's sunset "X ago"
  //
  // 2. Daytime (sunrise past, sunset future):
  //    sunrise → today's sunrise "X ago"
  //    sunset  → today's sunset "in X"
  //
  // 3. Nighttime (both past):
  //    sunrise → next sunrise "in X"
  //    sunset  → today's sunset "X ago"

  const bothSunFuture = !isPast(sun.sunrise) && !isPast(sun.sunset);
  const bothSunPast = isPast(sun.sunrise) && isPast(sun.sunset);
  const bothMoonFuture = !isPast(moon.moonrise) && !isPast(moon.moonset);
  const bothMoonPast = isPast(moon.moonrise) && isPast(moon.moonset);

  const sunriseBadgeTarget = bothSunPast
    ? nextRiseSet.nextSunrise // state 3: tomorrow's sunrise
    : sun.sunrise; // state 1 & 2: today's sunrise

  const sunsetBadgeTarget = bothSunFuture
    ? nextRiseSet.prevSunset // state 1: yesterday's sunset
    : sun.sunset; // state 2 & 3: today's sunset

  const moonriseBadgeTarget = bothMoonPast
    ? nextRiseSet.nextMoonrise // state 3
    : moon.moonrise; // state 1 & 2

  const moonsetBadgeTarget = bothMoonFuture
    ? nextRiseSet.prevMoonset // state 1
    : moon.moonset; // state 2 & 3

  return (
    <div className="space-y-4">
      <AstroHero />

      {/* Location context */}
      <div className="flex items-center gap-2 px-1">
        <div className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-violet-400" />
        <p className="text-base-content/40 text-xs">
          Showing data for{" "}
          <span className="text-base-content/70 font-medium">
            {location.name}, {location.country}
          </span>
        </p>
      </div>

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
            value={fmtTime(moon.moonrise, tz)}
            badge={
              <CountdownBadge
                target={moonriseBadgeTarget}
                className="bg-violet-500/10 text-violet-400"
              />
            }
            accent="violet"
          />
          <AstroCard
            imageSrc="/moonset.svg"
            title="Moonset"
            value={fmtTime(moon.moonset, tz)}
            badge={
              <CountdownBadge
                target={moonsetBadgeTarget}
                className="bg-violet-500/10 text-violet-400"
              />
            }
            accent="violet"
          />
        </div>
        <div className="mt-3">
          <MoonPhaseTimeline phases={nextMoonPhases} />
        </div>
      </div>

      {/* ── Planets Section ── */}
      <div>
        <SectionHeader icon={Globe} label="Planets" color="text-teal-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {planets.map((planet) => (
            <AstroCard
              key={planet.name}
              icon={Globe}
              title={planet.name}
              value={`↑ ${fmtTime(planet.rise, tz)}`}
              sub={`↓ ${fmtTime(planet.set, tz)}`}
              badge={
                <CountdownBadge
                  target={planet.rise}
                  className="bg-teal-500/10 text-teal-400"
                />
              }
              accent="cyan"
            />
          ))}
        </div>
      </div>

      {/* ── Upcoming Event ── */}
      <div>
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
            accent="violet"
          />
        </div>
      </div>
    </div>
  );
}
