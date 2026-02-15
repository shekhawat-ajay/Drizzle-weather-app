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

  const pollutants = [
    { name: "PM₁₀", value: pm10, category: pm10Category, color: pm10TextColor },
    {
      name: "PM₂.₅",
      value: pm2_5,
      category: pm2_5Category,
      color: pm2_5TextColor,
    },
    {
      name: "CO",
      value: carbonMonoxide,
      category: coCategory,
      color: coTextColor,
    },
    {
      name: "NO₂",
      value: nitrogenDioxide,
      category: no2Category,
      color: no2TextColor,
    },
    {
      name: "SO₂",
      value: sulphurDioxide,
      category: so2Category,
      color: so2TextColor,
    },
    {
      name: "O₃",
      value: ozone,
      category: ozoneCategory,
      color: ozoneTextColor,
    },
  ];

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
          {/* Header */}
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-base-content text-lg font-semibold">
              Air Quality
            </h3>
            <div className="flex items-center gap-2">
              <span className="status status-error animate-pulse"></span>
              <span className="text-base-content/50 text-xs">
                Live · {lastUpdatedTime}
              </span>
            </div>
          </div>

          {/* AQI Hero */}
          <div className="border-base-content/5 bg-base-300 mb-4 flex flex-col items-center rounded-lg border py-5">
            <p className={cn("font-mono text-5xl font-bold", aqiTextColor)}>
              {aqi}
            </p>
            <p className="text-base-content/60 mt-1 text-sm">{aqiCategory}</p>
          </div>

          {/* Pollutant Table */}
          <div className="overflow-x-auto rounded-lg">
            <table className="table-zebra table-sm table w-full">
              <thead>
                <tr className="text-base-content/50 text-xs">
                  <th className="font-medium">Pollutant</th>
                  <th className="text-center font-medium">μg/m³</th>
                  <th className="text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pollutants.map((p) => (
                  <tr key={p.name}>
                    <td className="text-base-content/80 text-sm">{p.name}</td>
                    <td
                      className={cn("text-center font-mono text-sm", p.color)}
                    >
                      {p.value}
                    </td>
                    <td className="text-right">
                      <span className="badge badge-sm badge-ghost text-xs">
                        {p.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
