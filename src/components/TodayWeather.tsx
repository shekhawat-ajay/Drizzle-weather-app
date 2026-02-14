import useTodayWeather from "@/hooks/useTodayWeather";
import { useContext } from "react";
import { LocationContext } from "@/App";
import { uvIndexImageMap } from "@/utils/maps/uvIndexImageMap";
import { getWindDirection } from "@/utils/maps/getWindDirection";
import { ResultType } from "@/schema/location";

export default function TodaysForecast() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, isLoading, error } = useTodayWeather(
    location.latitude,
    location.longitude,
  );

  const {
    temperature2mMax: maxTemperature,
    temperature2mMin: minTemperature,
    sunrise,
    sunset,
    uvIndexMax: uvIndex,
    windDirection10mDominant: windDirectionDegree,
    precipitationSum: precipitationSum,
    precipitationProbabilityMax: precipitationProbability,
  } = data?.daily || {};

  const getTime = (time: string) => {
    const dateISO = new Date(time);
    const dateString = dateISO.toLocaleString("default", {
      hour: "numeric",
      minute: "numeric",
    });
    return dateString;
  };

  const setUvIndexImage = (uvIndex: number) => {
    const floorUvIndex = Math.floor(uvIndex);
    let image;
    if(floorUvIndex < 1) {
      image = uvIndexImageMap[1];
    } else if(floorUvIndex > 11) {
      image = uvIndexImageMap[11];
    } else {
      image = uvIndexImageMap[floorUvIndex];
    }
    return image;
  };

  const sunriseTime = getTime(sunrise?.[0] ?? "");
  const sunsetTime = getTime(sunset?.[0] ?? "");
  const { imageSrc: uvIndexImage, description: uvImageDescription } =
    setUvIndexImage(uvIndex?.[0] ?? 0) || {};

  const windDirection = getWindDirection(windDirectionDegree?.[0] ?? 0);

  return (
    <div className="relative h-full rounded-xl border border-base-content/5 bg-base-200 p-5">
      {error && (
        <div className="flex h-full items-center justify-center">
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
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-base-content">
              Today's Forecast
            </h3>
            <span className="font-mono text-sm font-semibold text-base-content/70">
              {maxTemperature}° / {minTemperature}°
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sunrise */}
            <div className="flex flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-3 py-4">
              <img className="size-10" src="/sunrise.svg" alt="sunrise" />
              <p className="mt-2 font-mono text-sm font-semibold">{sunriseTime}</p>
              <p className="text-xs text-base-content/50">Sunrise</p>
            </div>

            {/* Sunset */}
            <div className="flex flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-3 py-4">
              <img className="size-10" src="/sunset.svg" alt="sunset" />
              <p className="mt-2 font-mono text-sm font-semibold">{sunsetTime}</p>
              <p className="text-xs text-base-content/50">Sunset</p>
            </div>

            {/* UV Index */}
            <div className="flex flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-3 py-4">
              <img className="size-10" src={uvIndexImage} alt={uvImageDescription} />
              <p className="mt-2 font-mono text-sm font-semibold">
                {uvIndex?.[0]}<span className="text-base-content/40"> / 11</span>
              </p>
              <p className="text-xs text-base-content/50">UV Index</p>
            </div>

            {/* Wind Direction */}
            <div className="flex flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-3 py-4">
              <img className="size-10" src="/wind.svg" alt="wind direction" />
              <p className="mt-2 font-mono text-sm font-semibold">
                {windDirection} {windDirectionDegree?.[0]}°
              </p>
              <p className="text-xs text-base-content/50">Wind Dir.</p>
            </div>

            {/* Precipitation */}
            <div className="flex flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-3 py-4">
              <img className="size-10" src="/raindrops.svg" alt="precipitation" />
              <p className="mt-2 font-mono text-sm font-semibold">
                {precipitationSum?.[0]} mm
              </p>
              <p className="text-xs text-base-content/50">Precipitation</p>
            </div>

            {/* Rain Probability */}
            <div className="flex flex-col items-center rounded-lg border border-base-content/5 bg-base-300 px-3 py-4">
              <img className="size-10" src="/rain-probability.svg" alt="rain probability" />
              <p className="mt-2 font-mono text-sm font-semibold">
                {precipitationProbability?.[0]}%
              </p>
              <p className="text-xs text-base-content/50">Rain chance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
