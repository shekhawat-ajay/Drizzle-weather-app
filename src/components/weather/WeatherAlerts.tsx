import { useContext, useMemo } from "react";
import { LocationContext } from "@/context/LocationContext";
import type { ResultType } from "@/schema/location";
import useDailyForecast from "@/hooks/weather/useDailyForecast";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import useAQI from "@/hooks/weather/useAQI";
import { useUnits } from "@/context/UnitsContext";
import { convertWindSpeed, speedUnit, convertPrecipitation, precipUnit } from "@/utils/unitConversions";
import { fmtTimeFromISO, getNowAsUTC, parseAsUTC } from "@/utils/formatters";
import {
  TriangleAlert,
  Wind,
  CloudRain,
  Sun,
  Eye,
  Droplets,
  Gauge,
  Thermometer,
  Sunrise,
  Sunset,
  Sparkles,
  CloudSun,
  Umbrella,
  Snowflake,
} from "lucide-react";

type AlertKind = "info" | "warning" | "error" | "success";
type AlertTag =
  | "storm" | "fog" | "rain" | "wind" | "snow" | "ice" | "drizzle"
  | "aqi" | "pressure" | "overcast" | "muggy" | "heat" | "cold"
  | "uv" | "swing" | "sun";
type Alert = { icon: React.ElementType; text: string; kind: AlertKind; priority: number; tag: AlertTag };

// Helpers to slice next N hours from hourly/minutely15
function hourlySliceNextHours(hourly: { time: string[]; [k: string]: unknown }, tz: string, hours: number) {
  const nowMs = getNowAsUTC(tz);
  const endMs = nowMs + hours * 3600_000;
  const indices: number[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    const ms = parseAsUTC(hourly.time[i]!).getTime();
    if (ms >= nowMs && ms <= endMs) indices.push(i);
    if (ms > endMs) break;
  }
  return indices;
}

function minutelySliceNextHours(minutely15: { time: string[] }, tz: string, hours: number) {
  const nowMs = getNowAsUTC(tz);
  const endMs = nowMs + hours * 3600_000;
  const indices: number[] = [];
  for (let i = 0; i < minutely15.time.length; i++) {
    const ms = parseAsUTC(minutely15.time[i]!).getTime();
    if (ms >= nowMs && ms <= endMs) indices.push(i);
    if (ms > endMs) break;
  }
  return indices;
}

/** NOAA Rothfusz heat index (°C in, °C out). Below 27°C returns air temp. */
function heatIndexC(tC: number, rh: number): number {
  if (tC < 27) return tC;
  const tF = tC * 9 / 5 + 32;
  let hiF =
    -42.379 + 2.04901523 * tF + 10.14333127 * rh
    - 0.22475541 * tF * rh - 0.00683783 * tF * tF
    - 0.05481717 * rh * rh + 0.00122874 * tF * tF * rh
    + 0.00085282 * tF * rh * rh - 0.00000199 * tF * tF * rh * rh;
  // Low-humidity / high-humidity adjustments
  if (rh < 13 && tF >= 80 && tF <= 112) hiF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tF - 95)) / 17);
  else if (rh > 85 && tF >= 80 && tF <= 87) hiF += ((rh - 85) / 10) * ((87 - tF) / 5);
  return (hiF - 32) * 5 / 9;
}

