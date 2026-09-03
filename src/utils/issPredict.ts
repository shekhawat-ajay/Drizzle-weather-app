/**
 * ISS pass prediction via local SGP4 propagation (satellite.js) + CelesTrak TLE.
 *
 * Why not wheretheiss.at positions API?
 * - 10-min sampling SKIPS passes (ISS moves 4600 km per sample; a
 *   1200 km-radius window lasts ~5 min, so most passes fall between samples).
 * - 14 parallel batched requests hit rate limits; partial failures = gaps.
 * - Haversine <1200 km misses low-elevation passes other apps show.
 *
 * This module propagates the orbit locally at 60 s steps for 7 days
 * (~10k SGP4 calls, <200 ms), then detects windows by true topocentric
 * elevation with observer-darkness + ISS-sunlight checks.
 */

import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from "satellite.js";
import { Body, Equator, Horizon, Observer } from "astronomy-engine";

export interface ISSPass {
  startMs: number;
  endMs: number;
  maxElevDeg: number;
  closestKm: number;
  durationMin: number;
  observerSunAlt: number;
  issSunlit: boolean;
  visible: boolean;
}

const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";
const TLE_CACHE_KEY = "drizzle-iss-tle";
const TLE_MAX_AGE_MS = 12 * 3600000;
const EARTH_R_KM = 6371;

interface TLE {
  line1: string;
  line2: string;
}

let tleMemory: { tle: TLE; fetchedAt: number } | null = null;

async function fetchTLE(): Promise<TLE | null> {
  const now = Date.now();
  if (tleMemory && now - tleMemory.fetchedAt < TLE_MAX_AGE_MS) return tleMemory.tle;
  try {
    const raw = localStorage.getItem(TLE_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { line1: string; line2: string; fetchedAt: number };
      if (cached.line1 && cached.line2 && now - cached.fetchedAt < TLE_MAX_AGE_MS) {
        tleMemory = { tle: { line1: cached.line1, line2: cached.line2 }, fetchedAt: cached.fetchedAt };
        return tleMemory.tle;
      }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch(TLE_URL);
    if (!res.ok) return tleMemory?.tle ?? null;
    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    // Format: name line, line1 (starts with "1 "), line2 (starts with "2 ")
    const line1 = lines.find((l) => l.startsWith("1 "));
    const line2 = lines.find((l) => l.startsWith("2 "));
    if (!line1 || !line2) return tleMemory?.tle ?? null;
    const tle = { line1, line2 };
    tleMemory = { tle, fetchedAt: now };
    try {
      localStorage.setItem(TLE_CACHE_KEY, JSON.stringify({ ...tle, fetchedAt: now }));
    } catch { /* ignore */ }
    return tle;
  } catch {
    return tleMemory?.tle ?? null;
  }
}

/** Sun ECI unit vector (geocentric, toward the Sun) at a given date. */
function sunUnitVector(date: Date, observer: Observer): [number, number, number] {
  const equ = Equator(Body.Sun, date, observer, true, true);
  const raRad = ((equ.ra * 15) * Math.PI) / 180; // hours -> deg -> rad
  const decRad = (equ.dec * Math.PI) / 180;
  return [
    Math.cos(decRad) * Math.cos(raRad),
    Math.cos(decRad) * Math.sin(raRad),
    Math.sin(decRad),
  ];
}

/** Cylindrical Earth-shadow test: true if ISS is sunlit. */
function isIssSunlit(
  rEci: { x: number; y: number; z: number },
  sun: [number, number, number],
): boolean {
  const rx = rEci.x, ry = rEci.y, rz = rEci.z;
  const sDotR = sun[0] * rx + sun[1] * ry + sun[2] * rz;
  if (sDotR > 0) return true; // sunward side
  const r2 = rx * rx + ry * ry + rz * rz;
  const perp2 = r2 - sDotR * sDotR;
  return Math.sqrt(Math.max(0, perp2)) >= EARTH_R_KM;
}

/** Topocentric elevation (deg) from observer to subpoint at ground distance. */
export function elevationFromGroundDist(distKm: number, altKm: number): number {
  const c = distKm / EARTH_R_KM;
  const R = EARTH_R_KM;
  const h = altKm;
  const slant = Math.sqrt((R + h) ** 2 + R * R - 2 * R * (R + h) * Math.cos(c));
  if (slant <= 0) return 90;
  const sinElev = ((R + h) * Math.cos(c) - R) / slant;
  return (Math.asin(Math.max(-1, Math.min(1, sinElev))) * 180) / Math.PI;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(a));
}

