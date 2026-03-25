import { useContext } from "react";
import { LocationContext } from "@/App";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import { uvIndexImageMap } from "@/utils/maps/uvIndexImageMap";
import { getWindDirection } from "@/utils/maps/getWindDirection";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";
import { useUnits } from "@/context/UnitsContext";
import { Eye } from "lucide-react";
import { convertTemp, convertWindSpeed, speedUnit, tempUnit } from "@/utils/unitConversions";
import { fmtDateLong, fmtTimeFromISO, getNowAsUTC, parseAsUTC } from "@/utils/formatters";

export default function CurrentWeather() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { units } = useUnits();
  const { data, isLoading, error } = useCurrentWeather(
    location.latitude,
    location.longitude,
  );
  const { data: hourlyData } = useHourlyForecast(
    location.latitude,
    location.longitude,
  );

  const { name, country, admin1: state } = location;
  const weatherInfo = data?.current;

  const {
    time,
    temperature2M: temperature,
    apparentTemperature,
    relativeHumidity2M: relativeHumidity,
    windSpeed10M: windSpeed,
    windDirection10M: windDirDegrees,
    uvIndex,
    weatherCode,
    isDay,
  } = weatherInfo || {};

  const getWeatherImage = (isDay: number, weatherCode: number) => {
    const imageCode = isDay ? `${weatherCode}d` : `${weatherCode}n`;
    return weatherImageMap[imageCode];
  };

  const setUvIndexImage = (uv: number) => {
    const floorUvIndex = Math.floor(uv);
    if (floorUvIndex < 1) return uvIndexImageMap[1];
    if (floorUvIndex > 11) return uvIndexImageMap[11];
    return uvIndexImageMap[floorUvIndex];
  };

  // Extract visibility from the nearest minutely15 forecast
  let visibilityVal: number | null = null;
  if (hourlyData?.minutely15) {
    const nowMs = getNowAsUTC(location.timezone ?? "UTC");
    const times = hourlyData.minutely15.time;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
        const ms = parseAsUTC(times[i]!).getTime();
        const diff = Math.abs(ms - nowMs);
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
        } else if (diff > minDiff) {
            break;
        }
    }
    visibilityVal = hourlyData.minutely15.visibility[closestIdx] ?? null;
  }

  const visibilityText = visibilityVal != null 
    ? (units === "imperial" 
        ? `${(visibilityVal / 1609.34).toFixed(1)} mi` 
        : `${(visibilityVal / 1000).toFixed(1)} km`)
    : "--";

  const { imageSrc, description: imageDescription } =
    (weatherInfo && getWeatherImage(isDay!, weatherCode!)) || {};
  const date = weatherInfo ? fmtDateLong(time!) : "";
  const lastUpdatedTime = weatherInfo ? fmtTimeFromISO(time!) : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-5",
        isDay
          ? "bg-gradient-to-br from-sky-600 to-sky-400"
          : "bg-gradient-to-br from-slate-700 to-slate-900",
      )}
    >
      {error && (
        <div className="flex h-full w-full items-center justify-center py-8">
          <p className="text-error-content text-sm">Something went wrong!</p>
        </div>
      )}
      {isLoading ? (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full"></div>
        </div>
      ) : (
        <div className="grid items-center gap-4 md:grid-cols-12">
          {/* Location Info */}
          <div className="col-span-4">
            <p className="text-xs text-white/60">{date}</p>
            <h3 className="mt-1 text-2xl font-bold text-white">{name}</h3>
            <p className="text-sm text-white/70">
              {state}, {country}
            </p>
            <p className="mt-2 text-xs text-white/50">
              Updated at {lastUpdatedTime}
            </p>
          </div>

          {/* Weather Icon & Temp */}
          <div className="col-span-4 flex flex-col items-center text-center">
            <img
              className="size-32"
              src={imageSrc}
              alt={`${imageDescription}`}
            />
            <p className="mb-2 text-sm text-white/70">{imageDescription}</p>
            <h2 className="text-5xl font-bold text-white">{Math.round(convertTemp(temperature, units) ?? 0)}
            {tempUnit(units)}</h2>
          </div>

          {/* Stats */}
          <div className="col-span-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-3">
                <img
                  className="size-8"
                  src="/thermometer-celsius.svg"
                  alt="feels like"
                />
                <p className="mt-1 text-sm font-semibold text-white">
                  {Math.round(convertTemp(apparentTemperature, units) ?? 0)}{tempUnit(units)}
                </p>
                <p className="text-xs text-white/60">Feels like</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-3">
                <img className="size-8" src="/humidity.svg" alt="humidity" />
                <p className="mt-1 text-sm font-semibold text-white">
                  {relativeHumidity}%
                </p>
                <p className="text-xs text-white/60">Humidity</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-3">
                <img className="size-8" src="/wind.svg" alt="wind speed" />
                <p className="mt-1 text-sm font-semibold text-white">
                  {convertWindSpeed(windSpeed, units)}
                </p>
                <p className="text-xs text-white/60">{speedUnit(units)}</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-3">
                <img
                  className="size-8"
                  src="/compass.svg"
                  alt="wind direction"
                />
                <p className="mt-1 text-sm font-semibold text-white">
                  {getWindDirection(windDirDegrees ?? 0)} {windDirDegrees}°
                </p>
                <p className="text-xs text-white/60">Wind Dir.</p>
              </div>
              <div className="flex flex-col items-center justify-between rounded-lg bg-white/10 px-2 py-3">
                <div className="flex h-8 items-center">
                  <Eye className="size-7 text-white/90" strokeWidth={1.5} />
                </div>
                <div className="text-center mt-1">
                  <p className="text-sm font-semibold text-white">
                    {visibilityText}
                  </p>
                  <p className="text-xs text-white/60">Visibility</p>
                </div>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-3">
                <img
                  className="size-8"
                  src={setUvIndexImage(uvIndex ?? 0)?.imageSrc}
                  alt="UV Index"
                />
                <p className="mt-1 text-sm font-semibold text-white">
                  {uvIndex?.toFixed(1) ?? "--"}
                </p>
                <p className="text-xs text-white/60">UV Index</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
