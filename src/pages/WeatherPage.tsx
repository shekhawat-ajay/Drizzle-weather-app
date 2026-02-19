import CurrentWeather from "@/components/CurrentWeather";
import HourlyForecast from "@/components/HourlyForecast";
import TodaysForecast from "@/components/TodayWeather";
import AirQuality from "@/components/AirQuality";
import WeeklyForecast from "@/components/WeeklyForecast";
import LocationMap from "@/components/LocationMap";

export default function WeatherPage() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <CurrentWeather />
      </div>
      <div className="col-span-12">
        <HourlyForecast />
      </div>
      <div className="col-span-12 md:col-span-6">
        <TodaysForecast />
      </div>
      <div className="col-span-12 md:col-span-6">
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
