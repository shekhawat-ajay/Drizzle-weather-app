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

export default function ISSPassPrediction({ latitude, longitude, timezone }: { latitude: number; longitude: number; timezone?: string }) {
  const roundedNow = Math.floor(Date.now() / 60000) * 60;
  const timestamps = useMemo(() => {
    // next 6 hours, every 5 minutes = 72 points (finer for pass detection)
    return Array.from({ length: 72 }, (_, i) => roundedNow + (i + 1) * 300);
  }, [roundedNow]);

  const { data } = useSWR<ISSData[] | { message?: string }>(
    apiRoutes.issPositions(timestamps),
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false }
  );

  const pass = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return null;
    // Find first window where distance < 1200km for at least 2 consecutive points
    const VIS_RADIUS = 1200;
    let best: { start: ISSData; end: ISSData; minDist: number } | null = null;
    let windowStart: ISSData | null = null;
    let windowEnd: ISSData | null = null;
    let minDist = Infinity;
    for (const p of data as ISSData[]) {
      const dist = haversineKm(latitude, longitude, p.latitude, p.longitude);
      if (dist < VIS_RADIUS) {
        if (!windowStart) windowStart = p;
        windowEnd = p;
        if (dist < minDist) minDist = dist;
      } else if (windowStart && windowEnd) {
        // close window if gap > 15 min? just take first window
        best = { start: windowStart, end: windowEnd, minDist };
        break;
      }
    }
    if (!best && windowStart && windowEnd) {
      best = { start: windowStart, end: windowEnd, minDist };
    }
    if (!best) return null;
    return best;
  }, [data, latitude, longitude]);

  if (!pass) {
    return (
      <div className="rounded-xl border border-base-content/5 bg-base-200 p-4">
        <div className="flex items-center gap-2 text-base-content/50">
          <Clock size={14} />
          <span className="text-xs font-medium uppercase tracking-wider">Next Pass</span>
        </div>
        <p className="text-base-content/40 text-sm mt-2">No overhead pass within next 6 hours for this location.</p>
        <p className="text-base-content/30 text-xs mt-1">ISS orbit shifts ~22.5° per 90 min — try again later.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/15 bg-base-300 p-4">
      <div className="flex items-center gap-2 text-primary">
        <Eye size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">Next Overhead Pass</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-base-content/50 text-xs">Rises (visible)</p>
          <p className="font-mono font-semibold">{fmtTime(new Date(pass.start.timestamp * 1000), timezone)}</p>
        </div>
        <div>
          <p className="text-base-content/50 text-xs">Ends</p>
          <p className="font-mono font-semibold">{fmtTime(new Date(pass.end.timestamp * 1000), timezone)}</p>
        </div>
        <div>
          <p className="text-base-content/50 text-xs">Closest distance</p>
          <p className="font-mono font-semibold">{Math.round(pass.minDist)} km</p>
        </div>
        <div>
          <p className="text-base-content/50 text-xs">Duration</p>
          <p className="font-mono font-semibold">{Math.round((pass.end.timestamp - pass.start.timestamp) / 60)} min</p>
        </div>
      </div>
      <p className="text-base-content/40 text-xs mt-2">Within 1200 km ground distance — may be visible if night and clear at your location.</p>
    </div>
  );
}
