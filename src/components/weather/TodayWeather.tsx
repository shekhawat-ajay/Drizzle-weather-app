import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
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
  const { data: hourlyData } = useHourlyForecast(
    location.latitude,
    location.longitude,
  );

  const {
    apparentTemperatureMax: maxTemperature,
    apparentTemperatureMin: minTemperature,
    sunrise,
    sunset,
    uvIndexMax: uvIndex,
    windDirection10mDominant: windDirectionDegree,
    precipitationSum: precipitationSum,
    precipitationProbabilityMax: precipitationProbability,
    sunshineDuration,
  } = data?.daily || {};

  // Find min/max cloud cover for today
  const hourly = hourlyData?.hourly;
  let cloudCoverMin = 0;
  let cloudCoverMax = 0;
  let hasCloudCover = false;

  if (hourly?.time && hourly?.cloudCover && data?.daily?.time) {
    const todayStr = data.daily.time[1]; // format "YYYY-MM-DD"
    if (todayStr) {
      let min = 100;
      let max = 0;
      let count = 0;
      for (let i = 0; i < hourly.time.length; i++) {
        if (hourly.time[i]?.startsWith(todayStr)) {
          min = Math.min(min, hourly.cloudCover[i]!);
          max = Math.max(max, hourly.cloudCover[i]!);
          count++;
        }
      }
      if (count > 0) {
        cloudCoverMin = min;
        cloudCoverMax = max;
        hasCloudCover = true;
      }
    }
  }

  const cloudCoverDisplay = hasCloudCover ? `${cloudCoverMin}% - ${cloudCoverMax}%` : "--%";

  let sunshineFormatted = "--";
  if (sunshineDuration && sunshineDuration[1] != null) {
    const secs = sunshineDuration[1];
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    sunshineFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }



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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {/* Precipitation */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img
                className="size-10"
                src="/raindrop-measure.svg"
                alt="precipitation"
              />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {convertPrecipitation(precipitationSum?.[1], units)} {precipUnit(units)}
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Precipitation</p>
            </div>

            {/* Rain Probability */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img
                className="size-10"
                src="/rain-probability.svg"
                alt="rain probability"
              />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {precipitationProbability?.[1]}%
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Rain chance</p>
            </div>

            {/* UV Index */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img
                className="size-10"
                src={uvIndexImage}
                alt={uvImageDescription}
              />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  <span className={uvLevel.colorClass}>{uvIndex?.[1]?.toFixed(1)}</span>
                  <span className="text-base-content/40 ml-1">/ 11</span>
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">UV Index</p>
            </div>

            {/* Cloud Cover */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img
                className="size-10"
                src="/cloud-up.svg"
                alt="cloud cover"
              />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {cloudCoverDisplay}
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Cloud Cover</p>
            </div>

            {/* Sunshine Duration */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img className="size-10" src="/sunshine-duration.svg" alt="sunshine" />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {sunshineFormatted}
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Sunshine</p>
            </div>

            {/* Wind Direction */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img
                className="size-10"
                src="/compass.svg"
                alt="wind direction"
              />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {windDirection} {windDirectionDegree?.[1]}°
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Wind Dir.</p>
            </div>

            {/* Sunrise */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img className="size-10" src="/sunrise.svg" alt="sunrise" />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {sunriseTime}
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Sunrise</p>
            </div>

            {/* Sunset */}
            <div className="border-base-content/5 bg-base-300 flex h-full flex-col items-center rounded-lg border px-3 py-4 text-center">
              <img className="size-10" src="/sunset.svg" alt="sunset" />
              <div className="flex flex-1 flex-col items-center justify-center">
                <p className="mt-2 font-mono text-sm font-semibold whitespace-nowrap">
                  {sunsetTime}
                </p>
              </div>
              <p className="text-base-content/50 mt-2 text-xs">Sunset</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
