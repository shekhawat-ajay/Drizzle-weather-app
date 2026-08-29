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
        <nav aria-label="Primary" className="bg-base-200/50 mt-2 flex gap-1 rounded-lg p-1 transition-colors duration-300">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-base-content/50 hover:text-base-content/80"
              }`
            }
          >
            <CloudSun size={16} />
            Weather
          </NavLink>
          <NavLink
            to="/astronomy"
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-base-content/50 hover:text-base-content/80"
              }`
            }
          >
            <Telescope size={16} />
            Astronomy
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
