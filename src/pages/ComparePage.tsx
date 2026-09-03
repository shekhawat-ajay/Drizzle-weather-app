import { useSearchParams, Link } from "react-router";
import { useContext } from "react";
import useFavorites from "@/hooks/useFavorites";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
import useDailyForecast from "@/hooks/weather/useDailyForecast";
import { weatherImageMap } from "@/utils/maps/weatherImageMap";
import { useUnits } from "@/context/UnitsContext";
import { convertTemp, tempUnit } from "@/utils/unitConversions";
import type { ResultType } from "@/schema/location";

function CompareCard({ loc }: { loc: ResultType }) {
  const { units } = useUnits();
  const { data } = useCurrentWeather(loc.latitude, loc.longitude);
  const { data: daily } = useDailyForecast(loc.latitude, loc.longitude);
  const w = data?.current;
  const img = w ? weatherImageMap[`${w.weatherCode}${w.isDay ? "d" : "n"}`] : null;
  const idx = daily?.daily?.time ? 1 : 0;
  const max = daily?.daily?.apparentTemperatureMax?.[idx];
  const min = daily?.daily?.apparentTemperatureMin?.[idx];
  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <h3 className="font-semibold">{loc.name}<span className="text-base-content/50 font-normal">, {loc.admin1}</span></h3>
      <p className="text-base-content/50 text-xs">{loc.country}</p>
      <div className="mt-3 flex items-center gap-4">
        {img ? <img src={img.imageSrc} alt={img.description} className="size-14" loading="lazy" /> : null}
        <div>
          <p className="text-3xl font-bold">{w ? Math.round(convertTemp(w.temperature2M, units) ?? 0) : "--"}{tempUnit(units)}</p>
          <p className="text-base-content/60 text-xs">{img?.description ?? "--"}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-xs">
        <span className="font-mono">H {max != null ? Math.round(convertTemp(max, units) ?? 0) : "--"}{tempUnit(units)}</span>
        <span className="font-mono">L {min != null ? Math.round(convertTemp(min, units) ?? 0) : "--"}{tempUnit(units)}</span>
        <span className="text-base-content/50">Humidity {w?.relativeHumidity2M ?? "--"}%</span>
      </div>
      <p className="text-base-content/40 text-[10px] mt-2">Wind {w?.windSpeed10M ?? "--"} km/h · UV {w?.uvIndex?.toFixed(1) ?? "--"}</p>
    </div>
  );
}

export default function ComparePage() {
  const [params] = useSearchParams();
  const { favs } = useFavorites();
  const idsParam = params.get("ids");
  let selected: ResultType[] = [];
  if (idsParam) {
    const ids = idsParam.split(",").map(Number);
    selected = favs.filter((f) => ids.includes(f.id)).slice(0, 2);
  }
  if (selected.length === 0) selected = favs.slice(0, 2);

  if (favs.length < 2) {
    return (
      <div className="card border border-base-content/5 bg-base-200 p-8 text-center items-center">
        <p className="text-base-content/60 text-sm">Add at least 2 favorites to compare.</p>
        <p className="text-base-content/40 text-xs mt-1">Star cities from the current weather card.</p>
        <Link to="/" className="btn btn-sm btn-primary mt-4">Back to Weather</Link>
      </div>
    );
  }

  if (selected.length < 2) {
    return (
      <div className="card border border-base-content/5 bg-base-200 p-8 text-center items-center">
        <p className="text-base-content/60 text-sm">Select 2 favorites to compare.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {favs.map((f) => (
            <Link key={f.id} to={`/compare?ids=${selected[0]?.id ? `${selected[0].id},${f.id}` : `${f.id}`}`} className="badge badge-outline">
              {f.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Compare</h2>
        <Link to="/" className="text-xs text-primary hover:underline">Back</Link>
      </div>
      {selected.map((loc) => (
        <div key={loc.id} className="col-span-12 md:col-span-6">
          <CompareCard loc={loc} />
        </div>
      ))}
      <div className="col-span-12 flex flex-wrap gap-2">
        <span className="text-base-content/40 text-xs uppercase tracking-wider">Favorites:</span>
        {favs.map((f) => (
          <Link
            key={f.id}
            to={`/compare?ids=${selected.map((s) => s.id).join(",").replace(selected[0]!.id.toString(), f.id.toString())}`}
            className="badge badge-sm"
          >
            {f.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
