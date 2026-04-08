export interface SunData {
  sunrise: Date | null;
  sunset: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  nauticalDawn: Date | null;
  nauticalDusk: Date | null;
  astronomicalDawn: Date | null;
  astronomicalDusk: Date | null;
  dayLengthMinutes: number | null;
  goldenHourStart: Date | null;
}

export interface MoonData {
  moonrise: Date | null;
  moonset: Date | null;
  phaseDegrees: number;
  phaseName: string;
  illuminationFraction: number;
  moonAge: number;
  distanceKm: number;
  icon: string;
  iconFallback: string;
}

export interface PlanetData {
  name: string;
  rise: Date | null;
  set: Date | null;
  /** Current altitude (elevation) in degrees — negative = below horizon */
  altitude: number;
  /** Current azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  azimuth: number;
  /** Is the planet currently above the horizon? */
  isAboveHorizon: boolean;
  /** Visual (apparent) magnitude — lower = brighter, negative = very bright */
  magnitude: number;
}

export interface MoonPhaseEvent {
  phaseName: string;
  icon: string;
  iconFallback: string;
  angle: number;
  time: Date;
  daysFromNow: number;
  illuminationPercent: number;
  magnitude: number;
  distanceKm: number;
  angularDiameterArcmin: number;
  isSupermoon: boolean;
  lunarEclipse: "penumbral" | "partial" | "total" | null;
}

export interface FullMoonCycle {
  current: {
    phaseName: string;
    icon: string;
    iconFallback: string;
    exactAngle: number;
    illuminationPercent: number;
    moonAgeDays: number;
    waxing: boolean;
    distanceKm: number;
    angularDiameterArcmin: number;
  };
  upcoming: MoonPhaseEvent[];
  cycleLengthDays: number;
}

export interface DistanceExtremes {
  currentDistanceKm: number;
  distanceTrend: "approaching" | "receding";
  nextPerigee: {
    time: Date;
    distanceKm: number;
    daysFromNow: number;
    isClosest: boolean;
  };
  nextApogee: {
    time: Date;
    distanceKm: number;
    daysFromNow: number;
  };
  averageDistanceKm: number;
}

export interface LunarEclipseInfo {
  next: {
    kind: "penumbral" | "partial" | "total";
    peakTime: Date;
    daysFromNow: number;
    obscurationPercent: number;
    totalDurationMinutes: number;
    contacts: {
      penumbralStart: Date;
      partialStart: Date | null;
      totalStart: Date | null;
      peak: Date;
      totalEnd: Date | null;
      partialEnd: Date | null;
      penumbralEnd: Date;
    };
  };
  nextTotal: {
    peakTime: Date;
    daysFromNow: number;
    totalDurationMinutes: number;
  } | null;
}

export interface SupermoonInfo {
  nextSupermoon: {
    fullMoonTime: Date;
    perigeeTime: Date;
    daysFromNow: number;
    distanceKm: number;
    angularDiameterArcmin: number;
    sizeRatioVsAverage: number;
    illuminationPercent: number;
  } | null;
}

export interface SeasonData {
  name: string;
  date: Date;
}

export interface EclipseEvent {
  kind: "solar" | "lunar";
  type: string; // e.g., "Total", "Partial", "Penumbral", "Annular"
  peak: Date;
  obscuration?: number; // Solar obscuration fraction (0-1)
  isLocal: boolean;
}

export interface NextRiseSetData {
  /** Next sunrise from current moment */
  nextSunrise: Date | null;
  /** Next sunset from current moment */
  nextSunset: Date | null;
  /** Next moonrise from current moment */
  nextMoonrise: Date | null;
  /** Next moonset from current moment */
  nextMoonset: Date | null;
  /** Next astronomical dawn from current moment */
  nextAstronomicalDawn: Date | null;
  /** Most recent sunset (for early morning before sunrise) */
  prevSunset: Date | null;
}

export interface MoonPositionData {
  /** Current altitude in degrees */
  altitude: number;
  /** Current azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  azimuth: number;
  /** Is the moon currently above the horizon? */
  isAboveHorizon: boolean;

  /** Past horizon-crossing event relative to now */
  previousEvent: Date | null;
  /** Future horizon-crossing event relative to now */
  nextEvent: Date | null;

  /** Highest altitude during the current window */
  peakAltitude: number;
  /** Lowest altitude during the current window */
  minAltitude: number;

  /** Sampled altitude points across the window for the curve */
  altitudeCurve?: { fraction: number; altitude: number; timestamp: number }[];
}

export interface AstronomyData {
  sun: SunData;
  sunPosition: SunPositionData;
  moon: MoonData;
  moonPosition: MoonPositionData;
  planets: PlanetData[];
  fullMoonCycle: FullMoonCycle;
  distanceExtremes: DistanceExtremes;
  lunarEclipseInfo: LunarEclipseInfo | null;
  supermoonInfo: SupermoonInfo;
  nextSeason: SeasonData;
  nextRiseSet: NextRiseSetData;
  stargazing: {
    score: number;
    label: string;
    description: string;
    factors: { param: string; impact: "positive" | "negative" | "neutral"; detail: string }[];
  };
  upcomingEclipses: EclipseEvent[];
}

export interface SunPositionData {
  /** Current altitude in degrees (negative = below horizon) */
  altitude: number;
  /** Current azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  azimuth: number;
  /** Is the sun currently above the horizon? */
  isAboveHorizon: boolean;

  /** Past horizon-crossing event relative to now */
  previousEvent: Date | null;
  /** Future horizon-crossing event relative to now */
  nextEvent: Date | null;

  /** Highest altitude during the current window */
  peakAltitude: number;
  /** Lowest altitude during the current window */
  minAltitude: number;

  /** Sampled altitude points across the window for the curve */
  altitudeCurve: { fraction: number; altitude: number; timestamp: number }[];
}
