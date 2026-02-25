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
  emoji: string;
  icon: string;
}

export interface PlanetData {
  name: string;
  rise: Date | null;
  set: Date | null;
}

export interface NextMoonPhaseData {
  name: string;
  date: Date;
  emoji: string;
  icon: string;
}

export interface SeasonData {
  name: string;
  date: Date;
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
  altitude: number;
  isAboveHorizon: boolean;
  dayFraction: number;
  peakAltitude: number;
  minAltitude: number;
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
}

export interface SunPositionData {
  /** Current altitude in degrees (negative = below horizon) */
  altitude: number;
  /** 0 = sunrise, 0.5 = solar noon, 1 = sunset. null if no rise/set today */
  arcFraction: number | null;
  /** Maximum altitude the sun reaches today (solar noon) in degrees */
  noonAltitude: number;
  /** Is the sun currently above the horizon? */
  isAboveHorizon: boolean;
  /** Sampled altitude points across the day for the curve */
  altitudeCurve: { fraction: number; altitude: number }[];
  /** Lowest altitude in the curve (most negative) */
  minAltitude: number;
  /** Fraction through the curve window where sun currently is (0→1) */
  dayFraction: number;
}