export async function predictISSPasses(
  latitude: number,
  longitude: number,
  days = 7,
  stepSec = 60,
  minElevDeg = 10,
): Promise<{ passes: ISSPass[]; tleAge: string }> {
  const tle = await fetchTLE();
  if (!tle) return { passes: [], tleAge: "unavailable" };

  const satrec = twoline2satrec(tle.line1, tle.line2);
  const observer = new Observer(latitude, longitude, 0);
  const startMs = Date.now();
  const totalSteps = Math.floor((days * 86400) / stepSec);

  interface Sample {
    t: number;
    elev: number;
    dist: number;
    sunAlt: number;
    sunlit: boolean;
  }
  const samples: Sample[] = [];

  for (let i = 0; i <= totalSteps; i++) {
    const t = new Date(startMs + i * stepSec * 1000);
    const pv = propagate(satrec, t);
    const pos = pv?.position;
    if (!pos || typeof pos.x !== "number") continue;
    const gmst = gstime(t);
    const geo = eciToGeodetic(pos, gmst);
    const subLat = degreesLat(geo.latitude);
    const subLon = degreesLong(geo.longitude);
    const altKm = geo.height;
    const dist = haversineKm(latitude, longitude, subLat, subLon);
    // Horizon grazing distance for ISS alt ~420 km is ~2300 km; skip far points cheaply
    if (dist > 2500) continue;
    const elev = elevationFromGroundDist(dist, altKm);
    if (elev < 0) continue;
    // Sun checks only for candidate points (elev >= 0 within 2500 km)
    const equ = Equator(Body.Sun, t, observer, true, true);
    const hor = Horizon(t, observer, equ.ra, equ.dec, "normal");
    const sun = sunUnitVector(t, observer);
    const sunlit = isIssSunlit(pos as { x: number; y: number; z: number }, sun);
    samples.push({ t: t.getTime(), elev, dist, sunAlt: hor.altitude, sunlit });
  }

  // Group consecutive samples (gap > 3 steps splits) into windows above minElev
  const passes: ISSPass[] = [];
  let cur: Sample[] = [];
  const flush = () => {
    if (cur.length === 0) return;
    let peak = cur[0]!;
    for (const s of cur) if (s.elev > peak.elev) peak = s;
    if (peak.elev >= minElevDeg) {
      passes.push({
        startMs: cur[0]!.t,
        endMs: cur[cur.length - 1]!.t,
        maxElevDeg: Math.round(peak.elev),
        closestKm: Math.round(Math.min(...cur.map((s) => s.dist))),
        durationMin: Math.max(1, Math.round((cur[cur.length - 1]!.t - cur[0]!.t) / 60000)),
        observerSunAlt: Math.round(peak.sunAlt * 10) / 10,
        issSunlit: peak.sunlit,
        visible: peak.sunAlt < -6 && peak.sunlit,
      });
    }
    cur = [];
  };

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    if (cur.length === 0) {
      if (s.elev >= minElevDeg) cur.push(s);
      continue;
    }
    const gapMin = (s.t - cur[cur.length - 1]!.t) / 60000;
    if (gapMin > 3.5 || s.elev < minElevDeg) {
      flush();
      if (s.elev >= minElevDeg) cur.push(s);
    } else {
      cur.push(s);
    }
  }
  flush();

  const ageHrs = tleMemory ? Math.round((Date.now() - tleMemory.fetchedAt) / 3600000) : -1;
  return {
    passes: passes.slice(0, 14),
    tleAge: ageHrs < 0 ? "cached" : ageHrs === 0 ? "fresh (<1h)" : `${ageHrs}h old`,
  };
}
