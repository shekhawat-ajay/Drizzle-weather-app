import { NavLink } from "react-router";

const TABS = [
  { name: "Overview", path: "/astronomy/overview", icon: "🌌" },
  { name: "Sun", path: "/astronomy/sun", icon: "☀️" },
  { name: "Moon", path: "/astronomy/moon", icon: "🌙" },
  { name: "Mercury", path: "/astronomy/mercury", icon: "☿" },
  { name: "Venus", path: "/astronomy/venus", icon: "♀" },
  { name: "Mars", path: "/astronomy/mars", icon: "♂" },
  { name: "Jupiter", path: "/astronomy/jupiter", icon: "♃" },
  { name: "Saturn", path: "/astronomy/saturn", icon: "♄" },
  { name: "Uranus", path: "/astronomy/uranus", icon: "⛢" },
  { name: "Neptune", path: "/astronomy/neptune", icon: "♆" },
  { name: "ISS", path: "/astronomy/iss", icon: "🛰️" },
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
            <span className="text-base">{tab.icon}</span>
            {tab.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
