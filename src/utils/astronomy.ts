import {
  Body,
  Observer,
  SearchRiseSet,
  SearchAltitude,
  MoonPhase,
  Illumination,
  SearchMoonQuarter,
  NextMoonQuarter,
  SearchLunarEclipse,
  NextLunarEclipse,
  SearchGlobalSolarEclipse,
  NextGlobalSolarEclipse,
  EclipseKind,
  Seasons,
  Equator,
  Horizon,
  MakeTime,
} from "astronomy-engine";

import type {
  SunData,
  SunPositionData,
  MoonData,
  MoonPositionData,
  PlanetData,
  NextMoonPhaseData,
  SeasonData,
  NextRiseSetData,
  EclipseEvent,
} from "@/types/astronomy";

/* ─── Helpers ─── */
const PHASE_NAMES: Record<
  number,
  { name: string; emoji: string; icon: string }
> = {
  0: { name: "New Moon", emoji: "🌑", icon: "/moon-new.svg" },
  1: { name: "First Quarter", emoji: "🌓", icon: "/moon-first-quarter.svg" },
  2: { name: "Full Moon", emoji: "🌕", icon: "/moon-full.svg" },
  3: { name: "Third Quarter", emoji: "🌗", icon: "/moon-last-quarter.svg" },
};

function getMoonPhaseName(degrees: number): {
  name: string;
  emoji: string;
  icon: string;
} {
  if (degrees < 22.5)
    return { name: "New Moon", emoji: "🌑", icon: "/moon-new.svg" };
  if (degrees < 67.5)
    return {
      name: "Waxing Crescent",
      emoji: "🌒",
      icon: "/moon-waxing-crescent.svg",
    };
  if (degrees < 112.5)
    return {
      name: "First Quarter",
      emoji: "🌓",
      icon: "/moon-first-quarter.svg",
    };
  if (degrees < 157.5)
    return {
      name: "Waxing Gibbous",
      emoji: "🌔",
      icon: "/moon-waxing-gibbous.svg",
    };
  if (degrees < 202.5)
    return { name: "Full Moon", emoji: "🌕", icon: "/moon-full.svg" };
  if (degrees < 247.5)
    return {
      name: "Waning Gibbous",
      emoji: "🌖",
      icon: "/moon-waning-gibbous.svg",
    };
  if (degrees < 292.5)
    return {
      name: "Third Quarter",
      emoji: "🌗",
      icon: "/moon-last-quarter.svg",
    };
  if (degrees < 337.5)
    return {
      name: "Waning Crescent",
      emoji: "🌘",
      icon: "/moon-waning-crescent.svg",
    };
  return { name: "New Moon", emoji: "🌑", icon: "/moon-new.svg" };
}

function toDateOrNull(
  astroTime: ReturnType<typeof SearchRiseSet>,
): Date | null {
  return astroTime ? astroTime.date : null;
}

const MS_PER_DAY = 86_400_000;
const MS_PER_MIN = 60_000;

/**
 * Search backward from `now` for the most recent rise (+1) or set (−1).
 */
export function findPreviousEvent(
  observer: Observer,
  direction: 1 | -1,
  now: ReturnType<typeof MakeTime>,
  maxDays = 3,
): ReturnType<typeof SearchRiseSet> | null {
  let cursor = MakeTime(new Date(now.date.getTime() - maxDays * MS_PER_DAY));
  let last: ReturnType<typeof SearchRiseSet> | null = null;

  for (let i = 0; i < 10; i++) {
    const evt = SearchRiseSet(Body.Moon, observer, direction, cursor, maxDays);
    if (!evt || evt.ut >= now.ut) break;
    last = evt;
    cursor = MakeTime(new Date(evt.date.getTime() + MS_PER_MIN));
  }
  return last;
}

