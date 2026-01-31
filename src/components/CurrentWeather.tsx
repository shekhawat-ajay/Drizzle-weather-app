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
        "card relative min-h-[10rem] px-6 py-2",
        isDay
          ? "bg-gradient-to-b from-sky-600 to-sky-300"
          : "bg-gradient-to-r from-slate-500 to-slate-800",
      )}
    >
      {error && (
        <div className="flex h-full w-full justify-center">
          <div className="text-red-500">Something went wrong!</div>
        </div>
      )}
      {isLoading ? (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-12">
          <div className="col-span-4 my-auto">
            <p className="text-xs">{date}</p>
            <h3 className="mt-2 text-3xl md:mt-4">{name}</h3>
            <h4 className="text-sm">
              {state} {country}
            </h4>
            <p className="mt-2 text-xs">Updated at {lastUpdatedTime}</p>
          </div>

          <div className="col-span-4 mx-auto text-center">
            <div>
              <img
                className="size-40"
                src={imageSrc}
                alt={`${imageDescription} svg.`}
              />
            </div>
            <div>{imageDescription}</div>
              <h2 className="my-2 text-6xl">{temperature}°</h2>
          </div>

          <div className="col-span-4 my-auto text-center">
            <div className="mt-6 grid grid-cols-12 divide-x-1 md:m-0">
              <div className="col-span-4 flex flex-col items-center">
                <img
                  className="size-15"
                  src="/thermometer-celsius.svg"
                  alt="thermometer svg"
                />
                <p className="text-lg">{apparentTemperature}°</p>
                <p className="text-sm">Feels like</p>
              </div>
              <div className="col-span-4 flex flex-col items-center">
                <img
                  className="size-15"
                  src="/humidity.svg"
                  alt="humidity svg"
                />
                <p className="text-lg">{relativeHumidity}%</p>
                <p className="text-sm">Humidity</p>
              </div>
              <div className="col-span-4 flex flex-col items-center">
                <img className="size-15" src="/wind.svg" alt="wind svg." />
                <p className="text-lg">{windSpeed} km/h</p>
                <p className="text-sm">Wind Speed</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
