import useDailyForecast from "@/hooks/weather/useDailyForecast";
import { useContext } from "react";
import { LocationContext } from "@/App";
import { uvIndexImageMap } from "@/utils/maps/uvIndexImageMap";
import { getWindDirection } from "@/utils/maps/getWindDirection";
import { ResultType } from "@/schema/location";
import { useUnits } from "@/context/UnitsContext";
import { convertTemp, convertPrecipitation, precipUnit, tempUnit } from "@/utils/unitConversions";
import { fmtTimeFromISO } from "@/utils/formatters";

export default function TodaysForecast() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { units } = useUnits();
  const { data, isLoading, error } = useDailyForecast(
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



  const setUvIndexImage = (uvIndex: number) => {
    const floorUvIndex = Math.floor(uvIndex);
    let image;
    if (floorUvIndex < 1) {
      image = uvIndexImageMap[1];
    } else if (floorUvIndex > 11) {
      image = uvIndexImageMap[11];
    } else {
      image = uvIndexImageMap[floorUvIndex];
    }
    return image;
  };

  const getUvLevel = (uv: number): { label: string; colorClass: string } => {
    if (uv < 3) return { label: "Low", colorClass: "text-green-400" };
    if (uv < 6) return { label: "Moderate", colorClass: "text-yellow-400" };
    if (uv < 8) return { label: "High", colorClass: "text-orange-400" };
    if (uv < 11) return { label: "Very High", colorClass: "text-red-400" };
    return { label: "Extreme", colorClass: "text-fuchsia-400" };
  };

  const sunriseTime = fmtTimeFromISO(sunrise?.[1] ?? "");
  const sunsetTime = fmtTimeFromISO(sunset?.[1] ?? "");
  const { imageSrc: uvIndexImage, description: uvImageDescription } =
    setUvIndexImage(uvIndex?.[1] ?? 0) || {};
  const uvLevel = getUvLevel(uvIndex?.[1] ?? 0);

  const windDirection = getWindDirection(windDirectionDegree?.[1] ?? 0);

  return (
    <div className="border-base-content/5 bg-base-200 relative h-full rounded-xl border p-5">
      {error && (
        <div className="flex h-full items-center justify-center">
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
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-base-content text-lg font-semibold">
              Today's Forecast
            </h3>
            <span className="text-base-content/70 font-mono text-sm font-semibold">
              {Math.round(convertTemp(maxTemperature?.[1], units) ?? 0)}{tempUnit(units)} / {Math.round(convertTemp(minTemperature?.[1], units) ?? 0)}{tempUnit(units)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sunrise */}
            <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border px-3 py-4">
              <img className="size-10" src="/sunrise.svg" alt="sunrise" />
              <p className="mt-2 font-mono text-sm font-semibold">
                {sunriseTime}
              </p>
              <p className="text-base-content/50 text-xs">Sunrise</p>
            </div>

            {/* Sunset */}
            <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border px-3 py-4">
              <img className="size-10" src="/sunset.svg" alt="sunset" />
              <p className="mt-2 font-mono text-sm font-semibold">
                {sunsetTime}
              </p>
              <p className="text-base-content/50 text-xs">Sunset</p>
            </div>

            {/* UV Index */}
            <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border px-3 py-4">
              <img
                className="size-10"
                src={uvIndexImage}
                alt={uvImageDescription}
              />
              <p className="mt-2 font-mono text-sm font-semibold">
                {uvIndex?.[1]?.toFixed(1)}
                <span className="text-base-content/40"> / 11</span>
              </p>
              <p className={`text-xs font-medium ${uvLevel.colorClass}`}>
                {uvLevel.label}
              </p>
              <p className="text-base-content/50 text-xs">UV Index</p>
            </div>

            {/* Wind Direction */}
            <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border px-3 py-4">
              <img
                className="size-10"
                src="/compass.svg"
                alt="wind direction"
              />
              <p className="mt-2 font-mono text-sm font-semibold">
                {windDirection} {windDirectionDegree?.[1]}°
              </p>
              <p className="text-base-content/50 text-xs">Wind Dir.</p>
            </div>

            {/* Precipitation */}
            <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border px-3 py-4">
              <img
                className="size-10"
                src="/raindrop-measure.svg"
                alt="precipitation"
              />
              <p className="mt-2 font-mono text-sm font-semibold">
                {convertPrecipitation(precipitationSum?.[1], units)} {precipUnit(units)}
              </p>
              <p className="text-base-content/50 text-xs">Precipitation</p>
            </div>

            {/* Rain Probability */}
            <div className="border-base-content/5 bg-base-300 flex flex-col items-center rounded-lg border px-3 py-4">
              <img
                className="size-10"
                src="/rain-probability.svg"
                alt="rain probability"
              />
              <p className="mt-2 font-mono text-sm font-semibold">
                {precipitationProbability?.[1]}%
              </p>
              <p className="text-base-content/50 text-xs">Rain chance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
