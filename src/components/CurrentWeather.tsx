import { useContext } from "react";
import { LocationContext } from "../App";
import useCurrentWeather from "@/hooks/useCurrentWeather";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";

export default function CurrentWeather() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, isLoading, error } = useCurrentWeather(
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
    weatherCode,
    isDay,
  } = weatherInfo || {};

  const getWeatherImage = (isDay: number, weatherCode: number) => {
    const imageCode = isDay ? `${weatherCode}d` : `${weatherCode}n`;

    const image = weatherImageMap[imageCode];
    return image;
  };

  const dateToday = (time: string) => {
    const dateISO = new Date(time);
    const dateString = dateISO.toLocaleString("default", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return dateString;
  };

  const getLastUpdatedTime = (time: string) => {
    const dateISO = new Date(time);
    const timeString = dateISO.toLocaleString("default", {
      hour: "numeric",
      minute: "numeric",
    });
    return timeString;
  };

  const { imageSrc, description: imageDescription } =
    (weatherInfo && getWeatherImage(isDay!, weatherCode!)) || {};
  const date = weatherInfo ? dateToday(time!) : "";
  const lastUpdatedTime = weatherInfo ? getLastUpdatedTime(time!) : "";

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
            <h2 className="text-5xl font-bold text-white">{temperature}°</h2>
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
                  {apparentTemperature}°
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
                  {windSpeed}
                </p>
                <p className="text-xs text-white/60">km/h</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
