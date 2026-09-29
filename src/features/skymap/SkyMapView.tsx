import { useEffect, useMemo, useRef, useState } from "react";
import { raDecToAltAz } from "./skyMath";
import type { SkyConstellation, SkyDso, SkyStar } from "./types";

export interface SkyPlanet {
  name: string;
  alt: number;
  az: number;
}

interface SkyMapViewProps {
  stars: SkyStar[];
  constellations: SkyConstellation[];
  dso: SkyDso[];
  planets: SkyPlanet[];
  sun: { alt: number; az: number } | null;
  moon: { alt: number; az: number } | null;
  latitude: number;
  longitude: number;
  now: Date;
}

function shortConstellationName(id: string): string {
  const tail = id.split("/").pop() ?? id;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

// Zenith-centered polar view: radius = (90 - alt) / 90, angle = az.
// Amber-on-slate to preserve night vision; canvas only, no WebGL yet.
export default function SkyMapView({
  stars,
  constellations,
  dso,
  planets,
  sun,
  moon,
  latitude,
  longitude,
  now,
}: SkyMapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [azOffset, setAzOffset] = useState(0);
  const dragRef = useRef<{ x: number; az: number } | null>(null);

  const points = useMemo(() => {
    return stars
      .map((s) => ({
        s,
        ...raDecToAltAz(s.ra, s.dec, now, latitude, longitude),
      }))
      .filter((p) => p.alt > 0);
  }, [stars, now, latitude, longitude]);

  const figures = useMemo(() => {
    return constellations
      .map((c) => {
        const label = raDecToAltAz(
          c.label_ra,
          c.label_dec,
          now,
          latitude,
          longitude,
        );
        const strokes = c.strokes.map((stroke) =>
          stroke
            .map(([ra, dec]) => raDecToAltAz(ra, dec, now, latitude, longitude))
            .filter((p) => p.alt > 0),
        );
        return { c, label, strokes };
      })
      .filter((f) => f.label.alt > 0 || f.strokes.some((s) => s.length > 1));
  }, [constellations, now, latitude, longitude]);

  const dsoPoints = useMemo(() => {
    return dso
      .map((d) => ({
        d,
        ...raDecToAltAz(d.ra, d.dec, now, latitude, longitude),
      }))
      .filter((p) => p.alt > 0);
  }, [dso, now, latitude, longitude]);

  const visiblePlanets = useMemo(
    () => planets.filter((p) => p.alt > 0),
    [planets],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth || 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 12;

    // Horizon circle + cardinal labels
    ctx.strokeStyle = "rgba(251,191,36,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(251,191,36,0.6)";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    const cardinals: Array<[string, number]> = [
      ["N", 0],
      ["E", 90],
      ["S", 180],
      ["W", 270],
    ];
    for (const [label, az] of cardinals) {
      const a = ((az + azOffset - 90) * Math.PI) / 180;
      ctx.fillText(
        label,
        cx + Math.cos(a) * (R + 8),
        cy + Math.sin(a) * (R + 8) + 3,
      );
    }

    const project = (alt: number, az: number): [number, number] => {
      const r = ((90 - alt) / 90) * R;
      const a = ((az + azOffset - 90) * Math.PI) / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };

    // Constellation stick figures (dim slate, behind stars)
    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.lineWidth = 1;
    for (const f of figures) {
      for (const stroke of f.strokes) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        stroke.forEach((p, i) => {
          const [x, y] = project(p.alt, p.az);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      if (f.label.alt > 12) {
        const [x, y] = project(f.label.alt, f.label.az);
        ctx.fillStyle = "rgba(148,163,184,0.7)";
        ctx.font = "9px DM Sans, sans-serif";
        ctx.fillText(shortConstellationName(f.c.id), x, y - 5);
      }
    }

    for (const p of points) {
      const [x, y] = project(p.alt, p.az);
      const sizePx =
        p.s.mag <= 1 ? 2.4 : p.s.mag <= 2 ? 1.9 : p.s.mag <= 3 ? 1.4 : 1.0;
      const alpha = p.s.mag <= 2 ? 0.95 : p.s.mag <= 3 ? 0.8 : 0.6;
      ctx.fillStyle = `rgba(253,230,138,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, sizePx, 0, Math.PI * 2);
      ctx.fill();
      if (p.s.mag <= 1.2 && p.s.name) {
        ctx.fillStyle = "rgba(253,230,138,0.75)";
        ctx.font = "9px DM Sans, sans-serif";
        ctx.fillText(p.s.name, x + 5, y - 4);
      }
    }

    // Deep-sky objects: small violet diamonds
    for (const p of dsoPoints) {
      const [x, y] = project(p.alt, p.az);
      ctx.strokeStyle = "rgba(167,139,250,0.85)";
      ctx.lineWidth = 1;
      const s = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      ctx.stroke();
      if ((p.d.mag ?? 99) <= 6 && p.d.desig) {
        ctx.fillStyle = "rgba(167,139,250,0.7)";
        ctx.font = "8px JetBrains Mono, monospace";
        ctx.fillText(p.d.desig, x + 5, y + 3);
      }
    }

    // Planets: amber discs with labels
    for (const p of visiblePlanets) {
      const [x, y] = project(p.alt, p.az);
      ctx.fillStyle = "rgba(251,191,36,1)";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.font = "bold 7px DM Sans, sans-serif";
      ctx.fillText(p.name.charAt(0), x - 2.5, y + 2.5);
      ctx.fillStyle = "rgba(251,191,36,0.9)";
      ctx.font = "9px DM Sans, sans-serif";
      ctx.fillText(p.name, x + 7, y + 3);
    }

    if (sun && sun.alt > 0) {
      const [x, y] = project(sun.alt, sun.az);
      ctx.fillStyle = "rgba(251,191,36,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(251,191,36,0.9)";
      ctx.font = "9px DM Sans, sans-serif";
      ctx.fillText("Sun", x + 10, y + 3);
    }
    if (moon && moon.alt > 0) {
      const [x, y] = project(moon.alt, moon.az);
      ctx.fillStyle = "rgba(226,232,240,0.95)";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.font = "9px DM Sans, sans-serif";
      ctx.fillText("Moon", x + 8, y + 3);
    }
  }, [points, figures, dsoPoints, visiblePlanets, sun, moon, azOffset]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="mx-auto aspect-square w-full max-w-md cursor-grab touch-none rounded-xl border border-amber-200/10 bg-slate-950 active:cursor-grabbing"
        style={{ minHeight: 280 }}
        role="img"
        aria-label={`Sky map showing ${points.length} stars, ${dsoPoints.length} deep-sky objects and ${visiblePlanets.length} planets above the horizon. Drag to rotate.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setAzOffset((v) => v + 5);
          if (e.key === "ArrowRight") setAzOffset((v) => v - 5);
        }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          dragRef.current = { x: e.clientX, az: azOffset };
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          const dx = e.clientX - dragRef.current.x;
          setAzOffset(dragRef.current.az + dx * 0.4);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      />
      <p className="text-base-content/40 mt-2 text-center text-[11px]">
        {points.length} stars · {figures.length} figures · {dsoPoints.length}{" "}
        DSO · {visiblePlanets.length} planets above horizon · drag or arrow keys
        to rotate
      </p>
    </div>
  );
}