export default function WeatherAlerts() {
  const { location } = useContext(LocationContext) as unknown as { location: ResultType };
  const tz = location.timezone ?? "UTC";
  const { units } = useUnits();
  const { data: daily } = useDailyForecast(location.latitude, location.longitude);
  const { data: current } = useCurrentWeather(location.latitude, location.longitude);
  const { data: hourlyData } = useHourlyForecast(location.latitude, location.longitude);
  const { data: aqiData } = useAQI(location.latitude, location.longitude);

  const alerts = useMemo<Alert[]>(() => {
    const list: Alert[] = [];
    const d = daily?.daily;
    const minutely = hourlyData?.minutely15;
    const hourly = hourlyData?.hourly;
    const hasTag = (...tags: AlertTag[]) => list.some(a => tags.includes(a.tag));

    // ——— Today index ———
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const todayIdx = d?.time ? (() => { const idx = d.time.indexOf(todayStr); return idx >= 0 ? idx : 1; })() : 1;
    const tomorrowIdx = todayIdx + 1;

    const nowMs = getNowAsUTC(tz);
    const w = current?.current;

    // Is it daytime now? (between today's sunrise and sunset) — for cross-factor suppression
    const srTodayMs = d?.sunrise?.[todayIdx] ? parseAsUTC(d.sunrise[todayIdx]!).getTime() : 0;
    const ssTodayMs = d?.sunset?.[todayIdx] ? parseAsUTC(d.sunset[todayIdx]!).getTime() : 0;
    const isDaytimeNow = srTodayMs && ssTodayMs ? (nowMs >= srTodayMs && nowMs < ssTodayMs) : (w?.isDay === 1);
    const isNight = !isDaytimeNow;
    // Actionable = still daylight left (>30min to sunset). Kills stale "today" pills in the evening.
    const actionableDay = Boolean(isDaytimeNow && ssTodayMs && nowMs < ssTodayMs - 30 * 60_000);

    const futureHasMinutelyCode = (codes: Set<number>, hours: number): string => {
      if (!minutely) return "";
      for (const i of minutelySliceNextHours(minutely, tz, hours)) {
        if (codes.has(minutely.weatherCode[i]!)) return minutely.time[i]!;
      }
      return "";
    };
    const maxProbNextHours = (hours: number): number => {
      if (!minutely) return 0;
      let m = 0;
      for (const i of minutelySliceNextHours(minutely, tz, hours)) m = Math.max(m, minutely.precipitationProbability[i]!);
      return m;
    };

    // ════════════════════════════════════════════════════════
    // TIER S — SEVERE / ERROR (red)
    // ════════════════════════════════════════════════════════
    const STORM = new Set([95, 96, 99]);
    if (w && STORM.has(w.weatherCode)) {
      list.push({ icon: TriangleAlert, text: "Thunderstorm right now — stay indoors if possible", kind: "error", priority: 100, tag: "storm" });
    }
    if (d && !hasTag("storm")) {
      const futureStorm = futureHasMinutelyCode(STORM, 6);
      if (futureStorm) {
        list.push({ icon: TriangleAlert, text: `Thunderstorm around ${fmtTimeFromISO(futureStorm)} — stay indoors if possible`, kind: "error", priority: 99, tag: "storm" });
      } else if ((d.weatherCode?.[todayIdx] !== undefined && STORM.has(d.weatherCode[todayIdx]!)) && actionableDay) {
        // Daily fallback only while storm is still possible today (not after it passed)
        list.push({ icon: TriangleAlert, text: "Thunderstorm expected today — stay indoors if possible", kind: "error", priority: 99, tag: "storm" });
      }
    }

    // Dense fog next 3h — visibility < 800m = error, <1500m = warning
    if (minutely) {
      const idx3h = minutelySliceNextHours(minutely, tz, 3);
      let minVis = Infinity;
      let minVisTime = "";
      for (const i of idx3h) {
        const v = minutely.visibility[i]!;
        if (v < minVis) { minVis = v; minVisTime = minutely.time[i]!; }
      }
      if (minVis < 800) {
        const visText = units === "imperial" ? `${(minVis / 1609.34).toFixed(1)} mi` : `${(minVis / 1000).toFixed(1)} km`;
        list.push({ icon: Eye, text: `Dense fog until ${fmtTimeFromISO(minVisTime)} — visibility ${visText}`, kind: "error", priority: 98, tag: "fog" });
      } else if (minVis < 1500) {
        const visText = units === "imperial" ? `${(minVis / 1609.34).toFixed(1)} mi` : `${(minVis / 1000).toFixed(1)} km`;
        list.push({ icon: Eye, text: `Foggy next few hours — visibility ${visText} around ${fmtTimeFromISO(minVisTime)}`, kind: "warning", priority: 72, tag: "fog" });
      }
      if (minutely && !hasTag("fog")) {
        const nowMsFog = getNowAsUTC(tz);
        let closestIdx = 0, minDiff = Infinity;
        for (let i = 0; i < minutely.time.length; i++) {
          const ms = parseAsUTC(minutely.time[i]!).getTime();
          const diff = Math.abs(ms - nowMsFog);
          if (diff < minDiff) { minDiff = diff; closestIdx = i; }
        }
        const nowVis = minutely.visibility[closestIdx] ?? 99999;
        if (nowVis < 800) {
          const visText = units === "imperial" ? `${(nowVis / 1609.34).toFixed(1)} mi` : `${(nowVis / 1000).toFixed(1)} km`;
          list.push({ icon: Eye, text: `Fog now — visibility ${visText}`, kind: "error", priority: 96, tag: "fog" });
        } else if (nowVis < 1500 && nowVis < minVis) {
          const visText = units === "imperial" ? `${(nowVis / 1609.34).toFixed(1)} mi` : `${(nowVis / 1000).toFixed(1)} km`;
          list.push({ icon: Eye, text: `Low visibility now ${visText}`, kind: "warning", priority: 73, tag: "fog" });
        }
      }
    }

    // Heavy precipitation sum today — time-gated (total includes past rain)
    if (d && !hasTag("storm")) {
      const sum = d.precipitationSum?.[todayIdx] ?? 0;
      const futureRain = maxProbNextHours(6);
      const stillRelevant = actionableDay || futureRain >= 50;
      if (sum >= 20 && stillRelevant) {
        const conv = convertPrecipitation(sum, units);
        list.push({ icon: CloudRain, text: `Heavy rain today — ${conv} ${precipUnit(units)} expected`, kind: "error", priority: 95, tag: "rain" });
      } else if (sum >= 10 && sum < 20 && stillRelevant) {
        const conv = convertPrecipitation(sum, units);
        list.push({ icon: CloudRain, text: `Wet day ahead — ${conv} ${precipUnit(units)} rainfall today`, kind: "warning", priority: 58, tag: "rain" });
      }
    }

    // Freezing rain / ice — WMO 56/57/66/67 (most dangerous for driving)
    {
      const ICE = new Set([56, 57, 66, 67]);
      const iceHourly = futureHasMinutelyCode(ICE, 6);
      if (iceHourly) {
        list.push({ icon: Snowflake, text: `Freezing rain around ${fmtTimeFromISO(iceHourly)} — ice risk, avoid travel`, kind: "error", priority: 92, tag: "ice" });
      } else if (d && ICE.has(d.weatherCode?.[todayIdx] ?? 999) && (actionableDay || maxProbNextHours(6) >= 40) && !hasTag("ice", "storm")) {
        list.push({ icon: Snowflake, text: `Freezing rain expected today — ice risk`, kind: "warning", priority: 89, tag: "ice" });
      }
      // Drizzle 51/53/55 — low severity info
      const DRIZZLE = new Set([51, 53, 55]);
      if (!hasTag("ice", "storm", "rain") && d && DRIZZLE.has(d.weatherCode?.[todayIdx] ?? 999) && actionableDay) {
        const dz = futureHasMinutelyCode(DRIZZLE, 3);
        list.push({
          icon: Droplets,
          text: dz ? `Drizzle around ${fmtTimeFromISO(dz)} — damp roads` : `Drizzle expected today — damp roads`,
          kind: "info", priority: 48, tag: "drizzle",
        });
      }
    }

    // Wind — daily strong + hourly gust timing — suppressed when fog (fog needs calm)
    const hasDenseFog = hasTag("fog");
    if (d && !hasDenseFog && !hasTag("storm")) {
      const wind = d.windSpeed10mMax?.[todayIdx] ?? 0;
      if (wind >= 50 && actionableDay) {
        const conv = convertWindSpeed(wind, units);
        list.push({ icon: Wind, text: `Damaging wind — ${conv} ${speedUnit(units)} gusts expected today`, kind: "error", priority: 90, tag: "wind" });
      } else if (wind >= 40 && actionableDay) {
        const conv = convertWindSpeed(wind, units);
        list.push({ icon: Wind, text: `Strong wind ${conv} ${speedUnit(units)} expected`, kind: "warning", priority: 70, tag: "wind" });
      }
    }
    if (hourly && !hasDenseFog && !hasTag("storm")) {
      const idx6h = hourlySliceNextHours(hourly, tz, 6);
      let maxWind = -1;
      let maxWindTime = "";
      for (const i of idx6h) {
        const ws = hourly.windSpeed10M[i]!;
        if (ws > maxWind) { maxWind = ws; maxWindTime = hourly.time[i]!; }
      }
      if (maxWind >= 30) {
        const existingStrongIdx = list.findIndex(a => a.tag === "wind");
        const conv = convertWindSpeed(maxWind, units);
        if (existingStrongIdx >= 0) {
          const dup = list[existingStrongIdx]!;
          dup.text = `Strong wind up to ${conv} ${speedUnit(units)} around ${fmtTimeFromISO(maxWindTime)}`;
          dup.priority = 71;
        } else {
          list.push({ icon: Wind, text: `Gusty around ${fmtTimeFromISO(maxWindTime)} — up to ${conv} ${speedUnit(units)} in next 6h`, kind: "warning", priority: 64, tag: "wind" });
        }
      }
    }

    // ════════════════════════════════════════════════════════
    // TIER A — HOURLY PRECISION WARNINGS (amber/blue)
    // ════════════════════════════════════════════════════════

    if (aqiData) {
      const aqi = aqiData.aqi;
      const prom = aqiData.prominentPollutant;
      if (aqi >= 301) {
        list.push({ icon: TriangleAlert, text: `Very poor air — AQI ${aqi} (${prom}) — avoid outdoor`, kind: "error", priority: 82, tag: "aqi" });
      } else if (aqi >= 201) {
        list.push({ icon: Eye, text: `Poor air — AQI ${aqi} (${prom}) — limit outdoor`, kind: "warning", priority: 61, tag: "aqi" });
      }
    }

    // Snow — WMO 71/73/75/77/85/86 — timed, daily fallback only while actionable
    {
      const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
      let snowDaily = false;
      let snowTime = "";
      if (d && snowCodes.has(d.weatherCode?.[todayIdx] ?? 999)) snowDaily = true;
      if (minutely) {
        const idx3 = minutelySliceNextHours(minutely, tz, 3);
        for (const i of idx3) if (snowCodes.has(minutely.weatherCode[i]!)) { snowTime = minutely.time[i]!; break; }
      }
      if (snowTime) {
        list.push({ icon: CloudRain, text: `Snow expected around ${fmtTimeFromISO(snowTime)} — dress warm`, kind: "warning", priority: 85, tag: "snow" });
      } else if (snowDaily && actionableDay && !hasTag("storm")) {
        list.push({ icon: CloudRain, text: `Snow expected today — dress warm`, kind: "info", priority: 63, tag: "snow" });
      }
    }

    // Pressure dropping — require sustained fall (not noise spike), skip when storm/wind/rain already explains it
    if (hourly) {
      const hasStorm = hasTag("storm", "rain", "wind", "snow", "ice");
      if (!hasStorm) {
        const idx6h = hourlySliceNextHours(hourly, tz, 6);
        if (idx6h.length >= 2) {
          let minP = Infinity, maxP = -Infinity;
          for (const i of idx6h) { const p = hourly.surfacePressure[i]!; minP = Math.min(minP, p); maxP = Math.max(maxP, p); }
          const drop = maxP - minP;
          const firstP = hourly.surfacePressure[idx6h[0]!]!;
          const lastP = hourly.surfacePressure[idx6h[idx6h.length - 1]!]!;
          const netDrop = firstP - lastP;
          // Sustained fall: net drop ≥6 AND range ≥5 AND ending lower (filters spikes)
          if (netDrop >= 6 && drop >= 5 && lastP < firstP - 3) {
            const h = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date()), 10);
            const hh = Number.isNaN(h) ? 12 : (h === 24 ? 0 : h);
            let when = "this evening";
            if (hh >= 0 && hh < 6) when = "later today";
            else if (hh >= 6 && hh < 12) when = "this afternoon";
            else if (hh >= 12 && hh < 18) when = "this evening";
            else when = "tonight";
            list.push({ icon: Gauge, text: `Pressure dropping ${netDrop.toFixed(1)} hPa in 6h — change coming ${when}`, kind: "warning", priority: 78, tag: "pressure" });
          }
        }
      }
    }

    // Rain timing next 3h / 6h via minutely15
    if (minutely && !hasTag("storm", "ice", "snow")) {
      const idx3h = minutelySliceNextHours(minutely, tz, 3);
      let maxProb3 = -1, maxProb3Time = "";
      for (const i of idx3h) { const p = minutely.precipitationProbability[i]!; if (p > maxProb3) { maxProb3 = p; maxProb3Time = minutely.time[i]!; } }
      const idx6h = minutelySliceNextHours(minutely, tz, 6);
      let maxProb6 = -1;
      for (const i of idx6h) { const p = minutely.precipitationProbability[i]!; if (p > maxProb6) maxProb6 = p; }

      if (maxProb3 >= 70) {
        list.push({ icon: Umbrella, text: `Rain likely around ${fmtTimeFromISO(maxProb3Time)} — ${maxProb3}% in next 3h`, kind: "warning", priority: 75, tag: "rain" });
      } else if (maxProb3 >= 50) {
        list.push({ icon: CloudRain, text: `Slight rain chance ${maxProb3}% around ${fmtTimeFromISO(maxProb3Time)} (next 3h)`, kind: "info", priority: 62, tag: "rain" });
      } else if (maxProb6 >= 70) {
        list.push({ icon: Umbrella, text: `Rain expected later — up to ${maxProb6}% in next 6h`, kind: "info", priority: 57, tag: "rain" });
      }
    }

    // Daily high rain fallback only if hourly not already covered + still actionable
    if (d && !hasTag("storm", "ice", "snow", "rain") && actionableDay) {
      const prob = d.precipitationProbabilityMax?.[todayIdx] ?? 0;
      if (prob >= 70) {
        list.push({ icon: CloudRain, text: `High rain chance ${prob}% today`, kind: "info", priority: 66, tag: "rain" });
      }
    }

    // Overcast: cloudCover >=85% for 4+ of next 6h — only when sun is up
    if (hourly && isDaytimeNow) {
      const all6 = hourlySliceNextHours(hourly, tz, 6);
      const day6 = all6.filter(i => (hourly.isDay[i] as number) === 1);
      if (day6.length >= 3) {
        let overCount = 0;
        for (const i of day6) if (hourly.cloudCover[i]! >= 85) overCount++;
        const hourNow = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date());
        const hRaw = parseInt(hourNow, 10);
        const h = Number.isNaN(hRaw) ? 12 : (hRaw === 24 ? 0 : hRaw);
        let textAfternoon = "Overcast all afternoon — no sun till evening";
        if (h >= 5 && h < 12) { textAfternoon = "Overcast this morning — cloudy for hours"; }
        else if (h >= 18) { textAfternoon = "Overcast this evening — no clearing yet"; }
        if (overCount >= 4) {
          list.push({ icon: CloudSun, text: textAfternoon, kind: "info", priority: 65, tag: "overcast" });
        }
      }
    }

    // Cold / frost — freezing in next 12h + extreme apparent cold
    {
      let minT = Infinity, minTTime = "";
      if (hourly) {
        for (const i of hourlySliceNextHours(hourly, tz, 12)) {
          const t = hourly.temperature2M[i]!;
          if (t < minT) { minT = t; minTTime = hourly.time[i]!; }
        }
      }
      const appMin = d?.apparentTemperatureMin?.[todayIdx] ?? 999;
      if (minT <= 0 && minTTime) {
        list.push({ icon: Snowflake, text: `Freezing ${Math.round(minT)}°C around ${fmtTimeFromISO(minTTime)} — frost/ice risk`, kind: "warning", priority: 84, tag: "cold" });
      } else if (appMin <= -10 && !hasTag("cold")) {
        list.push({ icon: Thermometer, text: `Extreme cold ${Math.round(appMin)}°C today — limit exposure`, kind: "error", priority: 91, tag: "cold" });
      }
    }

    // Muggy / heat — humidity-aware via heat index + dew point
    if (hourly) {
      const idx3h = hourlySliceNextHours(hourly, tz, 3);
      const day3h = idx3h.filter(i => (hourly.isDay[i] as number) === 1);
      const hasStrongWind = hasTag("wind");
      for (const i of idx3h) {
        const t = hourly.temperature2M[i]!;
        const dp = hourly.dewPoint2M[i]!;
        const rh = hourly.relativeHumidity2M[i]!;
        const muggy = (dp >= 20 && t >= 26) || (rh >= 80 && t >= 28) || (rh >= 85 && (t - dp) <= 2 && t >= 22);
        if (muggy && !hasStrongWind) {
          list.push({ icon: Droplets, text: `Muggy now — dew point ${Math.round(dp)}° near ${Math.round(t)}°, humidity ${rh}%`, kind: "info", priority: 59, tag: "muggy" });
          break;
        }
      }
      // Heat: max heat-index in daytime 3h, suppressed by overcast/fog/rain
      const hasOvercastHeat = hasTag("overcast", "fog", "rain", "storm");
      if (isDaytimeNow && !hasOvercastHeat && day3h.length > 0) {
        let maxHI = -Infinity, maxHITime = "", maxT = -Infinity;
        for (const i of day3h) {
          const t = hourly.temperature2M[i]!;
          const rh = hourly.relativeHumidity2M[i]!;
          const hi = heatIndexC(t, rh);
          if (hi > maxHI) { maxHI = hi; maxHITime = hourly.time[i]!; maxT = t; }
        }
        if (maxHI >= 35 || maxT >= 35) {
          const show = Math.round(Math.max(maxHI, maxT));
          list.push({ icon: Thermometer, text: `Heat peak ${show}°C around ${fmtTimeFromISO(maxHITime)} — stay hydrated`, kind: "warning", priority: 69, tag: "heat" });
        }
      }
    }

    // UV — current + future precedence (peak usually 12-3).
    // NOW danger outranks FUTURE heads-up; past daily max is never used.
    {
      const hasBlocker = hasTag("overcast", "fog", "rain", "storm", "snow", "ice");
      const hasUv = hasTag("uv");
      if (!isNight && isDaytimeNow && w?.isDay !== 0 && !hasBlocker && !hasUv) {
        let nowUv = w?.uvIndex ?? -1;
        if ((nowUv < 0 || Number.isNaN(nowUv)) && hourly?.uvIndex) {
          let bestI = -1, bestDiff = Infinity;
          for (let i = 0; i < hourly.time.length; i++) {
            const diff = Math.abs(parseAsUTC(hourly.time[i]!).getTime() - nowMs);
            if (diff < bestDiff) { bestDiff = diff; bestI = i; }
          }
          if (bestI >= 0) nowUv = hourly.uvIndex[bestI] ?? -1;
        }
        let futUv = -1, futTime = "", futClear = 0, futCloud = 0;
        if (hourly?.uvIndex) {
          const idx6h = hourlySliceNextHours(hourly, tz, 6).filter(i =>
            (hourly.isDay[i] as number) === 1 && parseAsUTC(hourly.time[i]!).getTime() > nowMs
          );
          for (const i of idx6h) {
            const v = hourly.uvIndex[i] ?? -1;
            if (v > futUv) {
              futUv = v;
              futTime = hourly.time[i]!;
              futClear = hourly.uvIndexClearSky?.[i] ?? v;
              futCloud = hourly.cloudCover[i] ?? 0;
            }
          }
        }
        const attenuated = (val: number, clear: number, cloud: number) =>
          clear > 0 && val < clear * 0.4 && cloud >= 70;
        const nowTier = nowUv >= 8 ? 2 : nowUv >= 6 ? 1 : 0;
        const futTier = futUv >= 8 ? 2 : futUv >= 6 ? 1 : 0;
        if (nowTier === 2) {
          list.push({ icon: Sun, text: `Very high UV ${nowUv.toFixed(1)} now — limit sun`, kind: "warning", priority: 68, tag: "uv" });
        } else if (futTier === 2 && futTime) {
          list.push({ icon: Sun, text: `Very high UV ${futUv.toFixed(1)} around ${fmtTimeFromISO(futTime)} — limit sun`, kind: "warning", priority: 67, tag: "uv" });
        } else if (nowTier === 1) {
          list.push({ icon: Sun, text: `High UV ${nowUv.toFixed(1)} now — sunglasses & sunscreen`, kind: "info", priority: 60, tag: "uv" });
        } else if (futTier === 1 && futTime) {
          if (attenuated(futUv, futClear, futCloud)) {
            list.push({ icon: Sun, text: `UV ${futUv.toFixed(1)} around ${fmtTimeFromISO(futTime)} but cloudy — burn risk lower`, kind: "info", priority: 50, tag: "uv" });
          } else {
            list.push({ icon: Sun, text: `High UV ${futUv.toFixed(1)} around ${fmtTimeFromISO(futTime)} — sunglasses & sunscreen`, kind: "info", priority: 52, tag: "uv" });
          }
        }
      }
    }

    // ════════════════════════════════════════════════════════
    // TIER B — DAILY FALLBACKS — bucket-aware
    // ════════════════════════════════════════════════════════
    if (d) {
      const tMax = d.apparentTemperatureMax?.[todayIdx] ?? 0;
      const tMin = d.apparentTemperatureMin?.[todayIdx] ?? 0;
      const swing = tMax - tMin;
      const hasCloud = hasTag("overcast", "fog", "rain");
      if (isDaytimeNow && !hasCloud && swing >= 12) {
        list.push({ icon: Thermometer, text: `Wide temp swing ${Math.round(tMin)}° → ${Math.round(tMax)}° — layers recommended`, kind: "info", priority: 54, tag: "swing" });
      } else if (!isDaytimeNow && !hasCloud && swing >= 15) {
        list.push({ icon: Thermometer, text: `Wide temp swing ${Math.round(tMin)}° → ${Math.round(tMax)}° tomorrow — layers`, kind: "info", priority: 54, tag: "swing" });
      }
    }

    // ════════════════════════════════════════════════════════
    // TIER C — DELIGHT / LOOKAHEAD — only if no A/B above
    // ════════════════════════════════════════════════════════
    const hasAorB = list.length > 0;
    if (!hasAorB && d) {
      const delight: Alert[] = [];

      const candidates: { timeStr: string; ms: number; kind: "sunrise" | "sunset" }[] = [];
      const pushCand = (iso: string | undefined, kind: "sunrise" | "sunset") => {
        if (!iso) return;
        candidates.push({ timeStr: iso, ms: parseAsUTC(iso).getTime(), kind });
      };
      pushCand(d.sunrise?.[todayIdx], "sunrise");
      pushCand(d.sunset?.[todayIdx], "sunset");
      pushCand(d.sunrise?.[tomorrowIdx], "sunrise");
      pushCand(d.sunset?.[tomorrowIdx], "sunset");
      if (d.sunrise?.[tomorrowIdx + 1]) pushCand(d.sunrise?.[tomorrowIdx + 1], "sunrise");
      if (d.sunset?.[tomorrowIdx + 1]) pushCand(d.sunset?.[tomorrowIdx + 1], "sunset");

      const future = candidates.filter(c => c.ms > nowMs).sort((a, b) => a.ms - b.ms);
      const next = future[0] ?? candidates.sort((a, b) => a.ms - b.ms)[0];
      if (next) {
        const diffMs = next.ms - nowMs;
        const isFuture = diffMs >= 0;
        const absMs = Math.abs(diffMs);
        const totalMin = Math.round(absMs / 60000);
        const hrs = Math.floor(totalMin / 60);
        const mins = totalMin % 60;
        const inText = isFuture
          ? (hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`)
          : (hrs > 0 ? `${hrs}h ${mins}m ago` : `${mins} min ago`);
        const when = isFuture ? `in ${inText}` : `${inText}`;
        if (next.kind === "sunrise") {
          delight.push({
            icon: Sunrise,
            text: `Don't miss sunrise at ${fmtTimeFromISO(next.timeStr)} ${when} — clear morning light`,
            kind: "success",
            priority: 20,
            tag: "sun",
          });
        } else {
          delight.push({
            icon: Sunset,
            text: `Don't miss sunset at ${fmtTimeFromISO(next.timeStr)} ${when} — golden hour`,
            kind: "success",
            priority: 20,
            tag: "sun",
          });
        }
      }

      const sunsetTodayMs = d.sunset?.[todayIdx] ? parseAsUTC(d.sunset[todayIdx]!).getTime() : 0;
      if (hourly && sunsetTodayMs && nowMs > sunsetTodayMs) {
        const idx4h = minutelySliceNextHours({ time: hourly.time } as unknown as { time: string[] }, tz, 4);
        let avgCloud = 0, cnt = 0;
        for (const i of idx4h) {
          if (hourly.cloudCover?.[i] != null) { avgCloud += hourly.cloudCover[i]!; cnt++; }
        }
        if (cnt > 0) {
          avgCloud /= cnt;
          if (avgCloud < 20) {
            delight.push({ icon: Sparkles, text: `Perfect stargazing tonight — cloud ${Math.round(avgCloud)}%, ideal for night sky`, kind: "success", priority: 18, tag: "sun" });
          } else if (avgCloud < 40) {
            delight.push({ icon: Sparkles, text: `Good stargazing window — cloud ${Math.round(avgCloud)}% next few hours`, kind: "info", priority: 17, tag: "sun" });
          }
        }
      }

      if (delight.length === 0) {
        delight.push({ icon: Sun, text: `Calm day — no warnings, enjoy the weather`, kind: "success", priority: 10, tag: "sun" });
      }
      delight.sort((a, b) => b.priority - a.priority);
      const top = delight[0]!;
      list.push(top);
      if (delight.length >= 2 && top.priority === 20 && delight[1]!.priority >= 17) {
        list.push(delight[1]!);
      }
    }

    // Final sort, dedup, limit — allow 3 pills when 2+ errors (don't hide 3rd severe)
    list.sort((a, b) => b.priority - a.priority);
    const seen = new Set<string>();
    const uniq: Alert[] = [];
    for (const a of list) {
      if (!seen.has(a.text)) { seen.add(a.text); uniq.push(a); }
    }
    const errCount = uniq.filter(a => a.kind === "error").length;
    return uniq.slice(0, errCount >= 2 ? 3 : 2);
  }, [daily, current, hourlyData, aqiData, tz, units]);

  if (alerts.length === 0) return null;

  const kindStyles: Record<AlertKind, { wrap: string; accent: string; iconWrap: string; icon: string; shadow: string }> = {
    error: {
      wrap: "border-red-500/20 bg-gradient-to-r from-red-500/[0.08] via-red-500/[0.05] to-orange-500/[0.06] hover:border-red-500/30",
      accent: "from-red-500 to-orange-500",
      iconWrap: "bg-red-500/15 ring-1 ring-red-500/20",
      icon: "text-red-500",
      shadow: "shadow-red-500/10 hover:shadow-red-500/15",
    },
    warning: {
      wrap: "border-amber-500/20 bg-gradient-to-r from-amber-500/[0.09] via-amber-500/[0.04] to-yellow-500/[0.06] hover:border-amber-500/30",
      accent: "from-amber-500 to-yellow-500",
      iconWrap: "bg-amber-500/15 ring-1 ring-amber-500/20",
      icon: "text-amber-500",
      shadow: "shadow-amber-500/10 hover:shadow-amber-500/15",
    },
    info: {
      wrap: "border-sky-500/20 bg-gradient-to-r from-sky-500/[0.09] via-sky-500/[0.04] to-blue-500/[0.06] hover:border-sky-500/30",
      accent: "from-sky-500 to-blue-500",
      iconWrap: "bg-sky-500/15 ring-1 ring-sky-500/20",
      icon: "text-sky-500",
      shadow: "shadow-sky-500/10 hover:shadow-sky-500/15",
    },
    success: {
      wrap: "border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] via-emerald-500/[0.04] to-teal-500/[0.06] hover:border-emerald-500/30",
      accent: "from-emerald-500 to-teal-500",
      iconWrap: "bg-emerald-500/15 ring-1 ring-emerald-500/20",
      icon: "text-emerald-500",
      shadow: "shadow-emerald-500/10 hover:shadow-emerald-500/15",
    },
  };

  return (
    <div className="grid gap-3 justify-items-center">
      {alerts.map(({ icon: Icon, text, kind }, idx) => {
        const s = kindStyles[kind];
        return (
          <div
            key={idx}
            role="alert"
            className={`group animate-fade-in relative flex w-full max-w-2xl items-center justify-center gap-3 overflow-hidden rounded-full border px-4 py-2.5 text-sm font-medium tracking-tight shadow-lg backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${s.wrap} ${s.shadow}`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${s.accent} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.iconWrap}`}>
              <Icon size={14} className={`shrink-0 ${s.icon}`} strokeWidth={2} />
            </span>
            <span className="text-center leading-snug text-base-content/90">{text}</span>
          </div>
        );
      })}
    </div>
  );
}
