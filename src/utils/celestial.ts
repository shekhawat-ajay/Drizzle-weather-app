/**
 * Celestial Rise/Set Engine
 *
 * Pure computational logic for tracking rise/set events, horizon state,
 * elongation, and visibility assessment for Moon + 7 planets.
 *
 * All internal time is UTC. Never converts to local time — that's the UI layer's job.
 */

import {
  Body,
  Observer,
  SearchRiseSet,
  MakeTime,
  Elongation,
} from "astronomy-engine";

import type { CelestialStatus, HorizonState } from "@/types/celestial";

/* ─── Constants (Spec Section 2) ─── */

const SEARCH_WINDOW_DAYS = 3;
const POLAR_SEARCH_DAYS = 15;
const POLAR_THRESHOLD = 65.0;
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const STEP_PAST_EVENT_MS = 60_000; // 1 min — jump past found event in backward search
const MAX_ITERATIONS = 20;

const PLANET_MAP = [
  { name: "Mercury", body: Body.Mercury },
  { name: "Venus", body: Body.Venus },
  { name: "Mars", body: Body.Mars },
  { name: "Jupiter", body: Body.Jupiter },
  { name: "Saturn", body: Body.Saturn },
  { name: "Uranus", body: Body.Uranus },
  { name: "Neptune", body: Body.Neptune },
] as const;

