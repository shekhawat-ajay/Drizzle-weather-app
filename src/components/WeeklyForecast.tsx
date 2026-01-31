import useWeeklyForecast from "@/hooks/useWeeklyForecast";
import { useContext } from "react";
import { LocationContext } from "../App";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import { ResultType } from "@/schema/location";

export default function WeeklyForecast() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, isLoading, error } = useWeeklyForecast(
    location.latitude,
    location.longitude,
  );

  const {
    time,
    weatherCode: weatherCode,
    temperature2mMax: maxTemperature,
    temperature2mMin: minTemperature,
    precipitationProbabilityMax: precipitationProbability,
    windSpeed10mMax: windSpeed,
  } = data?.daily || {};

  const getWeekDay = (someDay: string) => {
    const today = new Date();
    const someDate = new Date(someDay);

    // Remove time part for accurate comparison
    today.setHours(0, 0, 0, 0);
    someDate.setHours(0, 0, 0, 0);

    const msInDay = 24 * 60 * 60 * 1000;
    const dateDifference = (someDate.getTime() - today.getTime()) / msInDay;

    if (dateDifference === 0) {
      return "Today";
    }
    if (dateDifference === -1) {
      return "Yesterday";
    }
    if (dateDifference === 1) {
      return "Tomorrow";
    }

    return someDate.toLocaleString("default", { weekday: "long" });
  };

  const getDate = (time: string) => {
    const dateISO = new Date(time);
    const timeString = dateISO.toLocaleString("default", {
      day: "2-digit",
      month: "short",
    });
    return timeString;
  };

  const getWeatherImage = (weatherCode: number) => {
    const imageCode = `${weatherCode}d`;

    const image = weatherImageMap[imageCode];
    return image;
  };

  return (
    <div className="bg-base-200 card relative flex min-h-full p-4">
      {error && (
        <div className="flex h-full w-full justify-center">
          <div className="text-red-500">Something went wrong!</div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full"></div>
        </div>
      )}

      {data && (
        <div className="flex flex-col items-center p-2">
          <p className="m-4 text-center text-xl font-light">Weekly Forecast</p>
          <div className="carousel bg-neutral rounded-box max-w-sm p-2">
            {time?.map((date: string, index: number) => (
              <div
                key={date}
                id={`item${index + 1}`}
                className="carousel-item bg-base-300 card flex w-full flex-col items-center p-2"
              >
                <p className="text-sm">{getDate(date)}</p>
                <p className="text-sm">{getWeekDay(date)}</p>
                <img
                  className="size-12"
                  src={getWeatherImage(weatherCode?.[index] ?? 0)?.imageSrc}
                  alt={getWeatherImage(weatherCode?.[index] ?? 0)?.description}
                />
                <p className="text-sm">
                  {getWeatherImage(weatherCode?.[index] ?? 0)?.description}
                </p>
                <p className="p-2 font-mono text-lg font-semibold">
                  {maxTemperature?.[index]}° / {minTemperature?.[index]}°
                </p>
                <div className="flex items-center">
                  <img className="size-11" src="/rain-probability.svg" />
                  <p className="font-mono text-lg font-semibold">
                    {precipitationProbability?.[index]} %
                  </p>
                </div>
                <p className="text-xs">Chances of rain</p>
                <div className="flex items-center gap-2 pt-2">
                  <img className="size-10" src="/wind.svg" alt="wind-svg" />
                  <p className="font-mono text-lg font-semibold">
                    {windSpeed?.[index]} km/h
                  </p>
                </div>
                <p className="text-xs">Wind</p>
              </div>
            ))}
          </div>
          <div className="flex w-full justify-center gap-2 py-2">
            {time?.map((_: any, index: number) => (
              <a key={index} href={`#item${index + 1}`} className="btn btn-xs">
                {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
