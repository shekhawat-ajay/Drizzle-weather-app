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

    return someDate.toLocaleString("default", { weekday: "short" });
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
    <div className="relative rounded-xl border border-base-content/5 bg-base-200 p-5">
      {error && (
        <div className="flex h-full items-center justify-center py-8">
          <p className="text-sm text-error">Something went wrong!</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full rounded-xl"></div>
        </div>
      )}

      {data && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-base-content">
            Weekly Forecast
          </h3>

          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin">
            {time?.map((date: string, index: number) => {
              const weather = getWeatherImage(weatherCode?.[index] ?? 0);
              return (
                <div
                  key={date}
                  className="flex min-w-[130px] flex-shrink-0 snap-start flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-4 py-4 transition-colors duration-150 hover:bg-base-200"
                >
                  <p className="text-xs text-base-content/50">{getDate(date)}</p>
                  <p className="text-sm font-medium">{getWeekDay(date)}</p>
                  <img
                    className="my-2 size-10"
                    src={weather?.imageSrc}
                    alt={weather?.description}
                  />
                  <p className="text-xs text-base-content/60">{weather?.description}</p>
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {maxTemperature?.[index]}° / {minTemperature?.[index]}°
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <img className="size-5" src="/rain-probability.svg" alt="rain" />
                    <span className="font-mono text-xs">
                      {precipitationProbability?.[index]}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <img className="size-5" src="/wind.svg" alt="wind" />
                    <span className="font-mono text-xs">
                      {windSpeed?.[index]} km/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