/** Search forward from `now` for the next rise (+1) or set (−1). */
export function findNextEvent(
  observer: Observer,
  direction: 1 | -1,
  now: ReturnType<typeof MakeTime>,
  maxDays = 3,
): ReturnType<typeof SearchRiseSet> | null {
  return SearchRiseSet(Body.Moon, observer, direction, now, maxDays);
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

export function calcSunPosition(
  lat: number,
  lon: number,
  now: Date,
  sunrise: Date | null,
  sunset: Date | null,
): SunPositionData {
  const observer = new Observer(lat, lon, 0);

  // Current sun altitude and azimuth
  const equ = Equator(Body.Sun, now, observer, true, true);
  const hor = Horizon(now, observer, equ.ra, equ.dec, "normal");
  const altitude = hor.altitude;
  const azimuth = hor.azimuth;
  const isAboveHorizon = altitude > 0;

  // Arc fraction: 0 at sunrise, 0.5 at noon, 1 at sunset
  let arcFraction: number | null = null;
  if (sunrise && sunset) {
    const riseMs = sunrise.getTime();
    const setMs = sunset.getTime();
    const nowMs = now.getTime();
    const daySpan = setMs - riseMs;
    if (daySpan > 0) {
      arcFraction = Math.max(0, Math.min(1, (nowMs - riseMs) / daySpan));
    }
  }

  // Noon altitude
  let noonAltitude = 0;
  if (sunrise && sunset) {
    const noonMs = (sunrise.getTime() + sunset.getTime()) / 2;
    const noonDate = new Date(noonMs);
    const noonEqu = Equator(Body.Sun, noonDate, observer, true, true);
    const noonHor = Horizon(
      noonDate,
      observer,
      noonEqu.ra,
      noonEqu.dec,
      "normal",
    );
    noonAltitude = noonHor.altitude;
  }

  // ── Altitude curve: sample real altitudes across the day ──
  // Window: 2h before sunrise → 2h after sunset (or ±14h from noon if no rise/set)
  const SAMPLES = 60;
  const PAD_MS = 3 * 60 * 60 * 1000; // 3 hours padding for gentler curve

  let windowStart: number;
  let windowEnd: number;

  if (sunrise && sunset) {
    windowStart = sunrise.getTime() - PAD_MS;
    windowEnd = sunset.getTime() + PAD_MS;
  } else {
    // Fallback: 14h window centered on now
    windowStart = now.getTime() - 14 * 60 * 60 * 1000;
    windowEnd = now.getTime() + 14 * 60 * 60 * 1000;
  }

  const windowSpan = windowEnd - windowStart;
  const altitudeCurve: {
    fraction: number;
    altitude: number;
    timestamp: number;
  }[] = [];
  let minAltitude = altitude;

  for (let i = 0; i <= SAMPLES; i++) {
    const frac = i / SAMPLES;
    const sampleMs = windowStart + frac * windowSpan;
    const sampleDate = new Date(sampleMs);
    const sEqu = Equator(Body.Sun, sampleDate, observer, true, true);
    const sHor = Horizon(sampleDate, observer, sEqu.ra, sEqu.dec, "normal");
    altitudeCurve.push({
      fraction: frac,
      altitude: sHor.altitude,
      timestamp: sampleMs,
    });
    if (sHor.altitude < minAltitude) minAltitude = sHor.altitude;
    if (sHor.altitude > noonAltitude) noonAltitude = sHor.altitude;
  }

  // dayFraction: where "now" falls within the window (0→1)
  const nowMs = now.getTime();
  const dayFraction = Math.max(
    0,
    Math.min(1, (nowMs - windowStart) / windowSpan),
  );

  return {
    altitude,
    azimuth,
    arcFraction,
    noonAltitude,
    isAboveHorizon,
    altitudeCurve,
    minAltitude,
    dayFraction,
  };
}

export function calcMoonData(lat: number, lon: number, date: Date): MoonData {
  const observer = new Observer(lat, lon, 0);

  const moonrise = SearchRiseSet(Body.Moon, observer, +1, date, 1);
  const moonset = SearchRiseSet(Body.Moon, observer, -1, date, 1);

  const phaseDegrees = MoonPhase(date);
  const { name: phaseName, emoji, icon } = getMoonPhaseName(phaseDegrees);

  const illum = Illumination(Body.Moon, date);
  const illuminationFraction = illum.phase_fraction;

  return {
    moonrise: toDateOrNull(moonrise),
    moonset: toDateOrNull(moonset),
    phaseDegrees,
    phaseName,
    illuminationFraction,
    emoji,
    icon,
  };
}

export function calcMoonPosition(
  lat: number,
  lon: number,
  now: Date,
): MoonPositionData {
  const observer = new Observer(lat, lon, 0);
  const equ = Equator(Body.Moon, now, observer, true, true);
  const hor = Horizon(now, observer, equ.ra, equ.dec, "normal");
  const altitude = hor.altitude;
  const azimuth = hor.azimuth;

  const nowAstro = MakeTime(now);

  // 1. Find the 4 bounding events (pure physical state)
  const prevRise = findPreviousEvent(observer, +1, nowAstro);
  const prevSet = findPreviousEvent(observer, -1, nowAstro);
  const nextRise = findNextEvent(observer, +1, nowAstro);
  const nextSet = findNextEvent(observer, -1, nowAstro);

  let isAboveHorizon = false;
  if (prevRise && prevSet) {
    isAboveHorizon = prevRise.ut > prevSet.ut;
  } else if (prevRise && !prevSet) {
    isAboveHorizon = true;
  } else if (!prevRise && prevSet) {
    isAboveHorizon = false;
  } else {
    // Polar edge: moon is continuously up/down for days fallback to raw altitude
    isAboveHorizon = altitude > 0;
  }

  // 2. Identify the active cycle bounds
  let previousEvent: Date | null = null;
  let nextEvent: Date | null = null;

  if (isAboveHorizon) {
    // UP STATE = [prevRise ... nextSet]
    previousEvent = prevRise ? prevRise.date : null;
    nextEvent = nextSet ? nextSet.date : null;
  } else {
    // DOWN STATE = [prevSet ... nextRise]
    previousEvent = prevSet ? prevSet.date : null;
    nextEvent = nextRise ? nextRise.date : null;
  }

  // 3. Sample exactly between these bounds to find peaks and build the curve
  // If we are missing bounds (polar continuous), build a massive 48 hour mock window
  let windowStartMs = now.getTime() - 24 * 60 * 60 * 1000;
  let windowEndMs = now.getTime() + 24 * 60 * 60 * 1000;

  if (previousEvent && nextEvent) {
    windowStartMs = previousEvent.getTime();
    windowEndMs = nextEvent.getTime();
  } else if (previousEvent) {
    windowStartMs = previousEvent.getTime();
  } else if (nextEvent) {
    windowEndMs = nextEvent.getTime();
  }

  // Pad the window 1 hour in both directions so Recharts renders the crossing clearly
  const padMs = 60 * 60 * 1000;
  let sampleStartMs = windowStartMs - padMs;
  let sampleSpanMs = windowEndMs + padMs - sampleStartMs;

  const SAMPLES = 40;
  let peakAltitude = altitude;
  let minAltitude = altitude;
  const altitudeCurve: {
    fraction: number;
    altitude: number;
    timestamp: number;
  }[] = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const fraction = i / SAMPLES;
    const sampleMs = sampleStartMs + fraction * sampleSpanMs;
    const sDate = new Date(sampleMs);
    const sEqu = Equator(Body.Moon, sDate, observer, true, true);
    const sHor = Horizon(sDate, observer, sEqu.ra, sEqu.dec, "normal");

    altitudeCurve.push({
      fraction,
      altitude: sHor.altitude,
      timestamp: sampleMs,
    });

    if (sHor.altitude > peakAltitude) peakAltitude = sHor.altitude;
    if (sHor.altitude < minAltitude) minAltitude = sHor.altitude;
  }

  return {
    altitude,
    azimuth,
    isAboveHorizon,
    previousEvent,
    nextEvent,
    peakAltitude,
    minAltitude,
    altitudeCurve,
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
      PHASE_NAMES[0] ?? {
        name: "New Moon",
        emoji: "🌑",
        icon: "/moon-new.svg",
      };
    phases.push({
      name: info.name,
      date: mq.time.date,
      emoji: info.emoji,
      icon: info.icon,
    });
    mq = NextMoonQuarter(mq);
  }

  return phases;
}

