export interface PollutantResult {
  label: string;
  dataKey: string;
  concentration: number;
  unit: string;
  avgType: string;
  validHours: number;
  totalHours: number;
  subIndex: number;
  category: string;
}

export interface NAQIResult {
  aqi: number;
  category: string;
  color: string;
  prominentPollutant: string;
  prominentBpKey: string;
  europeanAqi: number | null;
  usAqi: number | null;
  period: { from: string; to: string };
  currentTime: string;
  matchStrategy: string;
  dataRange: { from: string; to: string };
  totalDataHours: number;
  validPollutantCount: number;
  skippedPollutants: Record<string, string>;
  pollutants: Record<string, PollutantResult>;
}

export interface AirQualityHourlyData {
  latitude: number;
  longitude: number;
  generationtimeMs: number;
  utcOffsetSeconds: number;
  timezone: string;
  timezoneAbbreviation: string;
  elevation: number;
  hourlyUnits: Record<string, string>;
  hourly: {
    time: string[];
    pm10: (number | null)[];
    pm25: (number | null)[];
    nitrogenDioxide: (number | null)[];
    sulphurDioxide: (number | null)[];
    ammonia: (number | null)[];
    carbonMonoxide: (number | null)[];
    ozone: (number | null)[];
    europeanAqi: (number | null)[];
    usAqi: (number | null)[];
    [key: string]: (number | null)[] | string[];
  };
}
