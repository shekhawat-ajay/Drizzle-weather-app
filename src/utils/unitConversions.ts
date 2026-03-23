import type { UnitSystem } from "@/types/units";

// ── Temperature ────────────────────────────────────────────────
/** Convert °C → °F when imperial, otherwise return as-is. */
export function convertTemp(
  value: number | undefined,
  units: UnitSystem,
): number | undefined {
  if (value == null) return undefined;
  if (units === "metric") return value;
  return Math.round((value * 9 / 5 + 32) * 10) / 10;
}

export function tempUnit(units: UnitSystem): string {
  return units === "metric" ? "°C" : "°F";
}

// ── Wind Speed ─────────────────────────────────────────────────
/** Convert km/h → mph when imperial, otherwise return as-is. */
export function convertWindSpeed(
  value: number | undefined,
  units: UnitSystem,
): number | undefined {
  if (value == null) return undefined;
  if (units === "metric") return value;
  return Math.round(value * 0.621371 * 10) / 10;
}

export function speedUnit(units: UnitSystem): string {
  return units === "metric" ? "km/h" : "mph";
}

// ── Precipitation ──────────────────────────────────────────────
/** Convert mm → in when imperial, otherwise return as-is. */
export function convertPrecipitation(
  value: number | undefined,
  units: UnitSystem,
): number | undefined {
  if (value == null) return undefined;
  if (units === "metric") return value;
  return Math.round(value * 0.03937 * 100) / 100;
}

export function precipUnit(units: UnitSystem): string {
  return units === "metric" ? "mm" : "in";
}
