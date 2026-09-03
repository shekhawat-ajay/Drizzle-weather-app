import { useEffect, useState } from "react";
import { fmtTime, fmtShortDate } from "@/utils/formatters";
import { Clock, Eye, Satellite } from "lucide-react";
import { predictISSPasses, type ISSPass } from "@/utils/issPredict";

export default function ISSPassPrediction({ latitude, longitude, timezone }: { latitude: number; longitude: number; timezone?: string }) {
  const [passes, setPasses] = useState<ISSPass[] | null>(null);
  const [tleAge, setTleAge] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPasses(null);
    setError(null);
    predictISSPasses(latitude, longitude, 7, 60, 10)
      .then(({ passes, tleAge }) => {
        if (cancelled) return;
        setPasses(passes);
        setTleAge(tleAge);
      })
      .catch(() => {
        if (!cancelled) setError("Prediction failed — TLE unavailable. Check connection.");
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  if (error) {
    return (
      <div className="card border border-base-content/5 bg-base-200 p-4">
        <div className="flex items-center gap-2 text-base-content/50">
          <Satellite size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Passes — 7 days</span>
        </div>
        <p className="text-base-content/40 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (passes === null) {
    return (
      <div className="card border border-base-content/5 bg-base-200 p-4">
        <div className="flex items-center gap-2 text-base-content/50">
          <Clock size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Passes — 7 days</span>
        </div>
        <div className="skeleton h-16 w-full mt-3" />
        <p className="text-base-content/30 text-[10px] mt-2">Propagating orbit (SGP4)…</p>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div className="card border border-base-content/5 bg-base-200 p-4">
        <div className="flex items-center gap-2 text-base-content/50">
          <Clock size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Passes — 7 days</span>
        </div>
        <p className="text-base-content/40 text-sm mt-2">No passes above 10° elevation in the next 7 days.</p>
        <p className="text-base-content/30 text-xs mt-1">TLE {tleAge}. High-latitude locations see fewer passes.</p>
      </div>
    );
  }

  const next = passes[0]!;
  const visibleCount = passes.filter((p) => p.visible).length;

  return (
    <div className="space-y-3">
      <div className="card border border-primary/15 bg-base-300 p-4">
        <div className="flex items-center gap-2 text-primary">
          <Eye size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Next Pass</span>
          {next.visible ? (
            <span className="badge badge-xs badge-primary">Visible</span>
          ) : (
            <span className="badge badge-xs">Low / daylight</span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-base-content/50 text-xs">Rises</p>
            <p className="font-mono font-semibold">{fmtTime(new Date(next.startMs), timezone)}</p>
            <p className="text-base-content/50 text-xs">{fmtShortDate(new Date(next.startMs))}</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Ends</p>
            <p className="font-mono font-semibold">{fmtTime(new Date(next.endMs), timezone)}</p>
            <p className="text-base-content/50 text-xs">{fmtShortDate(new Date(next.endMs))}</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Max elev</p>
            <p className="font-mono font-semibold">{next.maxElevDeg}°</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Duration</p>
            <p className="font-mono font-semibold">{next.durationMin} min</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Closest</p>
            <p className="font-mono font-semibold">{next.closestKm} km</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Sky at peak</p>
            <p className="text-xs font-medium">{next.observerSunAlt < -12 ? "Night" : next.observerSunAlt < -6 ? "Twilight" : next.observerSunAlt < 0 ? "Dusk" : "Daylight"} ({next.observerSunAlt}°)</p>
          </div>
          <div className="col-span-2">
            <p className="text-base-content/50 text-xs">ISS sunlight</p>
            <p className={`text-xs font-medium ${next.issSunlit ? "text-primary" : "text-base-content/40"}`}>{next.issSunlit ? "Sunlit — reflects light" : "In Earth's shadow"}</p>
          </div>
        </div>
        <p className="text-base-content/40 text-xs mt-2">
          {next.visible
            ? "Look up! Dark sky + sunlit station = naked-eye visible."
            : next.issSunlit
              ? "Station sunlit but your sky is bright — try a night pass below."
              : "Station in Earth's shadow for this pass — not visible."}{" "}
          TLE {tleAge}.
        </p>
      </div>

      <div className="card border border-base-content/5 bg-base-200 p-4">
        <p className="text-base-content/50 text-xs font-medium uppercase tracking-wider mb-2">
          Passes — 7 days ({visibleCount} visible)
        </p>
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr className="text-base-content/40 text-[10px] uppercase">
                <th>#</th><th>Date</th><th>Start</th><th>End</th><th>Elev</th><th>Sky</th><th>ISS</th><th>Dur</th>
              </tr>
            </thead>
            <tbody>
              {passes.map((p, idx) => (
                <tr key={p.startMs} className={idx === 0 ? "font-semibold bg-primary/5" : p.visible ? "text-primary" : ""}>
                  <td>{idx + 1}</td>
                  <td className="whitespace-nowrap">{fmtShortDate(new Date(p.startMs))}</td>
                  <td className="font-mono">{fmtTime(new Date(p.startMs), timezone)}</td>
                  <td className="font-mono">{fmtTime(new Date(p.endMs), timezone)}</td>
                  <td>{p.maxElevDeg}°</td>
                  <td>{p.observerSunAlt < -12 ? "Night" : p.observerSunAlt < -6 ? "Twilight" : "Day"}</td>
                  <td className={p.issSunlit ? "text-primary" : "text-base-content/40"}>{p.issSunlit ? "lit" : "eclipse"}</td>
                  <td>{p.durationMin}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base-content/30 text-[10px] mt-2">SGP4 propagation from CelesTrak TLE · elev ≥10° · visible = dark sky + sunlit station.</p>
      </div>
    </div>
  );
}
