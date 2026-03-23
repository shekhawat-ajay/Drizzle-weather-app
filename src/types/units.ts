import type { Dispatch, SetStateAction } from "react";

export type UnitSystem = "metric" | "imperial";

export interface UnitsContextType {
  units: UnitSystem;
  setUnits: Dispatch<SetStateAction<UnitSystem>>;
}
