import {
  Body,
  Observer,
  SearchRiseSet,
  SearchAltitude,
  MoonPhase,
  Illumination,
  GeoMoon,
  SearchLunarEclipse,
  NextLunarEclipse,
  SearchGlobalSolarEclipse,
  NextGlobalSolarEclipse,
  SearchLocalSolarEclipse,
  EclipseKind,
  Seasons,
  Equator,
  Horizon,
  MakeTime,
  Libration,
  SearchLunarApsis,
  SearchMoonPhase,
} from "astronomy-engine";

import type {
  SunData,
  SunPositionData,
  MoonData,
  MoonPositionData,
  PlanetData,
  SeasonData,
  NextRiseSetData,
  EclipseEvent,
  FullMoonCycle,
  MoonPhaseEvent,
  DistanceExtremes,
  LunarEclipseInfo,
  SupermoonInfo,
} from "@/types/astronomy";

/* ─── Helpers ─── */

function getMoonPhaseName(degrees: number): {
  name: string;
  icon: string;
  iconFallback: string;
} {
  if (degrees < 22.5)
    return { name: "New Moon", icon: "/moon-new.webp", iconFallback: "/moon-new.svg" };
  if (degrees < 67.5)
    return { name: "Waxing Crescent", icon: "/moon-waxing-crescent.webp", iconFallback: "/moon-waxing-crescent.svg" };
  if (degrees < 112.5)
    return { name: "First Quarter", icon: "/moon-first-quarter.webp", iconFallback: "/moon-first-quarter.svg" };
  if (degrees < 157.5)
    return { name: "Waxing Gibbous", icon: "/moon-waxing-gibbous.webp", iconFallback: "/moon-waxing-gibbous.svg" };
  if (degrees < 202.5)
    return { name: "Full Moon", icon: "/moon-full.webp", iconFallback: "/moon-full.svg" };
  if (degrees < 247.5)
    return { name: "Waning Gibbous", icon: "/moon-waning-gibbous.webp", iconFallback: "/moon-waning-gibbous.svg" };
  if (degrees < 292.5)
    return { name: "Third Quarter", icon: "/moon-third-quarter.webp", iconFallback: "/moon-last-quarter.svg" };
  if (degrees < 337.5)
    return { name: "Waning Crescent", icon: "/moon-waning-crescent.webp", iconFallback: "/moon-waning-crescent.svg" };
  return { name: "New Moon", icon: "/moon-new.webp", iconFallback: "/moon-new.svg" };
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
  body: typeof Body.Sun | typeof Body.Moon,
  observer: Observer,
  direction: 1 | -1,
  now: ReturnType<typeof MakeTime>,
  maxDays = 3,
): ReturnType<typeof SearchRiseSet> | null {
  let cursor = MakeTime(new Date(now.date.getTime() - maxDays * MS_PER_DAY));
  let last: ReturnType<typeof SearchRiseSet> | null = null;

  for (let i = 0; i < 10; i++) {
    const evt = SearchRiseSet(body, observer, direction, cursor, maxDays);
    if (!evt || evt.ut >= now.ut) break;
    last = evt;
    cursor = MakeTime(new Date(evt.date.getTime() + MS_PER_MIN));
  }
  return last;
}

