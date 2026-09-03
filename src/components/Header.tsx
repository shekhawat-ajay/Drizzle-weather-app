import { NavLink } from "react-router";
import { CloudSun, Telescope } from "lucide-react";
import { useAppTheme } from "@/context/ThemeContext";

export default function Header() {
  const { theme } = useAppTheme();
  const isAstronomy = theme === "astronomy";

  return (
    <header className="border-base-content/10 border-b pb-6">
      <div className="flex flex-col items-center gap-3">
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight transition-all duration-500 ${
            isAstronomy ? "text-accent" : "text-primary"
          }`}
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Drizzle
        </h1>
        <p className="text-base-content/60 text-xs sm:text-sm text-center px-2 transition-colors duration-300">
          {isAstronomy
            ? "Explore the cosmos & celestial events"
            : "Real-time weather updates and forecasts"}
        </p>
        <nav role="tablist" aria-label="Primary" className="tabs tabs-box mt-2">
          <NavLink
            to="/"
            end
            role="tab"
            className={({ isActive }) => `tab gap-1.5 ${isActive ? "tab-active" : ""}`}
          >
            <CloudSun size={16} />
            Weather
          </NavLink>
          <NavLink
            to="/astronomy"
            role="tab"
            className={({ isActive }) => `tab gap-1.5 ${isActive ? "tab-active" : ""}`}
          >
            <Telescope size={16} />
            Astronomy
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
