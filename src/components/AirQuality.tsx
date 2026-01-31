import { LocationContext } from "@/App";
import useAQI from "@/hooks/useAQI";
import { useContext } from "react";
import {
  getAqiCategory,
  getPm10Category,
  getPm2_5Category,
  getCOCategory,
  getNO2Category,
  getS02Category,
  get03Category,
} from "@/utils/maps/aqiMap";
import { cn } from "@/utils/cn";
import { ResultType } from "@/schema/location";

export default function AirQuality() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const { data, isLoading, error } = useAQI(
    location.latitude,
    location.longitude,
  );

  const {
    time,
    usAqi: aqi,
    pm10,
    pm25: pm2_5,
    carbonMonoxide,
    nitrogenDioxide,
    sulphurDioxide,
    ozone,
  } = data?.current || {};

  const getLastUpdatedTime = (time?: string) => {
    const dateISO = time ? new Date(time) : new Date();
    const timeString = dateISO.toLocaleString("default", {
      hour: "numeric",
      minute: "numeric",
    });
    return timeString;
  };

  const lastUpdatedTime = getLastUpdatedTime(time);
  const { category: aqiCategory, textColor: aqiTextColor } =
    (aqi !== undefined && getAqiCategory(aqi)) || {};
  const { category: pm10Category, textColor: pm10TextColor } =
    (pm10 !== undefined && getPm10Category(pm10)) || {};
  const { category: pm2_5Category, textColor: pm2_5TextColor } =
    (pm2_5 !== undefined && getPm2_5Category(pm2_5)) || {};
  const { category: coCategory, textColor: coTextColor } =
    (carbonMonoxide !== undefined && getCOCategory(carbonMonoxide)) || {};
  const { category: no2Category, textColor: no2TextColor } =
    (nitrogenDioxide !== undefined && getNO2Category(nitrogenDioxide)) || {};
  const { category: so2Category, textColor: so2TextColor } =
    (sulphurDioxide !== undefined && getS02Category(sulphurDioxide)) || {};
  const { category: ozoneCategory, textColor: ozoneTextColor } =
    (ozone !== undefined && get03Category(ozone)) || {};

  return (
    <div className="card bg-base-200 relative min-h-full p-4">
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
        <div className="flex flex-col items-center space-y-2">
          <p className="text-xl font-light">Air Quality Index</p>

          <div className="m-2 flex items-center gap-2">
            <div className="size-3 animate-pulse rounded-full bg-red-500"></div>
            <p className="text-sm">Live AQI</p>
          </div>
          <p className="text-center text-xs text-neutral-500">
            Last Updated at {lastUpdatedTime}
          </p>

          <div className="m-2 flex flex-col items-center gap-4 p-4">
            <p className={cn("font-mono text-6xl font-semibold", aqiTextColor)}>
              {aqi}
            </p>
            <p className="text-xl font-light">{aqiCategory}</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr>
                  <th className="bg-base-300 border border-gray-400 px-2 py-2 text-sm">
                    Pollutant
                  </th>
                  <th className="bg-base-300 border border-gray-400 px-4 py-2 text-sm">
                    Concentration (μg/m³)
                  </th>
                  <th className="bg-base-300 border border-gray-400 px-4 py-2 text-sm">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center">
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    PM<sub>10</sub>
                  </td>
                  <td
                    className={cn(
                      "border border-gray-400 px-4 py-2 text-sm",
                      pm10TextColor,
                    )}
                  >
                    {pm10}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    {pm10Category}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    PM<sub>2.5</sub>
                  </td>
                  <td
                    className={cn(
                      "border border-gray-400 px-4 py-2 text-sm",
                      pm2_5TextColor,
                    )}
                  >
                    {pm2_5}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    {pm2_5Category}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    CO
                  </td>
                  <td
                    className={cn(
                      "border border-gray-400 px-4 py-2 text-sm",
                      coTextColor,
                    )}
                  >
                    {carbonMonoxide}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    {coCategory}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    NO<sub>2</sub>
                  </td>
                  <td
                    className={cn(
                      "border border-gray-400 px-4 py-2 text-sm",
                      no2TextColor,
                    )}
                  >
                    {nitrogenDioxide}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    {no2Category}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    SO<sub>2</sub>
                  </td>
                  <td
                    className={cn(
                      "border border-gray-400 px-4 py-2 text-sm",
                      so2TextColor,
                    )}
                  >
                    {sulphurDioxide}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    {so2Category}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    O<sub>3</sub>
                  </td>
                  <td
                    className={cn(
                      "border border-gray-400 px-4 py-2 text-sm",
                      ozoneTextColor,
                    )}
                  >
                    {ozone}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-sm">
                    {ozoneCategory}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