/** Search forward from `now` for the next rise (+1) or set (−1). */
export function findNextEvent(
  body: typeof Body.Sun | typeof Body.Moon,
  observer: Observer,
  direction: 1 | -1,
  now: ReturnType<typeof MakeTime>,
  maxDays = 3,
): ReturnType<typeof SearchRiseSet> | null {
  return SearchRiseSet(body, observer, direction, now, maxDays);
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
): SunPositionData {
  const observer = new Observer(lat, lon, 0);

  // Current sun altitude and azimuth
  const equ = Equator(Body.Sun, now, observer, true, true);
  const hor = Horizon(now, observer, equ.ra, equ.dec, "normal");
  const altitude = hor.altitude;
  const azimuth = hor.azimuth;

  const nowAstro = MakeTime(now);

  // 1. Find the 4 bounding events
  const prevRise = findPreviousEvent(Body.Sun, observer, +1, nowAstro);
  const prevSet = findPreviousEvent(Body.Sun, observer, -1, nowAstro);
  const nextRise = findNextEvent(Body.Sun, observer, +1, nowAstro);
  const nextSet = findNextEvent(Body.Sun, observer, -1, nowAstro);

  let isAboveHorizon = false;
  if (prevRise && prevSet) {
    isAboveHorizon = prevRise.ut > prevSet.ut;
  } else if (prevRise && !prevSet) {
    isAboveHorizon = true;
  } else if (!prevRise && prevSet) {
    isAboveHorizon = false;
  } else {
    isAboveHorizon = altitude > 0;
  }

  // 2. Identify the active cycle bounds
  let previousEvent: Date | null = null;
  let nextEvent: Date | null = null;

  if (isAboveHorizon) {
    previousEvent = prevRise ? prevRise.date : null;
    nextEvent = nextSet ? nextSet.date : null;
  } else {
    previousEvent = prevSet ? prevSet.date : null;
    nextEvent = nextRise ? nextRise.date : null;
  }

  // 3. Sample between bounds with padding
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

  const padMs = 60 * 60 * 1000;
  const sampleStartMs = windowStartMs - padMs;
  const sampleSpanMs = windowEndMs + padMs - sampleStartMs;

  const SAMPLES = 60;
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
    const sEqu = Equator(Body.Sun, sDate, observer, true, true);
    const sHor = Horizon(sDate, observer, sEqu.ra, sEqu.dec, "normal");

    altitudeCurve.push({
      fraction,
      altitude: sHor.altitude,
      timestamp: sampleMs,
    });

    // Only track peak/min within the actual event window (not the padding)
    if (sampleMs >= windowStartMs && sampleMs <= windowEndMs) {
      if (sHor.altitude > peakAltitude) peakAltitude = sHor.altitude;
      if (sHor.altitude < minAltitude) minAltitude = sHor.altitude;
    }
  }

  // Ensure exact bounds are considered to catch true min/peak at the edges
  const checkBounds = (timestamp: number) => {
    const sDate = new Date(timestamp);
    const sEqu = Equator(Body.Sun, sDate, observer, true, true);
    const sHor = Horizon(sDate, observer, sEqu.ra, sEqu.dec, "normal");
    if (sHor.altitude > peakAltitude) peakAltitude = sHor.altitude;
    if (sHor.altitude < minAltitude) minAltitude = sHor.altitude;
  };
  checkBounds(windowStartMs);
  checkBounds(windowEndMs);

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

