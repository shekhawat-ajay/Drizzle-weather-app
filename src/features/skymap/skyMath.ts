// Minimal horizon math for the Sky Map slice.
// Standard formulas (Meeus): JD = epochMillis/86400000 + 2440587.5,
// LST = 280.461 + 360.98564737 * (JD - 2451545.0) + lon, hour angle -> alt/az.
// Independent re-implementation for the web app; not copied from Sky Map sources.

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function normalizeDegrees(d: number): number {
  const n = d % 360;
  return n < 0 ? n + 360 : n;
}

export function meanSiderealTimeDeg(date: Date, lonDeg: number): number {
  const delta = julianDay(date) - 2451545.0;
  return normalizeDegrees(280.461 + 360.98564737 * delta + lonDeg);
}

export interface AltAz {
  alt: number;
  az: number;
}

export function raDecToAltAz(
  raDeg: number,
  decDeg: number,
  date: Date,
  latDeg: number,
  lonDeg: number,
): AltAz {
  const lst = meanSiderealTimeDeg(date, lonDeg);
  const haDeg = normalizeDegrees(lst - raDeg);
  const ha = haDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const lat = latDeg * DEG2RAD;
  const sinAlt =
    Math.sin(dec) * Math.sin(lat) +
    Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAz =
    (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) /
    (Math.cos(alt) * Math.cos(lat));
  const sinAz = (-Math.sin(ha) * Math.cos(dec)) / Math.cos(alt);
  let az = Math.atan2(sinAz, cosAz) * RAD2DEG;
  az = normalizeDegrees(az);
  return { alt: alt * RAD2DEG, az };
}
