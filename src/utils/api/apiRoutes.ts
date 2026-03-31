const WEATHER_BASE_URL: string = import.meta.env["VITE_WEATHER_BASE_URL"];
const AIR_QUALITY_BASE_URL: string = import.meta.env[
  "VITE_AIR_QUALITY_BASE_URL"
];
const GEOCODING_BASE_URL: string = import.meta.env["VITE_GEOCODING_BASE_URL"];
const ISS_BASE_URL: string = import.meta.env["VITE_ISS_BASE_URL"];

export const apiRoutes = {
  currentWeather: (latitude: number, longitude: number) =>
    `${WEATHER_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&models=best_match&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,uv_index&timezone=auto&forecast_days=1`,
  hourlyForecast: (latitude: number, longitude: number) =>
    `${WEATHER_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&models=best_match&minutely_15=temperature_2m,weather_code,precipitation_probability,visibility,is_day&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,is_day,relative_humidity_2m,dew_point_2m,surface_pressure,wind_speed_10m,temperature_2m&timezone=auto&forecast_days=2`,
  dailyForecast: (latitude: number, longitude: number) =>
    `${WEATHER_BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&models=best_match&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_direction_10m_dominant,wind_speed_10m_max&timezone=auto&past_days=1`,
  aqi: (latitude: number, longitude: number) =>
    `${AIR_QUALITY_BASE_URL}/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ammonia,carbon_monoxide,ozone,european_aqi,us_aqi&timezone=auto&past_days=1&forecast_days=1`,
  location: (query: string) =>
    `${GEOCODING_BASE_URL}/search?name=${query}&count=10&language=en&format=json`,
  iss: () => `${ISS_BASE_URL}/satellites/25544`,
  issPositions: (timestamps: number[]) => `${ISS_BASE_URL}/satellites/25544/positions?timestamps=${timestamps.join(",")}`,
};
