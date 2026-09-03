import { useContext, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { Layers } from "lucide-react";
import { LocationContext } from "@/context/LocationContext";
import { ResultType } from "@/schema/location";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Bundled marker icons — no external CDN, works offline/CSP
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

/** Flies the map to new coordinates when they change */
function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [map, center, zoom]);
  return null;
}

export default function LocationMap() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };
  const [activeTile, setActiveTile] = useState<TileKey>("Street");
  const [showPicker, setShowPicker] = useState(false);

  const { latitude, longitude, name, admin1: state, country } = location;
  const center: [number, number] = [latitude, longitude];
  const zoom = 12;
  const tile = TILE_LAYERS[activeTile];

  return (
    <div className="bg-base-200 overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <h3 className="text-base-content text-lg font-semibold tracking-tight">
          Location
        </h3>
      </div>
      <div className="px-3 pb-3">
        <div
          className="relative overflow-hidden rounded-lg"
          style={{ height: 350 }}
        >
          <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            zoomControl={false}
            attributionControl={false}
            aria-label={`Map showing ${name}`}
            style={{ height: "100%", width: "100%" }}
          >
            <ChangeView center={center} zoom={zoom} />
            <ZoomControl position="bottomright" />
            <TileLayer
              key={activeTile}
              url={tile.url}
              attribution={tile.attribution}
            />
            <Marker position={center} icon={defaultIcon}>
              <Popup>
                <span className="font-semibold">{name}</span>
                {state && `, ${state}`}
                {country && ` — ${country}`}
              </Popup>
            </Marker>
          </MapContainer>

          {/* Tile Layer Switcher — below SearchBox dropdown (z-[1001]) */}
          <div className="absolute top-2 left-2 z-[400]">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="btn btn-sm shadow-lg backdrop-blur-sm"
            >
              <Layers className="size-3.5" />
              {activeTile}
            </button>
            {showPicker && (
              <ul className="menu menu-sm bg-base-300 rounded-box mt-1 shadow-xl border border-base-content/15 w-32">
                {(Object.keys(TILE_LAYERS) as TileKey[]).map((key) => (
                  <li key={key}>
                    <button
                      onClick={() => {
                        setActiveTile(key);
                        setShowPicker(false);
                      }}
                      className={key === activeTile ? "menu-active" : ""}
                    >
                      {key}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
