import { useContext } from "react";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useAstronomy from "@/hooks/astronomy/useAstronomy";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Star,
  Eye,
  Globe,
  Clock,
  CalendarDays,
} from "lucide-react";

import AstroCard from "@/components/astronomy/AstroCard";
import AstroHero from "@/components/astronomy/AstroHero";
import SectionHeader from "@/components/astronomy/SectionHeader";
import MoonPhaseTimeline from "@/components/astronomy/MoonPhaseTimeline";
import { fmtTime, fmtDuration } from "@/utils/formatters";

export default function AstronomyPage() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };

  const { sun, moon, planets, nextMoonPhases, nextSeason, stargazing } =
    useAstronomy(location.latitude, location.longitude, location.timezone);

  const tz = location.timezone;

  return (
    <div className="space-y-4">
      <AstroHero moonEmoji={moon.emoji} />

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
            icon={Sunrise}
            title="Sunrise"
            value={fmtTime(sun.sunrise, tz)}
            sub={`First light ${fmtTime(sun.civilDawn, tz)}`}
            accent="amber"
          />
          <AstroCard
            icon={Sunset}
            title="Sunset"
            value={fmtTime(sun.sunset, tz)}
            sub={`Last light ${fmtTime(sun.civilDusk, tz)}`}
            accent="rose"
          />
          <AstroCard
            icon={Sun}
            title="Day Length"
            value={fmtDuration(sun.dayLengthMinutes)}
            sub={`Golden hour ${fmtTime(sun.goldenHourStart, tz)}`}
            accent="amber"
          />
        </div>
      </div>

      {/* ── Moon Section ── */}
      <div>
        <SectionHeader icon={Moon} label="Moon" color="text-violet-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AstroCard
            icon={Moon}
            title="Phase"
            value={moon.phaseName}
            sub={`${moon.emoji}  ${Math.round(moon.phaseDegrees)}°`}
            accent="violet"
          />
          <AstroCard
            icon={Eye}
            title="Illumination"
            value={`${Math.round(moon.illuminationFraction * 100)}%`}
            sub={`↑ ${fmtTime(moon.moonrise, tz)}  •  ↓ ${fmtTime(moon.moonset, tz)}`}
            accent="cyan"
          />
          <AstroCard
            icon={Star}
            title="Stargazing"
            value={stargazing.label}
            sub={stargazing.description}
            accent="violet"
          />
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
              accent="cyan"
            />
          ))}
        </div>
      </div>

      {/* ── Moon Phase Timeline ── */}
      <MoonPhaseTimeline phases={nextMoonPhases} />

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
            accent="cyan"
          />
          <AstroCard
            icon={Clock}
            title="Twilight"
            value={`Nautical ${fmtTime(sun.nauticalDusk, tz)}`}
            sub={`Astronomical ${fmtTime(sun.astronomicalDusk, tz)}`}
            accent="violet"
          />
        </div>
      </div>
    </div>
  );
}
