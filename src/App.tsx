import { createContext, useState, Dispatch, SetStateAction } from "react";
import { Routes, Route } from "react-router";
import { ThemeProvider } from "@/context/ThemeContext";
import SearchBox from "@/components/SearchBox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WeatherPage from "@/pages/WeatherPage";
import AstronomyPage from "@/pages/AstronomyPage";
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
      <ThemeProvider>
        <main className="animate-fade-in mx-auto max-w-4xl px-4 py-6">
          <Header />
          <div className="mt-6 mb-6">
            <SearchBox />
          </div>
          <Routes>
            <Route path="/" element={<WeatherPage />} />
            <Route path="/astronomy" element={<AstronomyPage />} />
          </Routes>
          <Footer />
        </main>
      </ThemeProvider>
    </LocationContext.Provider>
  );
}

export default App;
export { LocationContext };
