import { useState } from "react";
import { 
  Satellite, 
  Map as MapIcon, 
  Zap, 
  Navigation, 
  Eye,
  ArrowUpRight,
  Layers
} from "lucide-react";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  Polyline,
  ZoomControl 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import useISS, { useISSTrajectory } from "@/hooks/useISS";

const TILE_LAYERS = {
  Street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  Satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  Terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  Dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
} as const;

type TileKey = keyof typeof TILE_LAYERS;

/* ── Leaflet Icon Fix (React strips defaults) ── */
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const satelliteIcon = new L.Icon({
  iconUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const DEFAULT_CENTER: [number, number] = [0, 0];
const MAP_ZOOM = 3;

/* ── MapRecenter: smoothly follows the ISS ── */
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

/* ── Error State ── */
function ISSError() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
      <Satellite className="h-12 w-12 text-rose-500" />
      <div>
        <h3 className="text-lg font-semibold text-rose-400">Connection Failed</h3>
        <p className="text-base-content/60 text-sm">Unable to track the ISS right now. Please try again later.</p>
      </div>
    </div>
  );
}

/* ── Loading Overlay ── */
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="text-xs font-medium text-teal-400 uppercase tracking-widest">Acquiring Signal...</p>
      </div>
    </div>
  );
}

/* ── Live Signal Badge ── */
function LiveBadge() {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full bg-base-100/80 px-3 py-1.5 backdrop-blur-md border border-white/10">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
      </span>
      <span className="text-[10px] font-bold text-base-content/70 uppercase tracking-tighter">Live Telemetry</span>
    </div>
  );
}

/* ── Capitalize first letter ── */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Main Page ── */
export default function ISSPage() {
  const { data, error, isLoading } = useISS();
  const { points } = useISSTrajectory();
  const [activeTile, setActiveTile] = useState<TileKey>("Street");
  const [showPicker, setShowPicker] = useState(false);

  if (error) return <ISSError />;

  const tile = TILE_LAYERS[activeTile];

  const issPos: [number, number] = data
    ? [data.latitude, data.longitude]
    : DEFAULT_CENTER;

  // Split trajectory into segments if it crosses the Date Line
  const pathSegments: [number, number][][] = [];
  if (data && points.length > 0) {
    let currentSegment: [number, number][] = [[data.latitude, data.longitude]];
    const allPoints = points;

    for (let i = 0; i < allPoints.length; i++) {
      const prev = i === 0 ? data : allPoints[i - 1];
      const curr = allPoints[i]!;

      // If longitude jump is > 180, we crossed the date line
      if (Math.abs(curr.longitude - prev!.longitude) > 180) {
        pathSegments.push(currentSegment);
        currentSegment = [];
      }
      currentSegment.push([curr.latitude, curr.longitude]);
    }
    pathSegments.push(currentSegment);
  }

  return (
    <div className="space-y-4">
      <SectionHeader icon={Satellite} label="ISS Live Tracking" color="text-sky-400" />

      {/* ── Live Map ── */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-teal-500/20 bg-base-300 sm:h-[500px]">
        {isLoading && !data ? <LoadingOverlay /> : null}

        <MapContainer
          center={issPos}
          zoom={MAP_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="z-0"
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            key={activeTile}
            url={tile.url}
            attribution={tile.attribution}
          />
          {pathSegments.map((seg, idx) => (
            <Polyline
              key={idx}
              positions={seg}
              pathOptions={{
                color: "#0d9488", // Darker teal (teal-600)
                weight: 3,
                opacity: 0.8,
              }}
            />
          ))}
          {data ? (
            <>
              <Marker position={issPos} icon={satelliteIcon}>
                <Popup>
                  <div className="text-xs font-medium">
                    <p className="font-bold text-teal-600">ISS (Zarya)</p>
                    <p>Lat: {data.latitude.toFixed(4)}</p>
                    <p>Lon: {data.longitude.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
              <MapRecenter center={issPos} />
            </>
          ) : null}
        </MapContainer>

        {/* Tile Layer Switcher */}
        <div className="absolute top-4 left-4 z-[1000]">
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md border border-white/10 transition-colors hover:bg-black/80 uppercase tracking-tighter"
          >
            <Layers className="size-3.5" />
            {activeTile}
          </button>
          {showPicker ? (
            <div className="mt-1 overflow-hidden rounded-lg bg-black/70 shadow-xl backdrop-blur-sm border border-white/10">
              {(Object.keys(TILE_LAYERS) as TileKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTile(key);
                    setShowPicker(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-tighter transition-colors ${
                    key === activeTile
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <LiveBadge />
      </div>

      {/* ── Telemetry Grid ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <AstroCard
          icon={Navigation}
          title="Coordinates"
          value={data ? `${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°` : "--"}
          sub="Current ground track"
          accent="teal"
        />
        <AstroCard
          icon={ArrowUpRight}
          title="Altitude"
          value={data ? `${Math.round(data.altitude)} km` : "--"}
          sub="Above sea level"
          accent="cyan"
        />
        <AstroCard
          icon={Zap}
          title="Velocity"
          value={data ? `${Math.round(data.velocity).toLocaleString()} km/h` : "--"}
          sub="Orbital speed"
          accent="amber"
        />
        <AstroCard
          icon={Eye}
          title="Visibility"
          value={data ? capitalize(data.visibility) : "--"}
          sub="Current orbital phase"
          accent={data?.visibility === "eclipsed" ? "violet" : "amber"}
        />
      </div>

      {/* ── Mission Details ── */}
      <div className="bg-base-200/40 rounded-xl border border-teal-500/10 p-4">
        <div className="flex items-center gap-2 mb-3">
           <MapIcon className="h-4 w-4 text-teal-400" />
           <h4 className="text-sm font-semibold text-base-content">Mission Details</h4>
        </div>
        <p className="text-xs text-base-content/60 leading-relaxed">
          The International Space Station (ISS) is a modular space station in low Earth orbit. 
          It travels at a speed of about 28,000 km/h, orbiting the Earth approximately every 90 minutes. 
          The data shown above is actual real-time telemetry from the station.
        </p>
      </div>
    </div>
  );
}
