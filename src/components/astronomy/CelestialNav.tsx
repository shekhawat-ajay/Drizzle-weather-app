import { NavLink } from "react-router";
import CelestialIcon from "@/components/astronomy/CelestialIcon";

const TABS = [
  { name: "Overview", path: "/astronomy/overview" },
  { name: "Sun", path: "/astronomy/sun" },
  { name: "Moon", path: "/astronomy/moon" },
  { name: "Mercury", path: "/astronomy/mercury" },
  { name: "Venus", path: "/astronomy/venus" },
  { name: "Mars", path: "/astronomy/mars" },
  { name: "Jupiter", path: "/astronomy/jupiter" },
  { name: "Saturn", path: "/astronomy/saturn" },
  { name: "Uranus", path: "/astronomy/uranus" },
  { name: "Neptune", path: "/astronomy/neptune" },
  { name: "ISS", path: "/astronomy/iss" },
];

export default function CelestialNav() {
  return (
    <div className="w-full flex justify-center py-1">
      <nav aria-label="Astronomy sections" className="flex flex-wrap justify-center gap-1 rounded-lg bg-base-200/60 p-1 border border-base-content/5 max-w-full">
        {TABS.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            end={tab.name === "Overview"}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-base-content/50 hover:text-base-content/80 hover:bg-base-content/5"
              }`
            }
          >
            <CelestialIcon name={tab.name} size={14} />
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
