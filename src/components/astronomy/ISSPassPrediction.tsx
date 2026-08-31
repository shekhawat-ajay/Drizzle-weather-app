import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/api/apiDataFetcher";
import { apiRoutes } from "@/utils/api/apiRoutes";
import { fmtTime } from "@/utils/formatters";
import { Clock, Eye } from "lucide-react";
import { ISSData } from "@/hooks/useISS";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

type PassWindow = { start: ISSData; end: ISSData; minDist: number; maxElev: number; illuminated: boolean };

// 7-day passes: batched fetch (72 per request) for 7 days at 10-min steps = 1008 points → 14 batches via single SWR
function useISSPasses7Day(latitude: number, longitude: number) {
  const roundedNow = Math.floor(Date.now() / 60000) * 60;
  const allTimestamps = useMemo(() => {
    const pts = 7 * 24 * 6; // 7d * 24h * 6 per hour (10 min)
    return Array.from({ length: pts }, (_, i) => roundedNow + (i + 1) * 600);
  }, [roundedNow]);

  const { data, isLoading } = useSWR<ISSData[]>(
    `iss-7day-${roundedNow}-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
    async () => {
      const chunks: number[][] = [];
      for (let i = 0; i < allTimestamps.length; i += 72) chunks.push(allTimestamps.slice(i, i + 72));
      const batches = await Promise.all(chunks.map((b) => fetcher(apiRoutes.issPositions(b)) as Promise<ISSData[]>));
      return batches.flat();
    },
    { refreshInterval: 300000, revalidateOnFocus: false }
  );

  function elevDeg(distKm: number, altKm: number): number {
    const R = 6371;
    const c = distKm / R;
    const sinElev = ((R + altKm) * Math.cos(c) - R) / Math.sqrt((R + altKm) ** 2 + R * R - 2 * R * (R + altKm) * Math.cos(c));
    const elev = Math.asin(Math.max(-1, Math.min(1, sinElev))) * 180 / Math.PI;
    return Math.max(0, Math.round(elev));
  }

  const passes = useMemo<PassWindow[]>(() => {
    const arr = data ?? [];
    if (arr.length === 0) return [];
    const VIS_RADIUS = 1200;
    const wins: PassWindow[] = [];
    let winStart: ISSData | null = null;
    let winEnd: ISSData | null = null;
    let minDist = Infinity;
    let minAlt = 408;
    let illuminated = false;
    for (const p of arr) {
      const dist = haversineKm(latitude, longitude, p.latitude, p.longitude);
      if (dist < VIS_RADIUS) {
        if (!winStart) { winStart = p; minDist = dist; minAlt = p.altitude; illuminated = p.visibility !== "eclipsed"; }
        winEnd = p;
        if (dist < minDist) { minDist = dist; minAlt = p.altitude; illuminated = p.visibility !== "eclipsed"; }
      } else if (winStart && winEnd) {
        wins.push({ start: winStart, end: winEnd, minDist, maxElev: elevDeg(minDist, minAlt), illuminated });
        winStart = null; winEnd = null; minDist = Infinity;
        if (wins.length >= 7) break;
      }
    }
    if (winStart && winEnd && wins.length < 7) wins.push({ start: winStart, end: winEnd, minDist, maxElev: elevDeg(minDist, minAlt), illuminated });
    return wins;
  }, [data, latitude, longitude]);

  return { passes, isLoading };
}

export default function ISSPassPrediction({ latitude, longitude, timezone }: { latitude: number; longitude: number; timezone?: string }) {
  const { passes, isLoading } = useISSPasses7Day(latitude, longitude);

  if (isLoading && passes.length === 0) {
    return (
      <div className="rounded-xl border border-base-content/5 bg-base-200 p-4">
        <div className="flex items-center gap-2 text-base-content/50">
          <Clock size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Next Passes</span>
        </div>
        <div className="skeleton h-16 w-full mt-3" />
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div className="rounded-xl border border-base-content/5 bg-base-200 p-4">
        <div className="flex items-center gap-2 text-base-content/50">
          <Clock size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Next Passes — 7 days</span>
        </div>
        <p className="text-base-content/40 text-sm mt-2">No overhead pass within next 7 days for this location.</p>
        <p className="text-base-content/30 text-xs mt-1">Try a location with lower latitude.</p>
      </div>
    );
  }

  const next = passes[0]!;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/15 bg-base-300 p-4">
        <div className="flex items-center gap-2 text-primary">
          <Eye size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Next Overhead Pass</span>
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-base-content/50 text-xs">Rises</p>
            <p className="font-mono font-semibold">{fmtTime(new Date(next.start.timestamp * 1000), timezone)}</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Ends</p>
            <p className="font-mono font-semibold">{fmtTime(new Date(next.end.timestamp * 1000), timezone)}</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Closest</p>
            <p className="font-mono font-semibold">{Math.round(next.minDist)} km</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Duration</p>
            <p className="font-mono font-semibold">{Math.round((next.end.timestamp - next.start.timestamp) / 60)} min</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Max Elev</p>
            <p className="font-mono font-semibold">{next.maxElev}°</p>
          </div>
          <div>
            <p className="text-base-content/50 text-xs">Illuminated</p>
            <p className={`text-xs font-medium ${next.illuminated ? "text-primary" : "text-base-content/40"}`}>{next.illuminated ? "Sunlit" : "Eclipsed"}</p>
          </div>
        </div>
        <p className="text-base-content/40 text-xs mt-2">1200 km radius — {next.illuminated ? "ISS sunlit, visible if your sky is dark & clear." : "ISS in Earth's shadow — not visible even if overhead."} Elevation {next.maxElev}° from horizon.</p>
      </div>

      {/* 7-day table */}
      <div className="rounded-xl border border-base-content/5 bg-base-200 p-4">
        <p className="text-base-content/50 text-xs font-medium uppercase tracking-wider mb-2">Passes — next 7 days</p>
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr className="text-base-content/40 text-[10px] uppercase">
                <th>#</th><th>Start</th><th>End</th><th>Closest</th><th>Elev</th><th>Lit</th><th>Dur</th>
              </tr>
            </thead>
            <tbody>
              {passes.map((p, idx) => (
                <tr key={p.start.timestamp} className={idx === 0 ? "font-semibold bg-primary/5" : ""}>
                  <td>{idx + 1}</td>
                  <td className="font-mono">{fmtTime(new Date(p.start.timestamp * 1000), timezone)}</td>
                  <td className="font-mono">{fmtTime(new Date(p.end.timestamp * 1000), timezone)}</td>
                  <td>{Math.round(p.minDist)} km</td>
                  <td>{p.maxElev}°</td>
                  <td className={p.illuminated ? "text-primary" : "text-base-content/40"}>{p.illuminated ? "yes" : "no"}</td>
                  <td>{Math.round((p.end.timestamp - p.start.timestamp) / 60)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base-content/30 text-[10px] mt-2">Elev = max altitude above horizon at closest approach; Lit = ISS sunlit. Visible only if Lit=yes and your local time is night.</p>
      </div>
    </div>
  );
}
