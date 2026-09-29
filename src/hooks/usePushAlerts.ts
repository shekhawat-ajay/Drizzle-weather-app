import { useEffect, useState, useCallback } from "react";
import useDailyForecast from "@/hooks/weather/useDailyForecast";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
import useHourlyForecast from "@/hooks/weather/useHourlyForecast";
import useAQI from "@/hooks/weather/useAQI";
import { fmtTimeFromISO, getNowAsUTC, parseAsUTC } from "@/utils/formatters";
import { getNextShowers } from "@/data/meteorShowers";

const STORAGE_KEY_PERM = "drizzle-push-enabled";
const STORAGE_KEY_LAST = "drizzle-push-last";

function canNotify(): boolean {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
}

function shouldNotify(key: string, cooldownHours = 12): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST);
    const map = raw ? JSON.parse(raw) as Record<string, number> : {};
    const last = map[key] ?? 0;
    return Date.now() - last > cooldownHours * 3600000;
  } catch { return true; }
}

function markNotified(key: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST);
    const map = raw ? JSON.parse(raw) as Record<string, number> : {};
    map[key] = Date.now();
    localStorage.setItem(STORAGE_KEY_LAST, JSON.stringify(map));
  } catch { /* ignore */ }
}

function showNotification(title: string, body: string, tag: string) {
  if (!canNotify()) return;
  try {
    new Notification(title, { body, tag, icon: "/rain.svg", badge: "/rain.svg" });
  } catch { /* ignore */ }
}

