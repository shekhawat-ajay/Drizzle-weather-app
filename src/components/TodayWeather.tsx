import useTodayWeather from "@/hooks/useTodayWeather";
import { useContext } from "react";
import { LocationContext } from "../App";
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

    const image = uvIndexImageMap[floorUvIndex];
    return image;
  };

  const sunriseTime = getTime(sunrise?.[0] ?? "");
  const sunsetTime = getTime(sunset?.[0] ?? "");
  const { imageSrc: uvIndexImage, description: uvImageDescription } =
    setUvIndexImage(uvIndex?.[0] ?? 0) || {};

  const windDirection = getWindDirection(windDirectionDegree?.[0] ?? 0);

  return (
    <div className="bg-base-200 card relative min-h-full space-y-4 p-4">
      {error && (
        <div className="flex h-full w-full justify-center">
          <div className="text-red-500">Something went wrong!</div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 min-h-[10rem]">
          <div className="skeleton h-full w-full"></div>
        </div>
      )}

      {data && (
        <div className="flex flex-col items-center">
          <p className="text-xl font-light">{`Today's Forecast`} </p>
          <div className="">
            <span className="font-mono text-xl font-semibold">
              {maxTemperature}° / {minTemperature}°
            </span>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <img
                className="mx-auto size-25"
                src="/sunrise.svg"
                alt="sunrise svg"
              />
              <p className="font-mono text-lg font-semibold">{sunriseTime}</p>
              <p className="text-sm">Sunrise</p>
            </div>
            <div className="text-center">
              <img
                className="mx-auto size-25"
                src="/sunset.svg"
                alt="sunset svg"
              />
              <p className="font-mono text-lg font-semibold">{sunsetTime}</p>
              <p className="text-sm">Sunset</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <img
                className="mx-auto size-20"
                src={uvIndexImage}
                alt={uvImageDescription}
              />
              <p className="font-mono text-lg font-semibold">
                {uvIndex} out of 11
              </p>
              <p className="text-sm">UV index</p>
            </div>
            <div className="text-center">
              <img className="mx-auto size-20" src="/wind.svg" alt="wind-svg" />
              <p className="font-mono text-lg font-semibold">
                {windDirection} | {windDirectionDegree}°
              </p>
              <p className="text-sm">Wind direction</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <img className="mx-auto size-20" src="/raindrops.svg" alt="" />
              <p className="font-mono text-lg font-semibold">
                {precipitationSum?.[0]} mm
              </p>
              <p className="text-sm">Precipitation</p>
            </div>
            <div className="text-center">
              <img
                className="mx-auto size-20"
                src="/rain-probability.svg"
                alt="rain-drops svg"
              />
              <p className="font-mono text-lg font-semibold">
                {precipitationProbability?.[0]} %
              </p>
              <p className="text-sm">Chances of rain</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
