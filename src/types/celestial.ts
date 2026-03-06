/* ─── Celestial Rise/Set Types ─── */

export type HorizonState = "ABOVE" | "BELOW";

export interface CelestialEvent {
  /** Exact UTC moment of the event */
  timestamp: Date;
  /** Whether this was a rise or set event */
  type: "RISE" | "SET";
}

export interface CelestialStatus {
  /** Display name of the celestial body */
  body: string;
  /** Whether the body is currently above or below the horizon (null = indeterminate) */
  state: HorizonState | null;

  /** The relevant past horizon-crossing event */
  pastEvent: CelestialEvent | null;
  /** The relevant future horizon-crossing event */
  futureEvent: CelestialEvent | null;

  /** Milliseconds elapsed since pastEvent */
  pastDuration: number | null;
  /** Milliseconds remaining until futureEvent */
  futureDuration: number | null;

  /** Human-readable, e.g. "Mars rose 2 hr 10 m ago" */
  pastLabel: string;
  /** Human-readable, e.g. "Mars sets in 4 hr 50 m" */
  futureLabel: string;

  /** Angular separation from the Sun in degrees (null for Moon) */
  elongation: number | null;
  /** Human-readable observability hint */
  visibilityNote: string;
}
