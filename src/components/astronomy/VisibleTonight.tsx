import { useMemo } from "react";
import { Link } from "react-router";
import { Eye } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import CelestialIcon from "@/components/astronomy/CelestialIcon";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import type { AstronomyData } from "@/types/astronomy";
import type { CelestialStatus } from "@/types/celestial";

interface VisibleTonightProps {
  astronomyData: AstronomyData;
  celestialData: CelestialStatus[];
  timezone?: string;
}

const TWELVE_H_MS = 12 * 3600_000;

/**
 * What's up tonight — naked-eye filter over existing celestial + planet data.
 * Rule: mag <= 6 (naked eye) AND (above now OR rises within 12h)
 * AND not lost in sun glare (elongation >= 15° unless already above).
 */
export default function VisibleTonight({ astronomyData, celestialData, timezone }: VisibleTonightProps) {
  void timezone;
  const items = useMemo(() => {
    const magByName = new Map(astronomyData.planets.map((p) => [p.name, p.magnitude]));
    return celestialData
      .filter((c) => {
        const mag = magByName.get(c.body);
        if (mag == null || mag > 6) return false;
        const upNow = c.state === "ABOVE";
        const risesSoon =
          c.futureEvent?.type === "RISE" && (c.futureDuration ?? Infinity) <= TWELVE_H_MS;
        if (!upNow && !risesSoon) return false;
        if (!upNow && c.elongation != null && c.elongation < 15) return false;
        return true;
      })
      .map((c) => ({
        status: c,
        mag: magByName.get(c.body) as number,
        upNow: c.state === "ABOVE",
      }))
      .sort((a, b) => a.mag - b.mag);
  }, [astronomyData.planets, celestialData]);

  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <SectionHeader icon={Eye} label="Visible tonight — naked eye" color="text-primary" />
      {items.length === 0 ? (
        <p className="text-base-content/50 text-sm">
          No naked-eye planets tonight — try the Moon &amp; ISS.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map(({ status, mag, upNow }) => (
            <Link
              key={status.body}
              to={`/astronomy/${status.body.toLowerCase()}`}
              className={`card border p-4 transition-colors hover:bg-base-200 ${
                upNow ? "bg-primary/10 border-primary/20" : "bg-base-300 border-base-content/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <CelestialIcon name={status.body} size={18} className="text-primary/80" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">{status.body}</p>
                  <p className="text-base-content/50 font-mono text-xs">mag {mag.toFixed(1)}</p>
                </div>
                <span
                  className={`ml-auto badge badge-xs shrink-0 ${upNow ? "badge-primary" : "badge-ghost"}`}
                >
                  {upNow ? "Up now" : "Rises soon"}
                </span>
              </div>
              <p className="text-base-content/50 mt-2 line-clamp-2 text-xs leading-relaxed">
                {status.visibilityNote || status.futureLabel}
              </p>
              <div className="mt-2">
                {upNow ? (
                  status.futureEvent?.timestamp ? (
                    <CountdownBadge
                      target={status.futureEvent.timestamp}
                      label={status.futureEvent.type === "SET" ? "Sets" : "Rises"}
                      className="badge-primary"
                    />
                  ) : null
                ) : status.futureEvent?.timestamp ? (
                  <CountdownBadge
                    target={status.futureEvent.timestamp}
                    label="Rises"
                    className="badge-ghost"
                  />
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
