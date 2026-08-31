import { useEffect, useState, useCallback } from "react";
import useDailyForecast from "@/hooks/weather/useDailyForecast";
import useCurrentWeather from "@/hooks/weather/useCurrentWeather";
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

  // Check alerts when data changes and when enabled
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
    const uv = daily.daily.uvIndexMax?.[i] ?? 0;

    if (prob >= 80 && shouldNotify(`rain-${todayStr}`, 12)) {
      showNotification("Heavy rain expected", `Rain chance ${prob}% today — bring an umbrella.`, `rain-${todayStr}`);
      markNotified(`rain-${todayStr}`);
    }
    if (wind >= 50 && shouldNotify(`wind-${todayStr}`, 12)) {
      showNotification("Strong wind alert", `Wind up to ${Math.round(wind)} km/h expected today.`, `wind-${todayStr}`);
      markNotified(`wind-${todayStr}`);
    }
    if ([95, 96, 99].includes(code) && shouldNotify(`storm-${todayStr}`, 12)) {
      showNotification("Thunderstorm warning", "Thunderstorm expected today — stay safe indoors.", `storm-${todayStr}`);
      markNotified(`storm-${todayStr}`);
    }
    if (uv >= 8 && shouldNotify(`uv-${todayStr}`, 12)) {
      showNotification("High UV index", `UV ${uv.toFixed(1)} — limit sun exposure, use sunscreen.`, `uv-${todayStr}`);
      markNotified(`uv-${todayStr}`);
    }

    const w = current?.current;
    if (w && [95, 96, 99].includes(w.weatherCode) && shouldNotify(`current-storm-${todayStr}`, 6)) {
      showNotification("Thunderstorm now", "Thunderstorm activity detected near you.", `current-storm-${todayStr}`);
      markNotified(`current-storm-${todayStr}`);
    }
  }, [enabled, daily, current, timezone]);

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

  // ISS pass: we rely on ISSPassPrediction's 7-day fetch, but also check here for next pass within 60 min via lightweight check
  // To avoid duplicate fetch, we just check if enabled and let ISSPassPrediction handle detailed; hook here provides toggle state

  return { enabled, permission, request, disable, toggle, canNotify: canNotify() };
}
