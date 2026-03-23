/* ─── Time formatter (astronomy - works with real Date objects) ─── */
export function fmtTime(date: Date | null, tz?: string): string {
  if (!date) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

export function fmtShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function fmtDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

/** Format a millisecond duration as "X hr Y m". */
export function fmtDurationMs(ms: number): string {
  const totalMin = Math.floor(Math.abs(ms) / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr`);
  if (m > 0 || h === 0) parts.push(`${m} m`);
  return parts.join(" ");
}

/** Format azimuth degrees into compass directions. */
export function fmtAzimuth(degrees: number): string {
  const val = Math.floor(degrees / 22.5 + 0.5);
  const arr = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return arr[val % 16] ?? "N";
}

/* ──────────────────────────────────────────────────────────────────
 * Weather component formatters
 *
 * Open-Meteo returns naive ISO strings (e.g. "2024-01-15T14:30")
 * that represent wall-clock time in the searched city's timezone.
 * new Date() parses these as device-local time, so we can't just
 * add { timeZone } to toLocaleString — that would double-shift.
 *
 * Fix: treat the naive string as UTC by appending "Z", then format
 * with the target timezone set to UTC. This ensures the raw
 * hour/minute values display exactly as the API intended regardless
 * of the device's timezone.
 * ────────────────────────────────────────────────────────────────── */


const UTC = "UTC";

/** Format a naive ISO time string as "2:30 PM" — timezone-safe. */
export function fmtTimeFromISO(isoStr: string): string {
  const d = parseAsUTC(isoStr);
  return d.toLocaleString("default", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: UTC,
  });
}

/** Format a naive ISO string as "15 January 2024" — timezone-safe. */
export function fmtDateLong(isoStr: string): string {
  const d = parseAsUTC(isoStr);
  return d.toLocaleString("default", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: UTC,
  });
}

/** Format a naive ISO string as "15 Jan" — timezone-safe. */
export function fmtDateShortFromISO(isoStr: string): string {
  const d = parseAsUTC(isoStr);
  return d.toLocaleString("default", {
    day: "2-digit",
    month: "short",
    timeZone: UTC,
  });
}

/** Format a naive ISO string as weekday "Mon" — timezone-safe. */
export function fmtWeekdayFromISO(isoStr: string): string {
  const d = parseAsUTC(isoStr);
  return d.toLocaleString("default", {
    weekday: "short",
    timeZone: UTC,
  });
}

/** Get the date portion (YYYY-MM-DD) from a naive ISO string for day comparison. */
export function getDateOnlyFromISO(isoStr: string): string {
  return isoStr.slice(0, 10);
}

/**
 * Parse a naive ISO string as UTC so all timestamps live in a
 * consistent "UTC-pretending-to-be-local" space.
 * Exported so components can use it for timestamp comparisons.
 */
export function parseAsUTC(isoStr: string): Date {
  if (isoStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(isoStr)) {
    return new Date(isoStr);
  }
  return new Date(isoStr + "Z");
}

/**
 * Get "now" in a target timezone, returned as a UTC-ms value that
 * lives in the same pretend-UTC space as parseAsUTC timestamps.
 *
 * How it works:
 * 1. Format the real current instant in the target timezone as
 *    a naive ISO string (the city's wall-clock right now).
 * 2. Parse that string as UTC → consistent comparison with API data.
 */
export function getNowAsUTC(tz: string): number {
  const now = new Date();
  // Build a naive ISO string for the target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const isoStr = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`;
  return new Date(isoStr).getTime();
}
