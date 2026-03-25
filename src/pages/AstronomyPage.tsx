import { useContext } from "react";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useAstronomy from "@/hooks/astronomy/useAstronomy";
import useCelestial from "@/hooks/astronomy/useCelestial";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
import {
  Sun,
  Moon,
  Eye,
  Globe,
  Clock,
  CalendarDays,
  Eclipse,
  Star,
  Cloud,
} from "lucide-react";

import AstroCard from "@/components/astronomy/AstroCard";
import AstroHero from "@/components/astronomy/AstroHero";
import SectionHeader from "@/components/astronomy/SectionHeader";
import MoonPhaseTimeline from "@/components/astronomy/MoonPhaseTimeline";
import SunPositionArc from "@/components/astronomy/SunPositionArc";
import MoonPositionArc from "@/components/astronomy/MoonPositionArc";
import PlanetsTable from "@/components/astronomy/PlanetsTable";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import { fmtTime, fmtDuration } from "@/utils/formatters";

const isPast = (d: Date | null) => d !== null && d.getTime() < Date.now();

export default function AstronomyPage() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };

  const { data: currentW } = useCurrentWeather(
    location.latitude,
    location.longitude
  );
  const cloudCover = currentW?.current?.cloudCover ?? null;

  const {
    sun,
    sunPosition,
    moon,
    moonPosition,
    planets,
    nextMoonPhases,
    nextSeason,
    nextRiseSet,
    upcomingEclipses,
    stargazing,
  } = useAstronomy(
    location.latitude,
    location.longitude,
    location.timezone,
    cloudCover
  );

  const tz = location.timezone;

  const celestial = useCelestial(location.latitude, location.longitude);

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

  const sunriseBadgeTarget = bothSunPast
    ? nextRiseSet.nextSunrise // state 3: tomorrow's sunrise
    : sun.sunrise; // state 1 & 2: today's sunrise

  const sunsetBadgeTarget = bothSunFuture
    ? nextRiseSet.prevSunset // state 1: yesterday's sunset
    : sun.sunset; // state 2 & 3: today's sunset

  // Moon: harmonize card values + badges with the Moon Position Arc.
  // The arc shows [previousEvent … nextEvent] based on horizon state.
  // Cards should show the same contextually relevant events.
  //
  // BELOW horizon: previousEvent=lastSet, nextEvent=nextRise
  //   → Moonrise card = next rise (future), Moonset card = prev set (past)
  // ABOVE horizon: previousEvent=lastRise, nextEvent=nextSet
  //   → Moonrise card = prev rise (past), Moonset card = next set (future)

  const moonBelow = !moonPosition.isAboveHorizon;

  const moonriseTime = moonBelow
    ? moonPosition.nextEvent // next rise (future)
    : moonPosition.previousEvent; // prev rise (past)

  const moonsetTime = moonBelow
    ? moonPosition.previousEvent // prev set (past)
    : moonPosition.nextEvent; // next set (future)

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

      {/* ── Night Sky Section ── */}
      <div>
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

      {/* ── Planets Section ── */}
      <div>
        <SectionHeader icon={Globe} label="Planets" color="text-teal-400" />
        <PlanetsTable planets={planets} celestial={celestial} timezone={tz} />
      </div>

      {/* ── Upcoming Event ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                sub={fmtTime(eclipse.peak, tz)}
                badge={
                  <CountdownBadge
                    target={eclipse.peak}
                    className="bg-rose-500/10 text-rose-400"
                  />
                }
                accent="rose"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
