import useWeeklyForecast from "@/hooks/weather/useWeeklyForecast";
import { useContext } from "react";
import { LocationContext } from "@/App";
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
    precipitationSum,
    windSpeed10mMax: windSpeed,
  } = data?.daily || {};

  // ── Helpers ───────────────────────────────────────────────

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
    <div className="border-base-content/5 bg-base-200 relative rounded-xl border p-5">
      {error && (
        <div className="flex h-full items-center justify-center py-8">
          <p className="text-error text-sm">Something went wrong!</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0">
          <div className="skeleton h-full w-full rounded-xl"></div>
        </div>
      )}

      {data && (
        <div>
          <h3 className="text-base-content mb-4 text-lg font-semibold">
            Weekly Forecast
          </h3>

          <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {time?.map((date: string, index: number) => {
              const weather = getWeatherImage(weatherCode?.[index] ?? 0);
              return (
                <div
                  key={date}
                  className="border-base-content/5 bg-base-300 hover:bg-base-200 flex min-w-[140px] flex-shrink-0 snap-start flex-col items-center rounded-lg border px-4 py-4 transition-colors duration-150"
                >
                  <p className="text-base-content/50 text-xs">
                    {getDate(date)}
                  </p>
                  <p className="text-sm font-medium">{getWeekDay(date)}</p>
                  <img
                    className="my-2 size-10"
                    src={weather?.imageSrc}
                    alt={weather?.description}
                  />
                  <p className="text-base-content/60 text-xs">
                    {weather?.description}
                  </p>

                  {/* Temperature */}
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {maxTemperature?.[index]}° / {minTemperature?.[index]}°
                  </p>

                  {/* Rain & Precipitation */}
                  <div className="mt-3 flex items-center gap-1">
                    <img
                      className="size-4"
                      src="/rain-probability.svg"
                      alt="rain"
                    />
                    <span className="font-mono text-xs">
                      {precipitationProbability?.[index]}%
                    </span>
                    <span className="text-base-content/40 text-xs">Rain</span>
                  </div>
                  {(precipitationSum?.[index] ?? 0) > 0 && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <img
                        className="size-4"
                        src="/raindrops.svg"
                        alt="precipitation"
                      />
                      <span className="font-mono text-xs">
                        {precipitationSum?.[index]} mm
                      </span>
                    </div>
                  )}

                  {/* Wind */}
                  <div className="mt-1 flex items-center gap-1">
                    <img className="size-4" src="/wind.svg" alt="wind" />
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