export function calcMoonData(lat: number, lon: number, date: Date): MoonData {
  const observer = new Observer(lat, lon, 0);

  const moonrise = SearchRiseSet(Body.Moon, observer, +1, date, 1);
  const moonset = SearchRiseSet(Body.Moon, observer, -1, date, 1);

  const phaseDegrees = MoonPhase(date);
  const { name: phaseName, icon, iconFallback } = getMoonPhaseName(phaseDegrees);

  const illum = Illumination(Body.Moon, date);
  const illuminationFraction = illum.phase_fraction;

  // Moon age: days into the current lunation (~29.53 day cycle)
  const moonAge = (phaseDegrees / 360) * 29.53;

  // Moon distance from Earth in km
  const moonGeo = GeoMoon(MakeTime(date));
  const distAU = Math.sqrt(moonGeo.x * moonGeo.x + moonGeo.y * moonGeo.y + moonGeo.z * moonGeo.z);
  const distanceKm = Math.round(distAU * 149597870.7);

  return {
    moonrise: toDateOrNull(moonrise),
    moonset: toDateOrNull(moonset),
    phaseDegrees,
    phaseName,
    illuminationFraction,
    moonAge,
    distanceKm,
    icon,
    iconFallback,
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
  const prevRise = findPreviousEvent(Body.Moon, observer, +1, nowAstro);
  const prevSet = findPreviousEvent(Body.Moon, observer, -1, nowAstro);
  const nextRise = findNextEvent(Body.Moon, observer, +1, nowAstro);
  const nextSet = findNextEvent(Body.Moon, observer, -1, nowAstro);

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

    // Only track peak/min within the actual event window (not the padding)
    if (sampleMs >= windowStartMs && sampleMs <= windowEndMs) {
      if (sHor.altitude > peakAltitude) peakAltitude = sHor.altitude;
      if (sHor.altitude < minAltitude) minAltitude = sHor.altitude;
    }
  }

  // Ensure exact bounds are considered to catch true min/peak at the edges
  const checkBounds = (timestamp: number) => {
    const sDate = new Date(timestamp);
    const sEqu = Equator(Body.Moon, sDate, observer, true, true);
    const sHor = Horizon(sDate, observer, sEqu.ra, sEqu.dec, "normal");
    if (sHor.altitude > peakAltitude) peakAltitude = sHor.altitude;
    if (sHor.altitude < minAltitude) minAltitude = sHor.altitude;
  };
  checkBounds(windowStartMs);
  checkBounds(windowEndMs);

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
  now: Date,
): PlanetData[] {
  const observer = new Observer(lat, lon, 0);
  const planets = [
    Body.Mercury,
    Body.Venus,
    Body.Mars,
    Body.Jupiter,
    Body.Saturn,
    Body.Uranus,
    Body.Neptune,
  ];

  return planets.map((body) => {
    const rise = SearchRiseSet(body, observer, +1, date, 1);
    const set = SearchRiseSet(body, observer, -1, date, 1);

    // Current position
    const equ = Equator(body, now, observer, true, true);
    const hor = Horizon(now, observer, equ.ra, equ.dec, "normal");

    // Visual magnitude
    const illum = Illumination(body, now);

    return {
      name: body,
      rise: toDateOrNull(rise),
      set: toDateOrNull(set),
      altitude: hor.altitude,
      azimuth: hor.azimuth,
      isAboveHorizon: hor.altitude > 0,
      magnitude: illum.mag,
    };
  });
}

/** All 8 phase definitions keyed by their order index (0-7). */
const ALL_PHASES: Record<number, { name: string; icon: string; iconFallback: string }> = {
  0: { name: "New Moon", icon: "/moon-new.webp", iconFallback: "/moon-new.svg" },
  1: { name: "Waxing Crescent", icon: "/moon-waxing-crescent.webp", iconFallback: "/moon-waxing-crescent.svg" },
  2: { name: "First Quarter", icon: "/moon-first-quarter.webp", iconFallback: "/moon-first-quarter.svg" },
  3: { name: "Waxing Gibbous", icon: "/moon-waxing-gibbous.webp", iconFallback: "/moon-waxing-gibbous.svg" },
  4: { name: "Full Moon", icon: "/moon-full.webp", iconFallback: "/moon-full.svg" },
  5: { name: "Waning Gibbous", icon: "/moon-waning-gibbous.webp", iconFallback: "/moon-waning-gibbous.svg" },
  6: { name: "Third Quarter", icon: "/moon-third-quarter.webp", iconFallback: "/moon-last-quarter.svg" },
  7: { name: "Waning Crescent", icon: "/moon-waning-crescent.webp", iconFallback: "/moon-waning-crescent.svg" },
};


const AU_TO_KM = 149597870.7;
const SYNODIC_MONTH = 29.53059;
const AVERAGE_ANGULAR_DIAMETER_ARCMIN = 31.07;
const AVERAGE_DISTANCE_KM = 384400;

