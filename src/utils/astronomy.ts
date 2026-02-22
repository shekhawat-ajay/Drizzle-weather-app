import {
  Body,
  Observer,
  SearchRiseSet,
  SearchAltitude,
  MoonPhase,
  Illumination,
  SearchMoonQuarter,
  NextMoonQuarter,
  Seasons,
} from "astronomy-engine";

import type {
  SunData,
  MoonData,
  PlanetData,
  NextMoonPhaseData,
  SeasonData,
} from "@/types/astronomy";

/* ─── Helpers ─── */
const PHASE_NAMES: Record<number, { name: string; emoji: string }> = {
  0: { name: "New Moon", emoji: "🌑" },
  1: { name: "First Quarter", emoji: "🌓" },
  2: { name: "Full Moon", emoji: "🌕" },
  3: { name: "Third Quarter", emoji: "🌗" },
};

function getMoonPhaseName(degrees: number): { name: string; emoji: string } {
  if (degrees < 22.5) return { name: "New Moon", emoji: "🌑" };
  if (degrees < 67.5) return { name: "Waxing Crescent", emoji: "🌒" };
  if (degrees < 112.5) return { name: "First Quarter", emoji: "🌓" };
  if (degrees < 157.5) return { name: "Waxing Gibbous", emoji: "🌔" };
  if (degrees < 202.5) return { name: "Full Moon", emoji: "🌕" };
  if (degrees < 247.5) return { name: "Waning Gibbous", emoji: "🌖" };
  if (degrees < 292.5) return { name: "Third Quarter", emoji: "🌗" };
  if (degrees < 337.5) return { name: "Waning Crescent", emoji: "🌘" };
  return { name: "New Moon", emoji: "🌑" };
}

function toDateOrNull(
  astroTime: ReturnType<typeof SearchRiseSet>,
): Date | null {
  return astroTime ? astroTime.date : null;
}

/* ─── Core calculators ─── */

export function calcSunData(lat: number, lon: number, date: Date): SunData {
  const observer = new Observer(lat, lon, 0);

  // Sunrise / Sunset
  const sunrise = SearchRiseSet(Body.Sun, observer, +1, date, 1);
  const sunset = SearchRiseSet(Body.Sun, observer, -1, date, 1);

  // Twilights (civil = -6°, nautical = -12°, astronomical = -18°)
  const civilDawn = SearchAltitude(Body.Sun, observer, +1, date, 1, -6);
  const civilDusk = SearchAltitude(Body.Sun, observer, -1, date, 1, -6);
  const nauticalDawn = SearchAltitude(Body.Sun, observer, +1, date, 1, -12);
  const nauticalDusk = SearchAltitude(Body.Sun, observer, -1, date, 1, -12);
  const astronomicalDawn = SearchAltitude(Body.Sun, observer, +1, date, 1, -18);
  const astronomicalDusk = SearchAltitude(Body.Sun, observer, -1, date, 1, -18);

  // Day length
  let dayLengthMinutes: number | null = null;
  if (sunrise && sunset) {
    dayLengthMinutes = (sunset.date.getTime() - sunrise.date.getTime()) / 60000;
  }

  // Golden hour ≈ sun altitude 6° (descending before sunset)
  const goldenHourStart = SearchAltitude(Body.Sun, observer, -1, date, 1, 6);

  return {
    sunrise: toDateOrNull(sunrise),
    sunset: toDateOrNull(sunset),
    civilDawn: toDateOrNull(civilDawn),
    civilDusk: toDateOrNull(civilDusk),
    nauticalDawn: toDateOrNull(nauticalDawn),
    nauticalDusk: toDateOrNull(nauticalDusk),
    astronomicalDawn: toDateOrNull(astronomicalDawn),
    astronomicalDusk: toDateOrNull(astronomicalDusk),
    dayLengthMinutes,
    goldenHourStart: toDateOrNull(goldenHourStart),
  };
}

export function calcMoonData(lat: number, lon: number, date: Date): MoonData {
  const observer = new Observer(lat, lon, 0);

  const moonrise = SearchRiseSet(Body.Moon, observer, +1, date, 1);
  const moonset = SearchRiseSet(Body.Moon, observer, -1, date, 1);

  const phaseDegrees = MoonPhase(date);
  const { name: phaseName, emoji } = getMoonPhaseName(phaseDegrees);

  const illum = Illumination(Body.Moon, date);
  const illuminationFraction = illum.phase_fraction;

  return {
    moonrise: toDateOrNull(moonrise),
    moonset: toDateOrNull(moonset),
    phaseDegrees,
    phaseName,
    illuminationFraction,
    emoji,
  };
}

export function calcPlanetData(
  lat: number,
  lon: number,
  date: Date,
): PlanetData[] {
  const observer = new Observer(lat, lon, 0);
  const planets = [
    Body.Mercury,
    Body.Venus,
    Body.Mars,
    Body.Jupiter,
    Body.Saturn,
  ];

  return planets.map((body) => {
    const rise = SearchRiseSet(body, observer, +1, date, 1);
    const set = SearchRiseSet(body, observer, -1, date, 1);
    return {
      name: body,
      rise: toDateOrNull(rise),
      set: toDateOrNull(set),
    };
  });
}

export function calcNextMoonPhases(date: Date, count = 4): NextMoonPhaseData[] {
  const phases: NextMoonPhaseData[] = [];
  let mq = SearchMoonQuarter(date);

  for (let i = 0; i < count; i++) {
    // mq.quarter is 0-3 guaranteed by library, but TS doesn't know. Fallback for safety.
    const info = PHASE_NAMES[mq.quarter] ??
      PHASE_NAMES[0] ?? { name: "New Moon", emoji: "🌑" };
    phases.push({
      name: info.name,
      date: mq.time.date,
      emoji: info.emoji,
    });
    mq = NextMoonQuarter(mq);
  }

  return phases;
}

export function calcNextSeason(date: Date): SeasonData {
  const year = date.getFullYear();
  const seasons = Seasons(year);

  const upcoming = [
    { name: "March Equinox", date: seasons.mar_equinox.date },
    { name: "June Solstice", date: seasons.jun_solstice.date },
    { name: "September Equinox", date: seasons.sep_equinox.date },
    { name: "December Solstice", date: seasons.dec_solstice.date },
  ]
    .filter((s) => s.date > date)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (upcoming.length > 0) {
    return upcoming[0] as SeasonData;
  }

  // If all seasons this year have passed, look at next year
  const nextSeasons = Seasons(year + 1);
  return {
    name: "March Equinox",
    date: nextSeasons.mar_equinox.date,
  };
}

/* ─── Stargazing quality heuristic ─── */
export function getStargazingQuality(
  moonIllumination: number,
  sunset: Date | null,
  date: Date,
): {
  label: string;
  description: string;
} {
  // Simple heuristic: low moon illumination + nighttime = good stargazing
  const isNight = sunset ? date.getTime() > sunset.getTime() : false;

  if (moonIllumination < 0.25) {
    return {
      label: "Excellent",
      description: isNight
        ? "Dark skies with minimal moonlight"
        : "Dark skies expected tonight",
    };
  }
  if (moonIllumination < 0.5) {
    return {
      label: "Good",
      description: "Moderate moonlight, bright stars visible",
    };
  }
  if (moonIllumination < 0.75) {
    return {
      label: "Fair",
      description: "Bright moonlight may wash out faint stars",
    };
  }
  return {
    label: "Poor",
    description: "Bright moon, only the brightest stars visible",
  };
}
