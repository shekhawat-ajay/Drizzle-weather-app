import useWeeklyForecast from "@/hooks/weather/useWeeklyForecast";
import { useContext } from "react";
import { LocationContext } from "@/App";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import { ResultType } from "@/schema/location";
import { useUnits } from "@/context/UnitsContext";
import {
  convertTemp,
  convertWindSpeed,
  speedUnit,
  convertPrecipitation,
  precipUnit,
  tempUnit,
} from "@/utils/unitConversions";
import {
  fmtDateShortFromISO,
  fmtWeekdayFromISO,
  getDateOnlyFromISO,
} from "@/utils/formatters";
import { cn } from "@/utils/cn";

export default function WeeklyForecast() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { units } = useUnits();
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
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateStr = getDateOnlyFromISO(someDay);

    const todayDate = new Date(todayStr + "T00:00:00Z");
    const someDate = new Date(dateStr + "T00:00:00Z");
    const msInDay = 24 * 60 * 60 * 1000;
    const dateDifference =
      (someDate.getTime() - todayDate.getTime()) / msInDay;

    if (dateDifference === 0) return "Today";
    if (dateDifference === -1) return "Yesterday";
    if (dateDifference === 1) return "Tomorrow";

    return fmtWeekdayFromISO(someDay);
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

          <div className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-4 px-2">
            {time?.map((date: string, index: number) => {
              const weather = getWeatherImage(weatherCode?.[index] ?? 0);
              const dayLabel = getWeekDay(date);

              // Focus scale out of 10
              let focusClasses = "";
              if (dayLabel === "Tomorrow") {
                // 10/10 Focus
                focusClasses =
                  "bg-primary/10 border-primary/40 ring-1 ring-primary/30 shadow-md z-10 opacity-100";
              } else if (dayLabel === "Yesterday") {
                // 4/10 Focus
                focusClasses =
                  "bg-transparent border-base-content/10 border-dashed opacity-40 grayscale-[0.8]";
              } else if (dayLabel === "Today") {
                // 6/10 Focus
                focusClasses = "bg-base-300 border-base-content/5 opacity-70";
              } else {
                // 8/10 Focus (Rest of the week)
                focusClasses = "bg-base-200 border-base-content/10 opacity-100 hover:bg-base-100";
              }

              return (
                <div
                  key={date}
                  className={cn(
                    "flex min-w-[140px] flex-shrink-0 snap-start flex-col items-center rounded-lg border px-4 py-4 transition-all duration-300",
                    focusClasses
                  )}
                >
                  <p className="text-base-content/50 text-xs">
                    {fmtDateShortFromISO(date)}
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      dayLabel === "Tomorrow"
                        ? "font-bold text-primary"
                        : "font-medium"
                    )}
                  >
                    {dayLabel}
                  </p>
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
                    {Math.round(
                      convertTemp(maxTemperature?.[index], units) ?? 0
                    )}
                    {tempUnit(units)} /{" "}
                    {Math.round(
                      convertTemp(minTemperature?.[index], units) ?? 0
                    )}
                    {tempUnit(units)}
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
                        {convertPrecipitation(precipitationSum?.[index], units)}{" "}
                        {precipUnit(units)}
                      </span>
                    </div>
                  )}

                  {/* Wind */}
                  <div className="mt-1 flex items-center gap-1">
                    <img className="size-4" src="/wind.svg" alt="wind" />
                    <span className="font-mono text-xs">
                      {convertWindSpeed(windSpeed?.[index], units)}{" "}
                      {speedUnit(units)}
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
