import { use, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { Telescope } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import { LocationContext } from "@/context/LocationContext";
import type { ResultType } from "@/schema/location";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";
import useSkyCatalog from "@/features/skymap/useSkyCatalog";
import SkyMapView from "@/features/skymap/SkyMapView";
import {
  calcMoonPosition,
  calcPlanetData,
  calcSunPosition,
} from "@/utils/astronomy";

function useNowTick(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function SkyMapPage() {
  const outlet = useOutletContext<AstronomyOutletContext>();
  const { location } = use(LocationContext) as unknown as {
    location: ResultType;
  };
  const loc = outlet?.location ?? location;
  const now = useNowTick();
  const { bright, full, dso, constellations, loading, error } = useSkyCatalog();
  const stars = full ?? bright;

  const bodies = useMemo(() => {
    try {
      const elevM = outlet?.elevationM ?? 0;
      const sun = calcSunPosition(loc.latitude, loc.longitude, now, elevM);
      const moon = calcMoonPosition(loc.latitude, loc.longitude, now, elevM);
      const planets = calcPlanetData(
        loc.latitude,
        loc.longitude,
        now,
        now,
        elevM,
      ).map((p) => ({
        name: p.name,
        alt: p.altitude,
        az: p.azimuth,
      }));
      return {
        sun: { alt: sun.altitude, az: sun.azimuth },
        moon: { alt: moon.altitude, az: moon.azimuth },
        planets,
      };
    } catch {
      return {
        sun: null,
        moon: null,
        planets: [] as Array<{ name: string; alt: number; az: number }>,
      };
    }
  }, [loc.latitude, loc.longitude, now, outlet?.elevationM]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <div className="card border-base-content/5 bg-base-200 border p-5">
          <SectionHeader
            icon={Telescope}
            label="Sky Map — live sky"
            color="text-primary"
          />
          <p className="text-base-content/50 mb-4 text-xs">
            {loading
              ? "Loading catalog…"
              : error
                ? `Catalog failed to load: ${error}`
                : `${stars.length} stars · ${dso.length} deep-sky objects · ${constellations.length} constellations · for ${loc.name}`}
          </p>
          {!loading && !error && (
            <SkyMapView
              stars={stars}
              constellations={constellations}
              dso={dso}
              planets={bodies.planets}
              sun={bodies.sun}
              moon={bodies.moon}
              latitude={loc.latitude}
              longitude={loc.longitude}
              now={now}
            />
          )}
          <div className="text-base-content/50 mt-3 flex flex-wrap justify-center gap-2 text-[10px]">
            <span className="badge badge-xs badge-ghost">● stars</span>
            <span className="badge badge-xs badge-ghost">— figures</span>
            <span className="badge badge-xs badge-ghost">◇ DSO</span>
            <span className="badge badge-xs badge-ghost">● planets</span>
          </div>
          <p className="text-base-content/40 mt-3 text-[11px] leading-relaxed">
            Slice 2: constellation figures + planets/Sun/Moon (astronomy-engine,
            same source as the rest of the app) + DSO markers. Next: sensor
            pointing, then search.
          </p>
        </div>
      </div>
    </div>
  );
}
