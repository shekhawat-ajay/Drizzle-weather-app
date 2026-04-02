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

export interface NextMoonPhaseData {
  name: string;
  date: Date;
  icon: string;
  iconFallback: string;
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
  nextMoonPhases: NextMoonPhaseData[];
  nextSeason: SeasonData;
  nextRiseSet: NextRiseSetData;
  stargazing: { label: string; description: string };
  upcomingEclipses: EclipseEvent[];
}

export interface SunPositionData {
  /** Current altitude in degrees (negative = below horizon) */
  altitude: number;
  /** Current azimuth in degrees (0 = North, 90 = East, 180 = South, 270 = West) */
  azimuth: number;
  /** 0 = sunrise, 0.5 = solar noon, 1 = sunset. null if no rise/set today */
  arcFraction: number | null;
  /** Maximum altitude the sun reaches today (solar noon) in degrees */
  noonAltitude: number;
  /** Is the sun currently above the horizon? */
  isAboveHorizon: boolean;
  /** Sampled altitude points across the day for the curve */
  altitudeCurve: { fraction: number; altitude: number; timestamp: number }[];
  /** Lowest altitude in the curve (most negative) */
  minAltitude: number;
  /** Fraction through the curve window where sun currently is (0→1) */
  dayFraction: number;
}