/* ─── Helper: Format Duration (Spec Section 3) ─── */

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.abs(milliseconds) / MS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes} m`);

  return parts.join(" ");
}

/* ─── Helper: Search Window (Spec Section 4) ─── */

function getSearchWindow(latitude: number): number {
  return Math.abs(latitude) >= POLAR_THRESHOLD
    ? POLAR_SEARCH_DAYS
    : SEARCH_WINDOW_DAYS;
}

/* ─── Core: Find Previous Event — Backward Search (Spec Section 5) ─── */

function findPrevEvent(
  body: Body,
  observer: Observer,
  direction: 1 | -1,
  now: ReturnType<typeof MakeTime>,
  maxDays: number,
): ReturnType<typeof SearchRiseSet> | null {
  let cursor = MakeTime(new Date(now.date.getTime() - maxDays * MS_PER_DAY));
  let lastFound: ReturnType<typeof SearchRiseSet> | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const event = SearchRiseSet(body, observer, direction, cursor, maxDays + 1);

    if (!event || event.ut >= now.ut) break;

    lastFound = event;
    cursor = MakeTime(new Date(event.date.getTime() + STEP_PAST_EVENT_MS));
  }

  return lastFound;
}

/* ─── Core: Find Next Event — Forward Search (Spec Section 6) ─── */

function findNextEvent(
  body: Body,
  observer: Observer,
  direction: 1 | -1,
  now: ReturnType<typeof MakeTime>,
  maxDays: number,
): ReturnType<typeof SearchRiseSet> | null {
  return SearchRiseSet(body, observer, direction, now, maxDays);
}

/* ─── Core: Determine Horizon State (Spec Section 7) ─── */

function determineHorizonState(
  previousRise: ReturnType<typeof SearchRiseSet> | null,
  previousSet: ReturnType<typeof SearchRiseSet> | null,
): HorizonState | null {
  if (previousRise && previousSet) {
    return previousRise.ut > previousSet.ut ? "ABOVE" : "BELOW";
  }
  if (previousRise && !previousSet) return "ABOVE";
  if (!previousRise && previousSet) return "BELOW";
  return null;
}

/* ─── Core: Visibility Assessment (Spec Section 8) ─── */

function assessVisibility(bodyName: string, elongationDeg: number): string {
  // Uranus and Neptune — always telescope only
  if (bodyName === "Uranus" || bodyName === "Neptune") {
    return "Not visible to naked eye — telescope required";
  }

  // Too close to Sun — universal cutoff
  if (elongationDeg < 5) {
    return "Too close to the Sun — not observable";
  }

  // Inner planets: Mercury, Venus
  if (bodyName === "Mercury" || bodyName === "Venus") {
    if (elongationDeg < 10)
      return "Very close to Sun — extremely difficult to observe";
    if (elongationDeg < 18)
      return "Low elongation — briefly visible near horizon at dawn/dusk";
    if (bodyName === "Mercury" && elongationDeg >= 18)
      return "Near max elongation — best window for Mercury";
    if (bodyName === "Venus" && elongationDeg >= 30)
      return "Excellent visibility — prominent evening/morning star";
    return "Moderate elongation — visible near dawn or dusk";
  }

  // Outer planets: Mars, Jupiter, Saturn
  if (elongationDeg > 120)
    return "Near opposition — excellent all-night visibility";
  if (elongationDeg > 60) return "Good visibility for several hours";
  if (elongationDeg > 20)
    return "Moderate visibility — limited observation window";

  return "Low elongation — difficult, close to Sun's glare";
}

/* ─── Core: Build Status for One Body (Spec Section 9) ─── */

function getBodyStatus(
  body: Body,
  bodyName: string,
  observer: Observer,
  now: ReturnType<typeof MakeTime>,
  maxDays: number,
): CelestialStatus | null {
  // Step 1: Find the four surrounding events
  const prevRise = findPrevEvent(body, observer, +1, now, maxDays);
  const prevSet = findPrevEvent(body, observer, -1, now, maxDays);
  const nextRise = findNextEvent(body, observer, +1, now, maxDays);
  const nextSet = findNextEvent(body, observer, -1, now, maxDays);

  // Step 2: Determine state
  const state = determineHorizonState(prevRise, prevSet);
  if (state === null) return null;

  // Step 3: Compute elongation (skip for Moon)
  let elongation: number | null = null;
  let visNote = "";

  if (bodyName !== "Moon") {
    try {
      const elongResult = Elongation(body, now.date);
      elongation = elongResult.elongation;
      visNote = assessVisibility(bodyName, elongation);
    } catch {
      visNote = "Elongation data unavailable";
    }
  } else {
    visNote = "Visible when above horizon at night";
  }

  // Step 4: Build output based on state
  const nowMs = now.date.getTime();

  if (state === "ABOVE") {
    if (!prevRise || !nextSet) return null;

    const pastMs = nowMs - prevRise.date.getTime();
    const futureMs = nextSet.date.getTime() - nowMs;

    return {
      body: bodyName,
      state,
      pastEvent: { timestamp: prevRise.date, type: "RISE" },
      futureEvent: { timestamp: nextSet.date, type: "SET" },
      pastDuration: pastMs,
      futureDuration: futureMs,
      pastLabel: `${formatDuration(pastMs)} ago`,
      futureLabel: `in ${formatDuration(futureMs)}`,
      elongation,
      visibilityNote: visNote,
    };
  }

  // BELOW
  if (!prevSet || !nextRise) return null;

  const pastMs = nowMs - prevSet.date.getTime();
  const futureMs = nextRise.date.getTime() - nowMs;

  return {
    body: bodyName,
    state,
    pastEvent: { timestamp: prevSet.date, type: "SET" },
    futureEvent: { timestamp: nextRise.date, type: "RISE" },
    pastDuration: pastMs,
    futureDuration: futureMs,
    pastLabel: `${formatDuration(pastMs)} ago`,
    futureLabel: `in ${formatDuration(futureMs)}`,
    elongation,
    visibilityNote: visNote,
  };
}

/* ─── Orchestrator: All Bodies (Spec Section 10) ─── */

export function getAllCelestialStatus(
  latitude: number,
  longitude: number,
): CelestialStatus[] {
  const observer = new Observer(latitude, longitude, 0);
  const now = MakeTime(new Date());
  const maxDays = getSearchWindow(latitude);
  const results: CelestialStatus[] = [];

  for (const entry of PLANET_MAP) {
    const status = getBodyStatus(
      entry.body,
      entry.name,
      observer,
      now,
      maxDays,
    );

    if (status !== null) {
      results.push(status);
    } else {
      // Fallback indeterminate entry
      results.push({
        body: entry.name,
        state: null,
        pastEvent: null,
        futureEvent: null,
        pastDuration: null,
        futureDuration: null,
        pastLabel: `No recent ${entry.name} set/rise found`,
        futureLabel: `No upcoming ${entry.name} rise/set within ${maxDays} days`,
        elongation: null,
        visibilityNote: "Circumpolar or extended period — expand search window",
      });
    }
  }

  return results;
}

/**
 * Recalculate only the duration labels without re-querying the library.
 * Cheap enough to run every 60 seconds.
 */
export function refreshLabels(statuses: CelestialStatus[]): CelestialStatus[] {
  const nowMs = Date.now();

  return statuses.map((s) => {
    const pastMs =
      s.pastEvent !== null ? nowMs - s.pastEvent.timestamp.getTime() : null;
    const futureMs =
      s.futureEvent !== null ? s.futureEvent.timestamp.getTime() - nowMs : null;

    let pastLabel = s.pastLabel;
    let futureLabel = s.futureLabel;

    if (pastMs !== null) {
      pastLabel = `${formatDuration(pastMs)} ago`;
    }
    if (futureMs !== null) {
      futureLabel = `in ${formatDuration(Math.max(0, futureMs))}`;
    }

    return {
      ...s,
      pastDuration: pastMs,
      futureDuration: futureMs,
      pastLabel,
      futureLabel,
    };
  });
}