export function calcUpcomingEclipses(now: Date): EclipseEvent[] {
  const events: EclipseEvent[] = [];

  // Lunar eclipses (visible globally where moon is up)
  let lunar = SearchLunarEclipse(now);
  for (let i = 0; i < 3; i++) {
    if (lunar && lunar.peak && lunar.peak.date) {
      let typeLabel = "Penumbral";
      if (lunar.kind === EclipseKind.Partial) typeLabel = "Partial";
      if (lunar.kind === EclipseKind.Total) typeLabel = "Total";

      events.push({
        kind: "lunar",
        type: typeLabel,
        peak: lunar.peak.date,
      });
      lunar = NextLunarEclipse(lunar.peak);
    } else {
      break;
    }
  }

  // Solar eclipses (Global eclipses)
  let solar = SearchGlobalSolarEclipse(now);
  for (let i = 0; i < 3; i++) {
    if (solar && solar.peak && solar.peak.date) {
      let typeLabel = "Partial";
      if (solar.kind === EclipseKind.Annular) typeLabel = "Annular";
      if (solar.kind === EclipseKind.Total) typeLabel = "Total";

      events.push({
        kind: "solar",
        type: typeLabel,
        peak: solar.peak.date,
      });
      solar = NextGlobalSolarEclipse(solar.peak);
    } else {
      break;
    }
  }

  // Sort chronologically and take the next 3 total eclipses of any kind
  return events
    .filter((e) => e.peak.getTime() > now.getTime())
    .sort((a, b) => a.peak.getTime() - b.peak.getTime())
    .slice(0, 3);
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

export function calcNextRiseSet(
  lat: number,
  lon: number,
  now: Date,
): NextRiseSetData {
  const observer = new Observer(lat, lon, 0);

  // Next events: search forward from `now`
  const nextSunrise = SearchRiseSet(Body.Sun, observer, +1, now, 1);
  const nextSunset = SearchRiseSet(Body.Sun, observer, -1, now, 1);
  const nextMoonrise = SearchRiseSet(Body.Moon, observer, +1, now, 1);
  const nextMoonset = SearchRiseSet(Body.Moon, observer, -1, now, 1);

  // Previous sunset: search forward from 24h ago — finds the most recent
  // sunset that already occurred (needed for early morning display)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const prevSunset = SearchRiseSet(Body.Sun, observer, -1, yesterday, 1);

  return {
    nextSunrise: toDateOrNull(nextSunrise),
    nextSunset: toDateOrNull(nextSunset),
    nextMoonrise: toDateOrNull(nextMoonrise),
    nextMoonset: toDateOrNull(nextMoonset),
    prevSunset: toDateOrNull(prevSunset),
  };
}
