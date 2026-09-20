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
} from "lucide-react";

type AlertKind = "info" | "warning" | "error" | "success";
type Alert = { icon: React.ElementType; text: string; kind: AlertKind; priority: number };

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
    // Also consider tomorrow sunrise if after midnight and before sunrise
    const isNight = !isDaytimeNow;

    // ════════════════════════════════════════════════════════
    // TIER S — SEVERE / ERROR (red)
    // ════════════════════════════════════════════════════════
    if (w && [95, 96, 99].includes(w.weatherCode)) {
      list.push({ icon: TriangleAlert, text: "Thunderstorm right now — stay indoors if possible", kind: "error", priority: 100 });
    }
    if (d) {
      const code = d.weatherCode?.[todayIdx] ?? 0;
      if ([95, 96, 99].includes(code) && !list.some(a => a.priority === 100)) {
        list.push({ icon: TriangleAlert, text: "Thunderstorm expected today — stay indoors if possible", kind: "error", priority: 99 });
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
        list.push({ icon: Eye, text: `Dense fog until ${fmtTimeFromISO(minVisTime)} — visibility ${visText}`, kind: "error", priority: 98 });
      } else if (minVis < 1500) {
        const visText = units === "imperial" ? `${(minVis / 1609.34).toFixed(1)} mi` : `${(minVis / 1000).toFixed(1)} km`;
        // warning but slightly lower priority, still hourly
        list.push({ icon: Eye, text: `Foggy next few hours — visibility ${visText} around ${fmtTimeFromISO(minVisTime)}`, kind: "warning", priority: 72 });
      }
      // Current immediate visibility (nearest minutely15) — catches "Fog now" vs future min; only if fog not already alerted
      if (minutely && !list.some(a => a.text.toLowerCase().includes("fog"))) {
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
          list.push({ icon: Eye, text: `Fog now — visibility ${visText}`, kind: "error", priority: 96 });
        } else if (nowVis < 1500 && nowVis < minVis) {
          const visText = units === "imperial" ? `${(nowVis / 1609.34).toFixed(1)} mi` : `${(nowVis / 1000).toFixed(1)} km`;
          list.push({ icon: Eye, text: `Low visibility now ${visText}`, kind: "warning", priority: 71 });
        }
      }
    }

    // Heavy precipitation sum today
    if (d) {
      const sum = d.precipitationSum?.[todayIdx] ?? 0;
      if (sum >= 20) {
        const conv = convertPrecipitation(sum, units);
        list.push({ icon: CloudRain, text: `Heavy rain today — ${conv} ${precipUnit(units)} expected`, kind: "error", priority: 95 });
      } else if (sum >= 10 && sum < 20) {
        const conv = convertPrecipitation(sum, units);
        list.push({ icon: CloudRain, text: `Wet day ahead — ${conv} ${precipUnit(units)} rainfall today`, kind: "warning", priority: 58 });
      }
    }

    // Wind — daily strong + hourly gust timing — suppressed when dense fog (mutual exclusive: fog needs calm <15km/h)
    const hasDenseFog = list.some(a => a.priority === 98 || a.priority === 72);
    if (d && !hasDenseFog) {
      const wind = d.windSpeed10mMax?.[todayIdx] ?? 0;
      if (wind >= 50) {
        const conv = convertWindSpeed(wind, units);
        list.push({ icon: Wind, text: `Damaging wind — ${conv} ${speedUnit(units)} gusts expected today`, kind: "error", priority: 90 });
      } else if (wind >= 40) {
        const conv = convertWindSpeed(wind, units);
        list.push({ icon: Wind, text: `Strong wind ${conv} ${speedUnit(units)} expected`, kind: "warning", priority: 70 });
      }
      // Breezy ≥30 info 45 pruned — too noisy, hourly Gusty 68 is precise enough
    }
    // Hourly wind timing next 6h — more precise than daily — suppressed when fog
    if (hourly && !hasDenseFog) {
      const idx6h = hourlySliceNextHours(hourly, tz, 6);
      let maxWind = -1;
      let maxWindTime = "";
      for (const i of idx6h) {
        const ws = hourly.windSpeed10M[i]!;
        if (ws > maxWind) { maxWind = ws; maxWindTime = hourly.time[i]!; }
      }
      if (maxWind >= 30) {
        // hourly gust + dense fog contradictory → fog already wins, but if maxWind >=30 and fog we skipped whole block via hasDenseFog guard
        // suppress the soft daily 30 if we have timing — also collapse daily strong into single timed alert to avoid slot waste
        const existingStrongIdx = list.findIndex(a => a.priority === 70 || a.priority === 90);
        const existingSoft = list.findIndex(a => a.priority === 45);
        if (existingSoft >= 0) list.splice(existingSoft, 1);
        const conv = convertWindSpeed(maxWind, units);
        if (existingStrongIdx >= 0) {
          // upgrade daily wind to timed version instead of two wind pills
          const dup = list[existingStrongIdx]!;
          dup.text = `Strong wind up to ${conv} ${speedUnit(units)} around ${fmtTimeFromISO(maxWindTime)}`;
          dup.priority = 71; // keep high but slightly above hourly gust to preserve order
        } else {
          list.push({ icon: Wind, text: `Gusty around ${fmtTimeFromISO(maxWindTime)} — up to ${conv} ${speedUnit(units)} in next 6h`, kind: "warning", priority: 68 });
        }
      }
    }

    // ════════════════════════════════════════════════════════
    // TIER A — HOURLY PRECISION WARNINGS (amber/blue)
    // ════════════════════════════════════════════════════════

    // AQI — NAQI Poor/Very Poor/Severe (already fetched 10-min) — worthy for health, not daily weather
    if (aqiData) {
      const aqi = aqiData.aqi;
      const prom = aqiData.prominentPollutant;
      if (aqi >= 301) {
        list.push({ icon: TriangleAlert, text: `Very poor air — AQI ${aqi} (${prom}) — avoid outdoor`, kind: "error", priority: 82 });
      } else if (aqi >= 201) {
        list.push({ icon: Eye, text: `Poor air — AQI ${aqi} (${prom}) — limit outdoor`, kind: "warning", priority: 61 });
      }
      // Moderate 101-200 not alertworthy alone; Very Good/Good suppressed
    }

    // Snow — WMO 71/73/75/77/85/86 — daily today or next 3h minutely
    {
      const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
      let snowDaily = false, snowHourly = false;
      let snowTime = "";
      if (d && snowCodes.has(d.weatherCode?.[todayIdx] ?? 999)) snowDaily = true;
      if (minutely) {
        const idx3 = minutelySliceNextHours(minutely, tz, 3);
        for (const i of idx3) if (snowCodes.has(minutely.weatherCode[i]!)) { snowHourly = true; snowTime = minutely.time[i]!; break; }
      }
      if (snowHourly) {
        list.push({ icon: CloudRain, text: `Snow expected around ${fmtTimeFromISO(snowTime)} — dress warm`, kind: "warning", priority: 85 });
      } else if (snowDaily) {
        list.push({ icon: CloudRain, text: `Snow expected today — dress warm`, kind: "info", priority: 63 });
      }
    }

    // Pressure dropping >8 hPa in 6h — suppressed if thunderstorm/heavy rain already alerts (same system), bucket-aware wording
    if (hourly) {
      const hasStorm = list.some(a => a.priority === 100 || a.priority === 99 || a.priority === 95 || a.priority === 85);
      if (!hasStorm) {
        const idx6h = hourlySliceNextHours(hourly, tz, 6);
        if (idx6h.length >= 2) {
          let minP = Infinity, maxP = -Infinity;
          for (const i of idx6h) { const p = hourly.surfacePressure[i]!; minP = Math.min(minP, p); maxP = Math.max(maxP, p); }
          const drop = maxP - minP;
          const firstP = hourly.surfacePressure[idx6h[0]!]!;
          const lastP = hourly.surfacePressure[idx6h[idx6h.length - 1]!]!;
          const netDrop = firstP - lastP;
          if (drop >= 8 || netDrop >= 6) {
            const h = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date()), 10);
            let when = "this evening";
            if (h >= 0 && h < 6) when = "later today";
            else if (h >= 6 && h < 12) when = "this afternoon";
            else if (h >= 12 && h < 18) when = "this evening";
            else when = "tonight";
            list.push({ icon: Gauge, text: `Pressure dropping ${drop.toFixed(1)} hPa in 6h — change coming ${when}`, kind: "warning", priority: 78 });
          }
        }
      }
    }

    // Rain timing next 3h / 6h via minutely15
    if (minutely) {
      const idx3h = minutelySliceNextHours(minutely, tz, 3);
      let maxProb3 = -1, maxProb3Time = "";
      for (const i of idx3h) { const p = minutely.precipitationProbability[i]!; if (p > maxProb3) { maxProb3 = p; maxProb3Time = minutely.time[i]!; } }
      const idx6h = minutelySliceNextHours(minutely, tz, 6);
      let maxProb6 = -1;
      for (const i of idx6h) { const p = minutely.precipitationProbability[i]!; if (p > maxProb6) maxProb6 = p; }

      if (maxProb3 >= 70) {
        list.push({ icon: Umbrella, text: `Rain likely around ${fmtTimeFromISO(maxProb3Time)} — ${maxProb3}% in next 3h`, kind: "warning", priority: 75 });
      } else if (maxProb3 >= 50) {
        list.push({ icon: CloudRain, text: `Slight rain chance ${maxProb3}% around ${fmtTimeFromISO(maxProb3Time)} (next 3h)`, kind: "info", priority: 62 });
      } else if (maxProb6 >= 70) {
        list.push({ icon: Umbrella, text: `Rain expected later — up to ${maxProb6}% in next 6h`, kind: "info", priority: 60 });
      }
      // if hourly timing added, suppress daily high rain duplicates below
    }

    // Daily high rain fallback only if hourly not already covered high rain
    if (d) {
      const hasHourlyRain = list.some(a => a.text.includes("next 3h") || a.text.includes("next 6h"));
      const prob = d.precipitationProbabilityMax?.[todayIdx] ?? 0;
      if (prob >= 70 && !hasHourlyRain) {
        list.push({ icon: CloudRain, text: `High rain chance ${prob}% today`, kind: "info", priority: 66 });
      }
      // Moderate 50-70% info 48 pruned — hourly Slight rain 62 is precise, daily moderate wastes slot
    }

    // Overcast: cloudCover >=85% for 4+ of next 6h — only when sun is up, suppressed at night, bucket-aware phrasing
    if (hourly && isDaytimeNow) {
      const all6 = hourlySliceNextHours(hourly, tz, 6);
      const day6 = all6.filter(i => (hourly.isDay[i] as number) === 1);
      // Require at least 3 daytime slots in next 6h; else not "afternoon" — prevents 1 AM → "afternoon" nonsense
      if (day6.length >= 3) {
        let overCount = 0;
        for (const i of day6) if (hourly.cloudCover[i]! >= 85) overCount++;
        // bucket-aware wording: 0-6 overnight, 6-12 morning, 12-18 afternoon, 18-24 evening — use real wall-clock, not UTC-pretend nowMs
        const hourNow = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date());
        const h = parseInt(hourNow, 10);
        let textAfternoon = "Overcast all afternoon — no sun till evening";
        let textMostly = `Mostly cloudy next 6h — cloud ${hourly.cloudCover[day6[0]!] ?? 0}%`;
        if (h >= 5 && h < 12) { textAfternoon = "Overcast this morning — cloudy for hours"; textMostly = `Mostly cloudy this morning — ${hourly.cloudCover[day6[0]!] ?? 0}% cloud`; }
        else if (h >= 18) { textAfternoon = "Overcast this evening — no clearing yet"; }
        if (overCount >= 4) {
          list.push({ icon: CloudSun, text: textAfternoon, kind: "info", priority: 65 });
        }
        // Mostly cloudy 42 pruned — keep only Overcast 65, less noise
      }
      // At 12:59 AM isDaytimeNow false → this whole block skipped, so Overcast won't pair with High UV at night (Nebraska bug)
    }

    // Muggy / dew point discomfort + heat — heat is daytime-only and overcast-suppressed
    if (hourly) {
      const idx3h = hourlySliceNextHours(hourly, tz, 3);
      const day3h = idx3h.filter(i => (hourly.isDay[i] as number) === 1);
      // Muggy can be night (high humidity) — keep 3h all, but suppress if strong wind (disperses)
      const hasStrongWind = list.some(a => a.priority === 70 || a.priority === 71 || a.priority === 90 || a.priority === 68);
      for (const i of idx3h) {
        const t = hourly.temperature2M[i]!;
        const dp = hourly.dewPoint2M[i]!;
        const rh = hourly.relativeHumidity2M[i]!;
        const spread = t - dp;
        if (rh >= 85 && spread <= 2 && t >= 22 && !hasStrongWind) {
          list.push({ icon: Droplets, text: `Muggy now — dew point ${Math.round(dp)}° near ${Math.round(t)}°, humidity ${rh}%`, kind: "info", priority: 60 });
          break;
        }
      }
      // Heat: only when sun is up and not overcast — 35°C at 2 AM is impossible
      const hasOvercastHeat = list.some(a => a.text.includes("Overcast") || a.text.includes("Gloomy"));
      if (isDaytimeNow && !hasOvercastHeat && day3h.length > 0) {
        let maxT = -Infinity, maxTTime = "";
        for (const i of day3h) { const t = hourly.temperature2M[i]!; if (t > maxT) { maxT = t; maxTTime = hourly.time[i]!; } }
        if (maxT >= 35) {
          list.push({ icon: Thermometer, text: `Heat peak ${Math.round(maxT)}°C around ${fmtTimeFromISO(maxTTime)} — stay hydrated`, kind: "warning", priority: 69 });
        }
        // Warm spell 32 info 44 pruned — 32°C not warning level for summer, keep only 35
      }
    }

    // UV — daily max + also warn moderate — suppressed at night, when overcast, or when raining
    if (d) {
      const uv = d.uvIndexMax?.[todayIdx] ?? 0;
      const hasOvercast = list.some(a => a.text.includes("Overcast") || a.text.includes("Gloomy") || a.text.includes("Mostly cloudy"));
      const hasRain = list.some(a => a.text.includes("Rain") || a.text.includes("Thunderstorm"));
      const currentCloud = (() => {
        if (!hourly) return 0;
        const idx = hourlySliceNextHours(hourly, tz, 2).filter(i => (hourly.isDay[i] as number) === 1);
        if (idx.length === 0) return 0;
        return idx.reduce((s, i) => s + (hourly.cloudCover[i] ?? 0), 0) / idx.length;
      })();
      const isSunUp = isDaytimeNow && (w?.isDay !== 0) && currentCloud < 80;
      if (!isNight && isSunUp && !hasOvercast && !hasRain) {
        if (uv >= 8 && !list.some(a => a.text.includes("UV"))) {
          list.push({ icon: Sun, text: `Very high UV ${uv.toFixed(1)} — limit sun 12–3 PM`, kind: "warning", priority: 67 });
        } else if (uv >= 6 && uv < 8) {
          list.push({ icon: Sun, text: `High UV ${uv.toFixed(1)} — sunglasses & sunscreen`, kind: "info", priority: 52 });
        }
      }
      // At 12:59 AM, isNight true → this block is skipped, fixing Overcast+High UV contradiction in Nebraska screenshot
    }

    // ════════════════════════════════════════════════════════
    // TIER B — DAILY FALLBACKS (if hourly not severe) — bucket-aware
    // ════════════════════════════════════════════════════════
    // Gloomy 55 pruned — overcast 65 is hourly-precise, daily sunshine redundant at 00-06
    if (d) {
      const tMax = d.apparentTemperatureMax?.[todayIdx] ?? 0;
      const tMin = d.apparentTemperatureMin?.[todayIdx] ?? 0;
      const swing = tMax - tMin;
      // Wide swing is daytime-relevant; suppress overnight when Overcast already explains temp cap, to avoid 0-6 bucket double pill
      const hasCloud = list.some(a => a.text.includes("Overcast") || a.text.includes("cloudy"));
      if (isDaytimeNow && !hasCloud && swing >= 12) {
        list.push({ icon: Thermometer, text: `Wide temp swing ${Math.round(tMin)}° → ${Math.round(tMax)}° — layers recommended`, kind: "info", priority: 54 });
      } else if (!isDaytimeNow && !hasCloud && swing >= 15) {
        // higher threshold at night (0-6, 18-24) — still worthy if extreme swing
        list.push({ icon: Thermometer, text: `Wide temp swing ${Math.round(tMin)}° → ${Math.round(tMax)}° tomorrow — layers`, kind: "info", priority: 54 });
      }
    }

    // ════════════════════════════════════════════════════════
    // TIER C — DELIGHT / LOOKAHEAD — only if no A/B above
    // Current has priority, then hourly, then daily — C always shows next sun event
    // ════════════════════════════════════════════════════════
    const hasAorB = list.length > 0;
    if (!hasAorB && d) {
      const delight: Alert[] = [];

      // Always show next sunrise/sunset — whichever is first in the future
      // Moscow 07:34 after sunrise → next is sunset today; evening → sunrise tomorrow
      const candidates: { timeStr: string; ms: number; kind: "sunrise" | "sunset" }[] = [];
      const pushCand = (iso: string | undefined, kind: "sunrise" | "sunset") => {
        if (!iso) return;
        candidates.push({ timeStr: iso, ms: parseAsUTC(iso).getTime(), kind });
      };
      pushCand(d.sunrise?.[todayIdx], "sunrise");
      pushCand(d.sunset?.[todayIdx], "sunset");
      pushCand(d.sunrise?.[tomorrowIdx], "sunrise");
      pushCand(d.sunset?.[tomorrowIdx], "sunset");
      // +2 days fallback if needed
      if (d.sunrise?.[tomorrowIdx + 1]) pushCand(d.sunrise?.[tomorrowIdx + 1], "sunrise");
      if (d.sunset?.[tomorrowIdx + 1]) pushCand(d.sunset?.[tomorrowIdx + 1], "sunset");

      // sort future first
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
          });
        } else {
          delight.push({
            icon: Sunset,
            text: `Don't miss sunset at ${fmtTimeFromISO(next.timeStr)} ${when} — golden hour`,
            kind: "success",
            priority: 20,
          });
        }
      }

      // Stargazing: after sunset, low cloud next 4h — secondary delight if sun event already taken
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
            delight.push({ icon: Sparkles, text: `Perfect stargazing tonight — cloud ${Math.round(avgCloud)}%, ideal for night sky`, kind: "success", priority: 18 });
          } else if (avgCloud < 40) {
            delight.push({ icon: Sparkles, text: `Good stargazing window — cloud ${Math.round(avgCloud)}% next few hours`, kind: "info", priority: 17 });
          }
        }
      }

      // Fallback if somehow no sun candidate (should never happen)
      if (delight.length === 0) {
        delight.push({ icon: Sun, text: `Calm day — no warnings, enjoy the weather`, kind: "success", priority: 10 });
      }
      // C shows exactly 1 pill — the next sun event (plus optional stargazing second pill when relevant)
      delight.sort((a, b) => b.priority - a.priority);
      const top = delight[0]!;
      list.push(top);
      // allow second pill only for stargazing when sun event is primary
      if (delight.length >= 2 && top.priority === 20 && delight[1]!.priority >= 17) {
        list.push(delight[1]!);
      }
    }

    // Final sort, dedup, limit 2
    list.sort((a, b) => b.priority - a.priority);
    // Deduplicate identical text
    const seen = new Set<string>();
    const uniq: Alert[] = [];
    for (const a of list) {
      if (!seen.has(a.text)) { seen.add(a.text); uniq.push(a); }
    }
    return uniq.slice(0, 2);
  }, [daily, current, hourlyData, tz, units]);

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
            {/* left accent */}
            <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${s.accent} opacity-80 group-hover:opacity-100 transition-opacity`} />
            {/* icon pill */}
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
