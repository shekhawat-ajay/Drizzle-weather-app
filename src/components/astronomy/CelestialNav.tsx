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
      <nav role="tablist" aria-label="Astronomy sections" className="tabs tabs-box flex-wrap justify-center max-w-full">
        {TABS.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.path}
            end={tab.name === "Overview"}
            role="tab"
            className={({ isActive }) => `tab gap-1.5 ${isActive ? "tab-active" : ""}`}
          >
            <CelestialIcon name={tab.name} size={14} />
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
