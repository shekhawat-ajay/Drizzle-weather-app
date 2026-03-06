/**
 * useCelestial — React hook for celestial rise/set tracking
 *
 * Provides CelestialStatus[] for 7 planets with live-updating
 * duration labels (60s), periodic full recompute (30min),
 * and event-boundary scheduling (recomputes when the nearest future event occurs).
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { getAllCelestialStatus, refreshLabels } from "@/utils/celestial";
import type { CelestialStatus } from "@/types/celestial";

const LABEL_REFRESH_MS = 60_000; // 60 seconds
const FULL_RECOMPUTE_MS = 30 * 60_000; // 30 minutes

export default function useCelestial(
  latitude: number,
  longitude: number,
): CelestialStatus[] {
  // Initial compute
  const initial = useMemo(
    () => getAllCelestialStatus(latitude, longitude),
    [latitude, longitude],
  );

  const [statuses, setStatuses] = useState<CelestialStatus[]>(initial);
  const boundaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset on location change
    const fresh = getAllCelestialStatus(latitude, longitude);
    setStatuses(fresh);

    // ── Tier 1: 60s label refresh (cheap — no library calls) ──
    const labelTimer = setInterval(() => {
      setStatuses((prev) => refreshLabels(prev));
    }, LABEL_REFRESH_MS);

    // ── Tier 3: 30-minute full recompute (safety net) ──
    const recomputeTimer = setInterval(() => {
      setStatuses(getAllCelestialStatus(latitude, longitude));
    }, FULL_RECOMPUTE_MS);

    // ── Event-boundary scheduling ──
    // Schedule a full recompute 1 minute after the nearest future event
    // so state flips immediately when a planet rises/sets
    function scheduleEventBoundary(data: CelestialStatus[]) {
      // Clear any previous boundary timer
      if (boundaryTimerRef.current) {
        clearTimeout(boundaryTimerRef.current);
        boundaryTimerRef.current = null;
      }

      const now = Date.now();
      let nearest = Infinity;

      for (const s of data) {
        if (s.futureEvent) {
          const eventMs = s.futureEvent.timestamp.getTime();
          if (eventMs > now && eventMs < nearest) {
            nearest = eventMs;
          }
        }
      }

      if (nearest !== Infinity) {
        // Recompute 60s after the event passes (to be sure it's in the past)
        const delayMs = nearest - now + 60_000;
        boundaryTimerRef.current = setTimeout(() => {
          const updated = getAllCelestialStatus(latitude, longitude);
          setStatuses(updated);
          // Re-schedule for the next nearest event
          scheduleEventBoundary(updated);
        }, delayMs);
      }
    }

    scheduleEventBoundary(fresh);

    return () => {
      clearInterval(labelTimer);
      clearInterval(recomputeTimer);
      if (boundaryTimerRef.current) {
        clearTimeout(boundaryTimerRef.current);
      }
    };
  }, [latitude, longitude]);

  return statuses;
}
