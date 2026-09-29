import { useEffect, useState } from "react";
import type { SkyConstellation, SkyDso, SkyStar } from "./types";

interface SkyCatalog {
  bright: SkyStar[];
  full: SkyStar[] | null;
  dso: SkyDso[];
  constellations: SkyConstellation[];
  loading: boolean;
  error: string | null;
}

export default function useSkyCatalog(): SkyCatalog {
  const [bright, setBright] = useState<SkyStar[]>([]);
  const [full, setFull] = useState<SkyStar[] | null>(null);
  const [dso, setDso] = useState<SkyDso[]>([]);
  const [constellations, setConstellations] = useState<SkyConstellation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [b, d, c] = await Promise.all([
          fetch(
            `${import.meta.env.BASE_URL}data/skymap/stars.bright.json`,
          ).then((r) => {
            if (!r.ok) throw new Error(`stars.bright ${r.status}`);
            return r.json();
          }),
          fetch(`${import.meta.env.BASE_URL}data/skymap/dso.json`).then((r) => {
            if (!r.ok) throw new Error(`dso ${r.status}`);
            return r.json();
          }),
          fetch(
            `${import.meta.env.BASE_URL}data/skymap/constellations.json`,
          ).then((r) => {
            if (!r.ok) throw new Error(`constellations ${r.status}`);
            return r.json();
          }),
        ]);
        if (cancelled) return;
        setBright(b as SkyStar[]);
        setDso(d as SkyDso[]);
        setConstellations(
          (c as { constellations: SkyConstellation[] }).constellations ?? [],
        );
        // Stream the full catalog after first paint (tiered loading).
        fetch(`${import.meta.env.BASE_URL}data/skymap/stars.full.json`)
          .then((r) => (r.ok ? r.json() : null))
          .then((f) => {
            if (!cancelled && f) setFull(f as SkyStar[]);
          })
          .catch(() => undefined);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "catalog load failed");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    bright,
    full,
    dso,
    constellations,
    loading: bright.length === 0 && !error,
    error,
  };
}
