import { createContext, useState, Dispatch, SetStateAction } from "react";
import SearchBox from "@/components/SearchBox";
import Header from "@/components/Header";
import CurrentWeather from "@/components/CurrentWeather";
import TodaysForecast from "@/components/TodayWeather";
import AirQuality from "@/components/AirQuality";
import WeeklyForecast from "@/components/WeeklyForecast";
import Footer from "@/components/Footer";
import { ResultType } from "@/schema/location";

interface LocationContextType {
  location: ResultType;
  setLocation: Dispatch<SetStateAction<ResultType>>;
}

const LocationContext = createContext<LocationContextType | null>(null);

function App() {
  const [location, setLocation] = useState<ResultType>({
    id: 1273294,
    name: "Delhi",
    latitude: 28.65195,
    longitude: 77.23149,
    admin1: "Delhi",
    country: "India",
    countryCode: "IN",
    timezone: "Asia/Kolkata",
  });

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      <main className="mx-auto max-w-4xl px-4 py-6 animate-fade-in">
        <Header />
        <div className="mt-6 mb-6">
          <SearchBox />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <CurrentWeather />
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
        </div>
        <Footer />
      </main>
    </LocationContext.Provider>
  );
}

export default App;
export { LocationContext };
