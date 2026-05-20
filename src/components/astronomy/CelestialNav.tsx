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
    <div className="mb-6 w-full flex justify-center">
      <nav className="flex flex-wrap justify-center gap-1 rounded-lg bg-base-200/50 p-1 transition-colors duration-300">
        {TABS.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-teal-500/15 text-teal-400 shadow-sm"
                  : "text-base-content/50 hover:text-base-content/80 hover:bg-base-content/5"
              }`
            }
          >
            <CelestialIcon name={tab.name} size={15} />
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