export function getFullMoonCycle(now: Date): FullMoonCycle {
  // Current exact phase
  const degrees = MoonPhase(now);
  const currentPhaseIndex = Math.floor((degrees + 22.5) / 45) % 8;
  const currentPhaseInfo = ALL_PHASES[currentPhaseIndex]!;
  const moonAgeDays = (degrees / 360) * SYNODIC_MONTH;
  const waxing = degrees < 180;

  const tNow = MakeTime(now);
  const currentGeo = GeoMoon(tNow);
  const currentDistKm = Math.sqrt(currentGeo.x * currentGeo.x + currentGeo.y * currentGeo.y + currentGeo.z * currentGeo.z) * AU_TO_KM;
  const currentLibration = Libration(tNow);
  const currentDiameter = currentLibration.diam_deg * 60;
  
  const illumNow = Illumination(Body.Moon, tNow);

  const current = {
    phaseName: currentPhaseInfo.name,
    icon: currentPhaseInfo.icon,
    iconFallback: currentPhaseInfo.iconFallback,
    exactAngle: degrees,
    illuminationPercent: illumNow.phase_fraction * 100,
    moonAgeDays,
    waxing,
    distanceKm: currentDistKm,
    angularDiameterArcmin: currentDiameter,
  };

  const upcoming: MoonPhaseEvent[] = [];
  let searchCursor = MakeTime(new Date(now.getTime() + 6 * 3600000));

  for (let i = 1; i <= 8; i++) {
    const targetIdx = (currentPhaseIndex + i) % 8;
    const targetAngle = targetIdx * 45;

    const eventTime = SearchMoonPhase(targetAngle, searchCursor, 40)!;
    const dateObj = eventTime.date;
    
    // Extra details
    const illum = Illumination(Body.Moon, eventTime);
    const geo = GeoMoon(eventTime);
    const distanceKm = Math.sqrt(geo.x * geo.x + geo.y * geo.y + geo.z * geo.z) * AU_TO_KM;
    const lib = Libration(eventTime);
    const angularDiam = lib.diam_deg * 60;
    
    const info = ALL_PHASES[targetIdx]!;
    
    // Check if supermoon (if full)
    let isSupermoon = false;
    if (targetAngle === 180) {
       // Supermoon checks around ±2 days
       const apsisSearch = SearchLunarApsis(MakeTime(new Date(eventTime.date.getTime() - 7 * 86400000)));
       let nearestApsis = apsisSearch;
       let minDiff = Infinity;
       let apsisCursor = apsisSearch;
       for (let j = 0; j < 3; j++) {
         if (apsisCursor.kind === 0) { // Perigee
            const diff = Math.abs(apsisCursor.time.date.getTime() - eventTime.date.getTime());
            if (diff < minDiff) {
              minDiff = diff;
              nearestApsis = apsisCursor;
            }
         }
         // @ts-ignore
         apsisCursor = SearchLunarApsis(MakeTime(new Date(apsisCursor.time.date.getTime() + 86400000))); // iterate to next apsis roughly
       }
       if (minDiff <= 2 * 86400000 && nearestApsis.kind === 0) {
         isSupermoon = true;
       }
    }

    // Check lunar eclipse (if full) - simple check to see if an eclipse happens within 24h
    let eclipseType: "penumbral" | "partial" | "total" | null = null;
    if (targetAngle === 180) {
      const eSearch = SearchLunarEclipse(MakeTime(new Date(eventTime.date.getTime() - 86400000)));
      if (eSearch && eSearch.peak && Math.abs(eSearch.peak.date.getTime() - eventTime.date.getTime()) < 86400000) {
        if (eSearch.kind === EclipseKind.Penumbral) eclipseType = "penumbral";
        else if (eSearch.kind === EclipseKind.Partial) eclipseType = "partial";
        else if (eSearch.kind === EclipseKind.Total) eclipseType = "total";
      }
    }

    upcoming.push({
      phaseName: info.name,
      icon: info.icon,
      iconFallback: info.iconFallback,
      angle: targetAngle,
      time: dateObj,
      daysFromNow: (dateObj.getTime() - now.getTime()) / 86400000,
      illuminationPercent: illum.phase_fraction * 100,
      magnitude: illum.mag,
      distanceKm,
      angularDiameterArcmin: angularDiam,
      isSupermoon,
      lunarEclipse: eclipseType,
    });

    searchCursor = MakeTime(new Date(eventTime.date.getTime() + 6 * 3600000));
  }

  return {
    current,
    upcoming,
    cycleLengthDays: upcoming.length > 0 ? upcoming[upcoming.length - 1]!.daysFromNow : SYNODIC_MONTH,
  };
}

