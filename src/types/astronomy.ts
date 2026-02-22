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
}

export interface SeasonData {
  name: string;
  date: Date;
}

export interface AstronomyData {
  sun: SunData;
  moon: MoonData;
  planets: PlanetData[];
  nextMoonPhases: NextMoonPhaseData[];
  nextSeason: SeasonData;
  stargazing: { label: string; description: string };
}
