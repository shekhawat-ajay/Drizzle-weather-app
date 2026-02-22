import CurrentWeather from "@/components/weather/CurrentWeather";
import HourlyForecast from "@/components/weather/HourlyForecast";
import TodaysForecast from "@/components/weather/TodayWeather";
import AirQuality from "@/components/weather/AirQuality";
import WeeklyForecast from "@/components/weather/WeeklyForecast";
import LocationMap from "@/components/weather/LocationMap";

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