export function getNextDistanceExtremes(now: Date): DistanceExtremes {
  const currentGeo = GeoMoon(MakeTime(now));
  const currentDistanceKm = Math.sqrt(currentGeo.x * currentGeo.x + currentGeo.y * currentGeo.y + currentGeo.z * currentGeo.z) * AU_TO_KM;
  const nextGeo = GeoMoon(MakeTime(new Date(now.getTime() + 3600000)));
  const nextDistanceKm = Math.sqrt(nextGeo.x * nextGeo.x + nextGeo.y * nextGeo.y + nextGeo.z * nextGeo.z) * AU_TO_KM;
  const distanceTrend = nextDistanceKm < currentDistanceKm ? "approaching" : "receding";

  const firstApsis = SearchLunarApsis(MakeTime(now));
  // search next one ~14 days later if necessary
  // To avoid weird overlapping, we can just search from firstApsis.time + 1 day
  const secondApsis = SearchLunarApsis(MakeTime(new Date(firstApsis.time.date.getTime() + 86400000)));

  let perigeeApsis = firstApsis.kind === 0 ? firstApsis : secondApsis;
  let apogeeApsis = firstApsis.kind === 1 ? firstApsis : secondApsis;
  
  if (perigeeApsis.kind !== 0) {
    perigeeApsis = SearchLunarApsis(MakeTime(new Date(apogeeApsis.time.date.getTime() + 86400000)));
  }

  // Find min distance over a year
  let yearMinDistKm = Infinity;
  let cycleCursor = MakeTime(now);
  for (let i=0; i<13; i++) {
    const apsis = SearchLunarApsis(cycleCursor);
    if (apsis.kind === 0) {
      const d = apsis.dist_au * AU_TO_KM;
      if (d < yearMinDistKm) yearMinDistKm = d;
    }
    cycleCursor = MakeTime(new Date(apsis.time.date.getTime() + 15 * 86400000)); // jump 15 days
  }
  
  const pDistKm = perigeeApsis.dist_au * AU_TO_KM;
  const pDays = (perigeeApsis.time.date.getTime() - now.getTime()) / 86400000;
  
  const aDistKm = apogeeApsis.dist_au * AU_TO_KM;
  const aDays = (apogeeApsis.time.date.getTime() - now.getTime()) / 86400000;

  return {
    currentDistanceKm,
    distanceTrend,
    nextPerigee: {
      time: perigeeApsis.time.date,
      distanceKm: pDistKm,
      daysFromNow: pDays,
      isClosest: Math.abs(pDistKm - yearMinDistKm) < 1000,
    },
    nextApogee: {
      time: apogeeApsis.time.date,
      distanceKm: aDistKm,
      daysFromNow: aDays,
    },
    averageDistanceKm: AVERAGE_DISTANCE_KM,
  };
}

