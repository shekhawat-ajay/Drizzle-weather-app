import { createContext, useContext, useState } from "react";
import type { UnitSystem, UnitsContextType } from "@/types/units";

const STORAGE_KEY = "drizzle-units";

function getStoredUnits(): UnitSystem {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "imperial") return "imperial";
  } catch {
    // SSR or storage unavailable
  }
  return "metric";
}

const UnitsContext = createContext<UnitsContextType>({
  units: "metric",
  setUnits: () => {},
});

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnitsState] = useState<UnitSystem>(getStoredUnits);

  const setUnits: UnitsContextType["setUnits"] = (value) => {
    setUnitsState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // storage unavailable
      }
      return next;
    });
  };

  return (
    <UnitsContext.Provider value={{ units, setUnits }}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitsContext);
}

export default UnitsContext;
