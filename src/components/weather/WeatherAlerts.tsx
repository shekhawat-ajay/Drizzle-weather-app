import { useContext } from "react";
import { LocationContext } from "@/context/LocationContext";
import type { ResultType } from "@/schema/location";
import useDailyForecast from "@/hooks/weather/useDailyForecast";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
import { TriangleAlert, Wind, CloudRain, Sun } from "lucide-react";

export default function WeatherAlerts() {
  const { location } = useContext(LocationContext) as unknown as { location: ResultType };
  const { data: daily } = useDailyForecast(location.latitude, location.longitude);
  const { data: current } = useCurrentWeather(location.latitude, location.longitude);

  const alerts: { icon: React.ElementType; text: string; kind: "info" | "warning" | "error" }[] = [];

  const d = daily?.daily;
  if (d) {
    // find today index
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: location.timezone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const idx = d.time.indexOf(todayStr);
    const i = idx >= 0 ? idx : 1;
    const prob = d.precipitationProbabilityMax?.[i] ?? 0;
    const wind = d.windSpeed10mMax?.[i] ?? 0;
    const uv = d.uvIndexMax?.[i] ?? 0;
    const code = d.weatherCode?.[i] ?? 0;
    if (prob >= 70) alerts.push({ icon: CloudRain, text: `High rain chance ${prob}% today`, kind: "info" });
    if (wind >= 40) alerts.push({ icon: Wind, text: `Strong wind ${Math.round(wind)} km/h expected`, kind: "warning" });
    if (uv >= 8) alerts.push({ icon: Sun, text: `Very high UV index ${uv.toFixed(1)} — limit sun exposure`, kind: "warning" });
    if ([95, 96, 99].includes(code)) alerts.push({ icon: TriangleAlert, text: "Thunderstorm expected — stay indoors if possible", kind: "error" });
  }

  const w = current?.current;
  if (w && [95, 96, 99].includes(w.weatherCode) && !alerts.some(a => a.text.includes("Thunderstorm"))) {
    alerts.push({ icon: TriangleAlert, text: "Current thunderstorm activity", kind: "error" });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="grid gap-2 justify-items-center">
      {alerts.map(({ icon: Icon, text, kind }, idx) => (
        <div key={idx} role="alert" className={`alert alert-${kind} mx-auto w-full max-w-2xl text-sm`}>
          <span className="flex w-full items-center justify-center gap-2 text-center">
            <Icon size={16} className="shrink-0" />
            <span>{text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