export function getNextLunarEclipse(now: Date): LunarEclipseInfo {
  let eclipse = SearchLunarEclipse(MakeTime(now))!;
  
  let nextTotal = null;
  let totalCursor = MakeTime(now);
  for (let i = 0; i < 50; i++) {
    const candidate = SearchLunarEclipse(totalCursor)!;
    if (candidate.kind === EclipseKind.Total) {
      nextTotal = {
        peakTime: candidate.peak.date,
        daysFromNow: (candidate.peak.date.getTime() - now.getTime()) / 86400000,
        totalDurationMinutes: candidate.sd_total * 2,
      };
      break;
    }
    totalCursor = MakeTime(new Date(candidate.peak.date.getTime() + 86400000));
  }

  let kind: "penumbral" | "partial" | "total" = "penumbral";
  if (eclipse.kind === EclipseKind.Partial) kind = "partial";
  if (eclipse.kind === EclipseKind.Total) kind = "total";

  const peakTime = eclipse.peak.date;
  const peakMs = peakTime.getTime();

  return {
    next: {
      kind,
      peakTime: peakTime,
      daysFromNow: (peakMs - now.getTime()) / 86400000,
      obscurationPercent: (eclipse.obscuration || 0) * 100,
      totalDurationMinutes: eclipse.sd_penum * 2,
      contacts: {
        penumbralStart: new Date(peakMs - eclipse.sd_penum * 60000),
        partialStart: eclipse.sd_partial ? new Date(peakMs - eclipse.sd_partial * 60000) : null,
        totalStart: eclipse.sd_total ? new Date(peakMs - eclipse.sd_total * 60000) : null,
        peak: peakTime,
        totalEnd: eclipse.sd_total ? new Date(peakMs + eclipse.sd_total * 60000) : null,
        partialEnd: eclipse.sd_partial ? new Date(peakMs + eclipse.sd_partial * 60000) : null,
        penumbralEnd: new Date(peakMs + eclipse.sd_penum * 60000),
      }
    },
    nextTotal
  };
}

export function getNextSupermoon(now: Date): SupermoonInfo {
  let cursor = MakeTime(now);
  
  for (let i = 0; i < 15; i++) {
    const fullMoon = SearchMoonPhase(180, cursor, 40)!;
    const fmTime = fullMoon.date;
    
    let apsisCursor = MakeTime(new Date(fmTime.getTime() - 7 * 86400000));
    let nearestPerigee = null;
    let minDiff = Infinity;
    
    for (let j = 0; j < 3; j++) {
      const apsis = SearchLunarApsis(apsisCursor);
      if (apsis.kind === 0) {
        const diff = Math.abs(apsis.time.date.getTime() - fmTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          nearestPerigee = apsis;
        }
      }
      apsisCursor = MakeTime(new Date(apsis.time.date.getTime() + 15 * 86400000));
    }
    
    if (minDiff <= 2 * 86400000 && nearestPerigee) {
      const lib = Libration(fullMoon);
      const diamArcmin = lib.diam_deg * 60;
      const sizeRatio = diamArcmin / AVERAGE_ANGULAR_DIAMETER_ARCMIN;
      const illum = Illumination(Body.Moon, fullMoon);
      
      return {
        nextSupermoon: {
          fullMoonTime: fmTime,
          perigeeTime: nearestPerigee.time.date,
          daysFromNow: (fmTime.getTime() - now.getTime()) / 86400000,
          distanceKm: nearestPerigee.dist_au * AU_TO_KM,
          angularDiameterArcmin: diamArcmin,
          sizeRatioVsAverage: sizeRatio,
          illuminationPercent: illum.phase_fraction * 100,
        }
      };
    }
    
    cursor = MakeTime(new Date(fmTime.getTime() + 86400000));
  }
  
  return { nextSupermoon: null };
}

