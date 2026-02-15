import { z } from "zod";

export const CurrentWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number(),
  utcOffsetSeconds: z.number(),
  timezone: z.string(),
  timezoneAbbreviation: z.string(),
  elevation: z.number(),
  currentUnits: z.object({
    time: z.string(),
    interval: z.string(),
    temperature2M: z.string(),
    relativeHumidity2M: z.string(),
    apparentTemperature: z.string(),
    isDay: z.string(),
    weatherCode: z.string(),
    windSpeed10M: z.string(),
  }),
  current: z.object({
    time: z.string(),
    interval: z.number(),
    temperature2M: z.number(),
    relativeHumidity2M: z.number(),
    apparentTemperature: z.number(),
    isDay: z.number(),
    weatherCode: z.number(),
    windSpeed10M: z.number(),
  }),
});

export type CurrentWeatherType = z.infer<typeof CurrentWeatherSchema>;

export const TodayWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number(),
  utcOffsetSeconds: z.number(),
  timezone: z.string(),
  timezoneAbbreviation: z.string(),
  elevation: z.number(),
  dailyUnits: z.object({
    time: z.string(),
    temperature2mMax: z.string(),
    temperature2mMin: z.string(),
    sunrise: z.string(),
    sunset: z.string(),
    uvIndexMax: z.string(),
    precipitationSum: z.string(),
    precipitationProbabilityMax: z.string(),
    windDirection10mDominant: z.string(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature2mMax: z.array(z.number()),
    temperature2mMin: z.array(z.number()),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
    uvIndexMax: z.array(z.number()),
    precipitationSum: z.array(z.number()),
    precipitationProbabilityMax: z.array(z.number()),
    windDirection10mDominant: z.array(z.number()),
  }),
});

export type TodayWeatherType = z.infer<typeof TodayWeatherSchema>;

export const WeeklyForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number(),
  utcOffsetSeconds: z.number(),
  timezone: z.string(),
  timezoneAbbreviation: z.string(),
  elevation: z.number(),
  dailyUnits: z.object({
    time: z.string(),
    weatherCode: z.string(),
    temperature2mMax: z.string(),
    temperature2mMin: z.string(),
    precipitationProbabilityMax: z.string(),
    precipitationSum: z.string(),
    windSpeed10mMax: z.string(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weatherCode: z.array(z.number()),
    temperature2mMax: z.array(z.number()),
    temperature2mMin: z.array(z.number()),
    precipitationProbabilityMax: z.array(z.number()),
    precipitationSum: z.array(z.number()),
    windSpeed10mMax: z.array(z.number()),
  }),
});

export type WeeklyForecastType = z.infer<typeof WeeklyForecastSchema>;

export const AirQualitySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number(),
  utcOffsetSeconds: z.number(),
  timezone: z.string(),
  timezoneAbbreviation: z.string(),
  elevation: z.number(),
  currentUnits: z.object({
    time: z.string(),
    interval: z.string(),
    usAqi: z.string(),
    pm10: z.string(),
    pm25: z.string(),
    carbonMonoxide: z.string(),
    nitrogenDioxide: z.string(),
    sulphurDioxide: z.string(),
    ozone: z.string(),
  }),
  current: z.object({
    time: z.string(),
    interval: z.number(),
    usAqi: z.number(),
    pm10: z.number(),
    pm25: z.number(),
    carbonMonoxide: z.number(),
    nitrogenDioxide: z.number(),
    sulphurDioxide: z.number(),
    ozone: z.number(),
  }),
});

export type AirQualityType = z.infer<typeof AirQualitySchema>;

export const HourlyForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number(),
  utcOffsetSeconds: z.number(),
  timezone: z.string(),
  timezoneAbbreviation: z.string(),
  elevation: z.number(),
  minutely15Units: z.object({
    time: z.string(),
    temperature2M: z.string(),
    weatherCode: z.string(),
    relativeHumidity2M: z.string(),
    isDay: z.string(),
  }),
  minutely15: z.object({
    time: z.array(z.string()),
    temperature2M: z.array(z.number()),
    weatherCode: z.array(z.number()),
    relativeHumidity2M: z.array(z.number()),
    isDay: z.array(z.number()),
  }),
  dailyUnits: z.object({
    time: z.string(),
    sunrise: z.string(),
    sunset: z.string(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
  }),
});

export type HourlyForecastType = z.infer<typeof HourlyForecastSchema>;
