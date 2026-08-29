import { z } from "zod";

export const CurrentWeatherSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number().optional(),
  utcOffsetSeconds: z.number().optional(),
  timezone: z.string(),
  timezoneAbbreviation: z.string().optional(),
  elevation: z.number().optional(),
  currentUnits: z.object({
    time: z.string(),
    interval: z.string(),
    temperature2M: z.string(),
    relativeHumidity2M: z.string(),
    apparentTemperature: z.string(),
    isDay: z.string(),
    weatherCode: z.string(),
    windSpeed10M: z.string(),
    windDirection10M: z.string(),
    uvIndex: z.string(),
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
    windDirection10M: z.number(),
    uvIndex: z.number(),
  }).passthrough(),
}).passthrough();

export type CurrentWeatherType = z.infer<typeof CurrentWeatherSchema>;

export const DailyForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number().optional(),
  utcOffsetSeconds: z.number().optional(),
  timezone: z.string(),
  timezoneAbbreviation: z.string().optional(),
  elevation: z.number().optional(),
  dailyUnits: z.object({
    time: z.string(),
    weatherCode: z.string(),
    apparentTemperatureMax: z.string(),
    apparentTemperatureMin: z.string(),
    sunrise: z.string(),
    sunset: z.string(),
    uvIndexMax: z.string(),
    precipitationSum: z.string(),
    precipitationProbabilityMax: z.string(),
    windDirection10mDominant: z.string(),
    windSpeed10mMax: z.string(),
    sunshineDuration: z.string(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weatherCode: z.array(z.number()),
    apparentTemperatureMax: z.array(z.number()),
    apparentTemperatureMin: z.array(z.number()),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
    uvIndexMax: z.array(z.number()),
    precipitationSum: z.array(z.number()),
    precipitationProbabilityMax: z.array(z.number()),
    windDirection10mDominant: z.array(z.number()),
    windSpeed10mMax: z.array(z.number()),
    sunshineDuration: z.array(z.number()),
  }).passthrough(),
}).passthrough();

export type DailyForecastType = z.infer<typeof DailyForecastSchema>;

export const AirQualitySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number().optional(),
  utcOffsetSeconds: z.number().optional(),
  timezone: z.string(),
  timezoneAbbreviation: z.string().optional(),
  elevation: z.number().optional(),
  hourlyUnits: z.object({
    time: z.string(),
    pm10: z.string(),
    pm25: z.string(),
    nitrogenDioxide: z.string(),
    sulphurDioxide: z.string(),
    ammonia: z.string(),
    carbonMonoxide: z.string(),
    ozone: z.string(),
    europeanAqi: z.string(),
    usAqi: z.string(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    pm10: z.array(z.number().nullable()),
    pm25: z.array(z.number().nullable()),
    nitrogenDioxide: z.array(z.number().nullable()),
    sulphurDioxide: z.array(z.number().nullable()),
    ammonia: z.array(z.number().nullable()),
    carbonMonoxide: z.array(z.number().nullable()),
    ozone: z.array(z.number().nullable()),
    europeanAqi: z.array(z.number().nullable()),
    usAqi: z.array(z.number().nullable()),
  }).passthrough(),
}).passthrough();

export type AirQualityType = z.infer<typeof AirQualitySchema>;

export const HourlyForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number().optional(),
  utcOffsetSeconds: z.number().optional(),
  timezone: z.string(),
  timezoneAbbreviation: z.string().optional(),
  elevation: z.number().optional(),
  minutely15Units: z.object({
    time: z.string(),
    temperature2M: z.string(),
    weatherCode: z.string(),
    precipitationProbability: z.string(),
    visibility: z.string(),
    isDay: z.string(),
  }),
  minutely15: z.object({
    time: z.array(z.string()),
    temperature2M: z.array(z.number()),
    weatherCode: z.array(z.number()),
    precipitationProbability: z.array(z.number()),
    visibility: z.array(z.number()),
    isDay: z.array(z.number()),
  }),
  hourlyUnits: z.object({
    time: z.string(),
    cloudCover: z.string(),
    cloudCoverLow: z.string(),
    cloudCoverMid: z.string(),
    cloudCoverHigh: z.string(),
    isDay: z.string(),
    relativeHumidity2M: z.string(),
    dewPoint2M: z.string(),
    surfacePressure: z.string(),
    windSpeed10M: z.string(),
    temperature2M: z.string(),
  }).optional(),
  hourly: z.object({
    time: z.array(z.string()),
    cloudCover: z.array(z.number()),
    cloudCoverLow: z.array(z.number()),
    cloudCoverMid: z.array(z.number()),
    cloudCoverHigh: z.array(z.number()),
    isDay: z.array(z.number()),
    relativeHumidity2M: z.array(z.number()),
    dewPoint2M: z.array(z.number()),
    surfacePressure: z.array(z.number()),
    windSpeed10M: z.array(z.number()),
    temperature2M: z.array(z.number()),
  }).passthrough().optional(),
}).passthrough();

export type HourlyForecastType = z.infer<typeof HourlyForecastSchema>;

export const CombinedForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtimeMs: z.number().optional(),
  utcOffsetSeconds: z.number().optional(),
  timezone: z.string(),
  timezoneAbbreviation: z.string().optional(),
  elevation: z.number().optional(),
  currentUnits: z
    .object({
      time: z.string(),
      interval: z.string(),
      temperature2M: z.string(),
      relativeHumidity2M: z.string(),
      apparentTemperature: z.string(),
      isDay: z.string(),
      weatherCode: z.string(),
      windSpeed10M: z.string(),
      windDirection10M: z.string(),
      uvIndex: z.string(),
    })
    .optional(),
  current: z
    .object({
      time: z.string(),
      interval: z.number(),
      temperature2M: z.number(),
      relativeHumidity2M: z.number(),
      apparentTemperature: z.number(),
      isDay: z.number(),
      weatherCode: z.number(),
      windSpeed10M: z.number(),
      windDirection10M: z.number(),
      uvIndex: z.number(),
    })
    .optional(),
  dailyUnits: DailyForecastSchema.shape.dailyUnits.optional(),
  daily: DailyForecastSchema.shape.daily.optional(),
  minutely15Units: HourlyForecastSchema.shape.minutely15Units.optional(),
  minutely15: HourlyForecastSchema.shape.minutely15.optional(),
  hourlyUnits: HourlyForecastSchema.shape.hourlyUnits.optional(),
  hourly: HourlyForecastSchema.shape.hourly.optional(),
}).passthrough();

export type CombinedForecastType = z.infer<typeof CombinedForecastSchema>;