export function calcUpcomingEclipses(lat: number, lon: number, now: Date): EclipseEvent[] {
  const observer = new Observer(lat, lon, 0);
  const events: EclipseEvent[] = [];

  // Lunar eclipses (Global eclipses)
  let lunar = SearchLunarEclipse(now);
  for (let i = 0; i < 5; i++) {
    if (lunar && lunar.peak && lunar.peak.date) {
      let typeLabel = "Penumbral";
      if (lunar.kind === EclipseKind.Partial) typeLabel = "Partial";
      if (lunar.kind === EclipseKind.Total) typeLabel = "Total";

      // Lunar eclipse is visible if the moon is at least near the horizon
      const equ = Equator(Body.Moon, lunar.peak.date, observer, true, true);
      const hor = Horizon(lunar.peak.date, observer, equ.ra, equ.dec, "normal");
      const isLocal = hor.altitude >= -2;

      events.push({
        kind: "lunar",
        type: typeLabel,
        peak: lunar.peak.date,
        isLocal,
      });
      lunar = NextLunarEclipse(lunar.peak);
    } else {
      break;
    }
  }

  // Solar eclipses (Global eclipses)
  let solar = SearchGlobalSolarEclipse(now);
  for (let i = 0; i < 5; i++) {
    if (solar && solar.peak && solar.peak.date) {
      let typeLabel = "Partial";
      if (solar.kind === EclipseKind.Annular) typeLabel = "Annular";
      if (solar.kind === EclipseKind.Total) typeLabel = "Total";

      // Verify if visible locally by performing a local search near the global peak
      let isLocal = false;
      const daysBefore = new Date(solar.peak.date.getTime() - 86400000 * 2);
      try {
        const localSolar = SearchLocalSolarEclipse(daysBefore, observer);
        if (
          localSolar &&
          Math.abs(localSolar.peak.time.date.getTime() - solar.peak.date.getTime()) <
            86400000
        ) {
          isLocal = true;
        }
      } catch (e) {
        // Can throw if no local eclipse is found
      }

      events.push({
        kind: "solar",
        type: typeLabel,
        peak: solar.peak.date,
        isLocal,
      });
      solar = NextGlobalSolarEclipse(solar.peak);
    } else {
      break;
    }
  }

  // Sort chronologically and take enough so components can filter independently
  return events
    .filter((e) => e.peak.getTime() > now.getTime())
    .sort((a, b) => a.peak.getTime() - b.peak.getTime())
    .slice(0, 10);
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

/* ─── Stargazing index ─── */

export interface StargazingFactor {
  param: string;
  impact: "positive" | "negative" | "neutral";
  detail: string;
}

export interface StargazingResult {
  score: number;
  label: string;
  description: string;
  factors: StargazingFactor[];
}

export interface StargazingParams {
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverMid: number;
  cloudCoverHigh: number;
  humidity: number;
  pressure: number;
  wind: number;
  visibility: number;
  precipProb: number;
  temperature: number;
  dewPoint: number;
  isDay: boolean;
  moonIllumination: number;
}

function getStargazingLabel(score: number): { label: string; description: string } {
  if (score >= 80) return { label: "Excellent", description: "Crystal clear, perfect conditions" };
  if (score >= 60) return { label: "Good", description: "Most stars visible, minor interference" };
  if (score >= 40) return { label: "Fair", description: "Bright stars visible, faint objects difficult" };
  if (score >= 20) return { label: "Poor", description: "Heavy cloud or moisture, limited visibility" };
  return { label: "Very Poor", description: "Overcast or daytime, not suitable" };
}

export function computeStargazingIndex(params: StargazingParams): StargazingResult {
  const factors: StargazingFactor[] = [];
  let score = 100;

  // ── Day/night gate (heaviest weight) ──
  if (params.isDay) {
    return {
      score: 0,
      label: "Daytime",
      description: "Sun is still up — stargazing not possible",
      factors: [{ param: "Daylight", impact: "negative", detail: "Sun above horizon" }],
    };
  }

  // ── Weighted cloud penalty (40% weight) ──
  const cloudPenalty =
    (params.cloudCoverLow * 0.50 +
      params.cloudCoverMid * 0.30 +
      params.cloudCoverHigh * 0.20) *
    0.40;
  score -= cloudPenalty;

  if (params.cloudCover <= 15) {
    factors.push({ param: "Cloud", impact: "positive", detail: "Clear skies" });
  } else if (params.cloudCover <= 50) {
    factors.push({ param: "Cloud", impact: "neutral", detail: `${params.cloudCover}% coverage` });
  } else {
    factors.push({ param: "Cloud", impact: "negative", detail: `${params.cloudCover}% cloud cover` });
  }

  // ── Moon illumination (#2 factor) ──
  if (params.moonIllumination > 0.8) {
    score -= 20;
    factors.push({ param: "Moon", impact: "negative", detail: "Bright moon washing out stars" });
  } else if (params.moonIllumination > 0.5) {
    score -= 12;
    factors.push({ param: "Moon", impact: "negative", detail: "Moderate moonlight" });
  } else if (params.moonIllumination > 0.25) {
    score -= 5;
    factors.push({ param: "Moon", impact: "neutral", detail: "Quarter moon" });
  } else {
    factors.push({ param: "Moon", impact: "positive", detail: "Dark sky, minimal moonlight" });
  }

  // ── Humidity penalty ──
  if (params.humidity > 80) {
    const penalty = (params.humidity - 80) * 0.5;
    score -= penalty;
    factors.push({ param: "Humidity", impact: "negative", detail: `${params.humidity}% — haze likely` });
  }

  // ── Pressure bonus / penalty ──
  if (params.pressure >= 1020) {
    score += 5;
    factors.push({ param: "Pressure", impact: "positive", detail: "High pressure, stable air" });
  } else if (params.pressure < 1005) {
    score -= 10;
    factors.push({ param: "Pressure", impact: "negative", detail: "Low pressure, unstable air" });
  }

  // ── Wind penalty ──
  if (params.wind > 25) {
    const penalty = (params.wind - 25) * 0.3;
    score -= penalty;
    factors.push({ param: "Wind", impact: "negative", detail: `${Math.round(params.wind)} km/h — turbulence` });
  }

  // ── Visibility bonus / penalty ──
  if (params.visibility >= 30000) {
    score += 5;
    factors.push({ param: "Visibility", impact: "positive", detail: "Excellent visibility" });
  } else if (params.visibility < 10000) {
    score -= 15;
    factors.push({ param: "Visibility", impact: "negative", detail: "Low visibility" });
  }

  // ── Precipitation kill switch ──
  if (params.precipProb > 50) {
    const penalty = params.precipProb * 0.3;
    score -= penalty;
    factors.push({ param: "Rain", impact: "negative", detail: `${params.precipProb}% chance of precipitation` });
  }

  // ── Dew point spread ──
  const dewSpread = params.temperature - params.dewPoint;
  if (dewSpread < 3) {
    score -= 15;
    factors.push({ param: "Dew", impact: "negative", detail: "Dew/fog very likely" });
  } else if (dewSpread < 5) {
    score -= 8;
    factors.push({ param: "Dew", impact: "negative", detail: "Dew possible" });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const { label, description } = getStargazingLabel(score);

  return { score, label, description, factors };
}

/** Lightweight backward-compatible wrapper (used by useAstronomy) */
export function getStargazingQuality(
  moonIllumination: number,
  sunset: Date | null,
  date: Date,
  cloudCover?: number | null,
): StargazingResult {
  const isDay = sunset ? date.getTime() < sunset.getTime() : true;
  const cc = cloudCover ?? 50;
  const result = computeStargazingIndex({
    cloudCover: cc,
    cloudCoverLow: cc * 0.5,
    cloudCoverMid: cc * 0.3,
    cloudCoverHigh: cc * 0.2,
    humidity: 50,
    pressure: 1013,
    wind: 10,
    visibility: 20000,
    precipProb: 0,
    temperature: 20,
    dewPoint: 10,
    isDay,
    moonIllumination,
  });
  return result;
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

  // Next Astronomical Dawn (for true night duration)
  const nextAstronomicalDawn = SearchAltitude(Body.Sun, observer, +1, now, 1, -18);

  // Previous sunset: search forward from 24h ago — finds the most recent
  // sunset that already occurred (needed for early morning display)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const prevSunset = SearchRiseSet(Body.Sun, observer, -1, yesterday, 1);

  return {
    nextSunrise: toDateOrNull(nextSunrise),
    nextSunset: toDateOrNull(nextSunset),
    nextMoonrise: toDateOrNull(nextMoonrise),
    nextMoonset: toDateOrNull(nextMoonset),
    nextAstronomicalDawn: toDateOrNull(nextAstronomicalDawn),
    prevSunset: toDateOrNull(prevSunset),
  };
}