export default function usePushAlerts(latitude: number, longitude: number, timezone?: string) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY_PERM) === "1"; } catch { return false; }
  });
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) return Notification.permission;
    return "default";
  });

  const { data: daily } = useDailyForecast(latitude, longitude);
  const { data: current } = useCurrentWeather(latitude, longitude);
  const { data: hourlyData } = useHourlyForecast(latitude, longitude);
  const { data: aqiData } = useAQI(latitude, longitude);

  const request = useCallback(async () => {
    if (!("Notification" in window)) {
      alert("Notifications not supported in this browser.");
      return;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      localStorage.setItem(STORAGE_KEY_PERM, "1");
      setEnabled(true);
      new Notification("Drizzle alerts enabled", { body: "You'll get notified for severe weather, ISS passes and meteor peaks.", icon: "/rain.svg" });
    } else {
      localStorage.setItem(STORAGE_KEY_PERM, "0");
      setEnabled(false);
    }
  }, []);

  const disable = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_PERM, "0");
    setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) disable();
    else request();
  }, [enabled, request, disable]);

  // Check alerts when data changes and when enabled — thresholds mirror in-app severe levels
  useEffect(() => {
    if (!enabled || !canNotify()) return;
    if (!daily?.daily) return;

    const tz = timezone ?? "UTC";
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const idx = daily.daily.time.indexOf(todayStr);
    const i = idx >= 0 ? idx : 1;
    const prob = daily.daily.precipitationProbabilityMax?.[i] ?? 0;
    const wind = daily.daily.windSpeed10mMax?.[i] ?? 0;
    const code = daily.daily.weatherCode?.[i] ?? 0;

    const minutely = hourlyData?.minutely15;
    const hourly = hourlyData?.hourly;
    const nowMs = getNowAsUTC(tz);
    const futureHasCode = (codes: Set<number>, hours: number): string => {
      if (!minutely) return "";
      const endMs = nowMs + hours * 3600_000;
      for (let k = 0; k < minutely.time.length; k++) {
        const ms = parseAsUTC(minutely.time[k]!).getTime();
        if (ms < nowMs || ms > endMs) continue;
        if (codes.has(minutely.weatherCode[k]!)) return minutely.time[k]!;
      }
      return "";
    };
    let maxProb3 = 0;
    let minVis3 = Infinity;
    if (minutely) {
      const endMs = nowMs + 3 * 3600_000;
      for (let k = 0; k < minutely.time.length; k++) {
        const ms = parseAsUTC(minutely.time[k]!).getTime();
        if (ms < nowMs || ms > endMs) continue;
        maxProb3 = Math.max(maxProb3, minutely.precipitationProbability[k]!);
        minVis3 = Math.min(minVis3, minutely.visibility[k]!);
      }
    }

    const STORM = new Set([95, 96, 99]);
    const SNOW = new Set([71, 73, 75, 77, 85, 86]);
    const ICE = new Set([56, 57, 66, 67]);

    // Rain — in-app severe is 70% (3h) / daily 70 — was 80, now parity at 70
    if ((prob >= 70 || maxProb3 >= 70) && shouldNotify(`rain-${todayStr}`, 12)) {
      showNotification("Heavy rain expected", `Rain chance ${Math.max(prob, maxProb3)}% — bring an umbrella.`, `rain-${todayStr}`);
      markNotified(`rain-${todayStr}`);
    }
    // Wind — in-app strong is 40 daily / 30 hourly — was 50, now parity at 40
    if (wind >= 40 && shouldNotify(`wind-${todayStr}`, 12)) {
      showNotification("Strong wind alert", `Wind up to ${Math.round(wind)} km/h expected today.`, `wind-${todayStr}`);
      markNotified(`wind-${todayStr}`);
    }
    // Storm — daily or timed future
    const stormTime = futureHasCode(STORM, 6);
    if ((STORM.has(code) || stormTime) && shouldNotify(`storm-${todayStr}`, 12)) {
      showNotification(
        "Thunderstorm warning",
        stormTime ? `Thunderstorm around ${fmtTimeFromISO(stormTime)} — stay safe indoors.` : "Thunderstorm expected today — stay safe indoors.",
        `storm-${todayStr}`,
      );
      markNotified(`storm-${todayStr}`);
    }
    // Fog — was missing, now parity (dense <800m next 3h)
    if (minVis3 < 800 && shouldNotify(`fog-${todayStr}`, 12)) {
      showNotification("Dense fog", "Visibility under 0.8 km in next 3h — drive careful.", `fog-${todayStr}`);
      markNotified(`fog-${todayStr}`);
    }
    // Snow / ice — was missing
    const snowTime = futureHasCode(SNOW, 6);
    const iceTime = futureHasCode(ICE, 6);
    if ((iceTime || ICE.has(code)) && shouldNotify(`ice-${todayStr}`, 12)) {
      showNotification("Freezing rain", iceTime ? `Ice risk around ${fmtTimeFromISO(iceTime)} — avoid travel.` : "Freezing rain expected — ice risk.", `ice-${todayStr}`);
      markNotified(`ice-${todayStr}`);
    } else if ((snowTime || SNOW.has(code)) && shouldNotify(`snow-${todayStr}`, 12)) {
      showNotification("Snow expected", snowTime ? `Snow around ${fmtTimeFromISO(snowTime)} — dress warm.` : "Snow expected today.", `snow-${todayStr}`);
      markNotified(`snow-${todayStr}`);
    }
    // AQI — was missing, parity at 201+
    if (aqiData && aqiData.aqi >= 201 && shouldNotify(`aqi-${todayStr}`, 12)) {
      showNotification("Poor air quality", `AQI ${aqiData.aqi} (${aqiData.prominentPollutant}) — limit outdoor.`, `aqi-${todayStr}`);
      markNotified(`aqi-${todayStr}`);
    }
    // UV — current + future precedence (peak usually 12-3). No stale daily-max ping at night.
    const nowUv = current?.current?.uvIndex ?? -1;
    const isDayNow = current?.current?.isDay === 1;
    let futUv = -1, futTime = "";
    if (hourly?.uvIndex) {
      const endMs = nowMs + 6 * 3600_000;
      for (let k = 0; k < hourly.time.length; k++) {
        const ms = parseAsUTC(hourly.time[k]!).getTime();
        if (ms <= nowMs || ms > endMs) continue;
        if ((hourly.isDay[k] as number) !== 1) continue;
        const v = hourly.uvIndex[k] ?? -1;
        if (v > futUv) { futUv = v; futTime = hourly.time[k]!; }
      }
    }
    if (isDayNow && nowUv >= 8 && shouldNotify(`uv-now-${todayStr}`, 12)) {
      showNotification("Very high UV now", `UV ${nowUv.toFixed(1)} — limit sun exposure, use sunscreen.`, `uv-now-${todayStr}`);
      markNotified(`uv-now-${todayStr}`);
    } else if (isDayNow && futUv >= 8 && futTime && shouldNotify(`uv-ahead-${todayStr}`, 12)) {
      showNotification("Very high UV coming", `UV ${futUv.toFixed(1)} around ${fmtTimeFromISO(futTime)} — plan shade.`, `uv-ahead-${todayStr}`);
      markNotified(`uv-ahead-${todayStr}`);
    }

    const w = current?.current;
    if (w && STORM.has(w.weatherCode) && shouldNotify(`current-storm-${todayStr}`, 6)) {
      showNotification("Thunderstorm now", "Thunderstorm activity detected near you.", `current-storm-${todayStr}`);
      markNotified(`current-storm-${todayStr}`);
    }
  }, [enabled, daily, current, hourlyData, aqiData, timezone]);

  // Meteor shower peaks within 2 days
  useEffect(() => {
    if (!enabled || !canNotify()) return;
    const next = getNextShowers(3);
    for (const { shower, peakDate } of next) {
      const hoursAway = (peakDate.getTime() - Date.now()) / 3600000;
      if (hoursAway >= 0 && hoursAway <= 48) {
        const key = `meteor-${shower.name}-${peakDate.toISOString().slice(0, 10)}`;
        if (shouldNotify(key, 24)) {
          showNotification(`${shower.name} peak tonight!`, `${shower.description} ZHR ${shower.zhr} — look to ${shower.radiant} after dark.`, key);
          markNotified(key);
        }
      }
    }
  }, [enabled]);

  return { enabled, permission, request, disable, toggle, canNotify: canNotify() };
}
