import { useContext } from "react";
import { LocationContext } from "@/context/LocationContext";
import type { ResultType } from "@/schema/location";
import useCombinedForecast from "@/hooks/weather/useCombinedForecast";
import CurrentWeather from "@/components/weather/CurrentWeather";
import HourlyForecast from "@/components/weather/HourlyForecast";
import TodaysForecast from "@/components/weather/TodayWeather";
import AirQuality from "@/components/weather/AirQuality";
import WeeklyForecast from "@/components/weather/WeeklyForecast";
import LocationMap from "@/components/weather/LocationMap";

function WeatherSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 h-48 rounded-xl skeleton" />
      <div className="col-span-12 h-56 rounded-xl skeleton" />
      <div className="col-span-12 h-40 rounded-xl skeleton" />
      <div className="col-span-12 h-64 rounded-xl skeleton" />
      <div className="col-span-12 h-48 rounded-xl skeleton" />
      <div className="col-span-12 h-[350px] rounded-xl skeleton" />
    </div>
  );
}

export default function WeatherPage() {
  const { location } = useContext(LocationContext) as unknown as { location: ResultType };
  const { isLoading, data } = useCombinedForecast(location.latitude, location.longitude);

  if (isLoading && !data) {
    return <WeatherSkeleton />;
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <CurrentWeather />
      </div>
      <div className="col-span-12">
        <HourlyForecast />
      </div>
      <div className="col-span-12">
        <TodaysForecast />
      </div>
      <div className="col-span-12">
        <AirQuality />
      </div>
      <div className="col-span-12">
        <WeeklyForecast />
      </div>
      <div className="col-span-12">
        <LocationMap />
      </div>
    </div>
  );
}
