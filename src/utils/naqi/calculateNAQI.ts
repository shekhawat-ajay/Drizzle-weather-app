/**
 * ================================================================
 *  India NAQI (National Air Quality Index) Calculator
 *  Based on CPCB (Central Pollution Control Board) IND-AQI Standard
 *
 *  Input  : ~48-hour hourly pollutant data (refreshed every hour)
 *  Method :
 *    1. Detect current local time from system clock + data's UTC offset
 *    2. Find matching index in time array
 *    3. Look BACK 24 hours from that index
 *    4. 24-hr avg → PM10, PM2.5, NO₂, SO₂, NH₃
 *    5. 8-hr max rolling avg (within that 24-hr window) → CO, O₃
 *    6. Sub-index per pollutant via breakpoint interpolation
 *    7. Overall AQI = max(sub-indices)
 *
 *  Validation:
 *    - ≥3 pollutants with valid sub-indices
 *    - Must include at least PM10 or PM2.5
 *    - 24-hr avg requires ≥16 valid hours
 *    - 8-hr rolling window requires ≥6 valid hours per window
 * ================================================================
 */

import type {
  AirQualityHourlyData,
  NAQIResult,
  PollutantResult,
} from "./types";

// ─── BREAKPOINT TABLES ──────────────────────────────────
// [BPLo, BPHi, AQI_Lo, AQI_Hi]

type BreakpointRow = [number, number, number, number];

const BREAKPOINTS: Record<string, BreakpointRow[]> = {
  pm10: [
    [0, 50, 0, 50],
    [50, 100, 50, 100],
    [100, 250, 100, 200],
    [250, 350, 200, 300],
    [350, 430, 300, 400],
    [430, 510, 400, 500],
  ],
  pm25: [
    [0, 30, 0, 50],
    [30, 60, 50, 100],
    [60, 90, 100, 200],
    [90, 120, 200, 300],
    [120, 250, 300, 400],
    [250, 380, 400, 500],
  ],
  no2: [
    [0, 40, 0, 50],
    [40, 80, 50, 100],
    [80, 180, 100, 200],
    [180, 280, 200, 300],
    [280, 400, 300, 400],
    [400, 520, 400, 500],
  ],
  so2: [
    [0, 40, 0, 50],
    [40, 80, 50, 100],
    [80, 380, 100, 200],
    [380, 800, 200, 300],
    [800, 1600, 300, 400],
    [1600, 2100, 400, 500],
  ],
  nh3: [
    [0, 200, 0, 50],
    [200, 400, 50, 100],
    [400, 800, 100, 200],
    [800, 1200, 200, 300],
    [1200, 1800, 300, 400],
    [1800, 2400, 400, 500],
  ],
  co: [
    [0, 1.0, 0, 50],
    [1.0, 2.0, 50, 100],
    [2.0, 10.0, 100, 200],
    [10.0, 17.0, 200, 300],
    [17.0, 34.0, 300, 400],
    [34.0, 46.0, 400, 500],
  ],
  o3: [
    [0, 50, 0, 50],
    [50, 100, 50, 100],
    [100, 168, 100, 200],
    [168, 208, 200, 300],
    [208, 748, 300, 400],
    [748, 948, 400, 500],
  ],
};

// ─── AQI CATEGORIES ─────────────────────────────────────

export const NAQI_CATEGORIES = [
  { min: 0, max: 50, label: "Good", color: "green" },
  { min: 51, max: 100, label: "Satisfactory", color: "lightgreen" },
  { min: 101, max: 200, label: "Moderate", color: "yellow" },
  { min: 201, max: 300, label: "Poor", color: "orange" },
  { min: 301, max: 400, label: "Very Poor", color: "red" },
  { min: 401, max: 500, label: "Severe", color: "darkred" },
] as const;

// ─── POLLUTANT CONFIG ───────────────────────────────────

interface PollutantConfig {
  bp: string;
  label: string;
  avg: "24hr" | "8hr";
  unit: string;
  conv: (v: number) => number;
}

const POLLUTANT_MAP: Record<string, PollutantConfig> = {
  pm10: {
    bp: "pm10",
    label: "PM₁₀",
    avg: "24hr",
    unit: "μg/m³",
    conv: (v) => v,
  },
  pm25: {
    bp: "pm25",
    label: "PM₂.₅",
    avg: "24hr",
    unit: "μg/m³",
    conv: (v) => v,
  },
  nitrogenDioxide: {
    bp: "no2",
    label: "NO₂",
    avg: "24hr",
    unit: "μg/m³",
    conv: (v) => v,
  },
  sulphurDioxide: {
    bp: "so2",
    label: "SO₂",
    avg: "24hr",
    unit: "μg/m³",
    conv: (v) => v,
  },
  ammonia: {
    bp: "nh3",
    label: "NH₃",
    avg: "24hr",
    unit: "μg/m³",
    conv: (v) => v,
  },
  carbonMonoxide: {
    bp: "co",
    label: "CO",
    avg: "8hr",
    unit: "mg/m³",
    conv: (v) => v / 1000, // API: μg/m³ → NAQI needs mg/m³
  },
  ozone: {
    bp: "o3",
    label: "O₃",
    avg: "8hr",
    unit: "μg/m³",
    conv: (v) => v,
  },
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────

/** Mean of non-null values. Returns null if no valid values. */
function mean(arr: (number | null)[]): number | null {
  const valid = arr.filter((v): v is number => v != null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

/**
 * Maximum 8-hour rolling average within a given array.
 * Each 8-hr window requires ≥6 valid (non-null) values.
 */
function max8hrRollingAvg(arr: (number | null)[]): number | null {
  if (arr.length < 8) return null;

  let maxAvg: number | null = null;

  for (let i = 0; i <= arr.length - 8; i++) {
    const window = arr.slice(i, i + 8);
    const validCount = window.filter(
      (v): v is number => v != null && !isNaN(v),
    ).length;
    if (validCount < 6) continue;

    const avg = mean(window);
    if (avg !== null && (maxAvg === null || avg > maxAvg)) {
      maxAvg = avg;
    }
  }

  return maxAvg;
}

/**
 * Sub-index via linear interpolation:
 *   Ip = ((IHi - ILo) / (BPHi - BPLo)) × (Cp - BPLo) + ILo
 */
function calcSubIndex(cp: number | null, bpKey: string): number | null {
  const table = BREAKPOINTS[bpKey];
  if (!table || cp == null || cp < 0) return null;

  for (const [bpLo, bpHi, iLo, iHi] of table) {
    if (cp >= bpLo && cp <= bpHi) {
      if (bpHi === bpLo) return iLo;
      return ((iHi - iLo) / (bpHi - bpLo)) * (cp - bpLo) + iLo;
    }
  }

  // Exceeds highest breakpoint → cap at 500
  const lastRow = table[table.length - 1];
  if (lastRow && cp > lastRow[1]) return 500;

  return null;
}

/** Look up AQI category by value */
export function getCategory(aqi: number) {
  return (
    NAQI_CATEGORIES.find((c) => aqi >= c.min && aqi <= c.max) || {
      label: "Beyond Scale",
      color: "darkred" as const,
    }
  );
}

// ─── TIME LOOKUP ────────────────────────────────────────

function findCurrentIndex(times: string[], utcOffsetSeconds: number) {
  const now = new Date();
  const localMs = now.getTime() + utcOffsetSeconds * 1000;
  const local = new Date(localMs);

  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  const hr = String(local.getUTCHours()).padStart(2, "0");
  const currentTimeStr = `${y}-${m}-${d}T${hr}:00`;

  // Strategy 1: exact match
  const idx = times.indexOf(currentTimeStr);
  if (idx !== -1) {
    return { idx, currentTimeStr, strategy: "exact" as const };
  }

  // Strategy 2: latest entry ≤ current time
  for (let i = times.length - 1; i >= 0; i--) {
    if ((times[i] ?? "") <= currentTimeStr) {
      return { idx: i, currentTimeStr, strategy: "nearest_past" as const };
    }
  }

  // Strategy 3: fallback to latest available
  return {
    idx: times.length - 1,
    currentTimeStr,
    strategy: "fallback_latest" as const,
  };
}

// ─── MAIN NAQI CALCULATOR ───────────────────────────────

export function calculateNAQI(data: AirQualityHourlyData): NAQIResult {
  const h = data.hourly;
  const times = h.time as string[];
  const totalHours = times.length;

  // Step 1: Locate current time in data
  const {
    idx: currentIdx,
    currentTimeStr,
    strategy,
  } = findCurrentIndex(times, data.utcOffsetSeconds);

  const availableHistory = currentIdx + 1;

  if (availableHistory < 24) {
    throw new Error(
      `Insufficient history: need 24 hours, but only ${availableHistory} hour(s) ` +
        `available before ${currentTimeStr}. ` +
        `Data range: ${times[0]} → ${times[totalHours - 1]}.`,
    );
  }

  // Step 2: Define 24-hour lookback window
  const startIdx = currentIdx - 23; // 24 values inclusive
  const endIdx = currentIdx + 1; // exclusive for .slice()
  const periodFrom = times[startIdx] ?? "";
  const periodTo = times[currentIdx] ?? "";

  // Step 3: Evaluate every pollutant dynamically
  const pollutantResults: Record<string, PollutantResult> = {};
  const skippedPollutants: Record<string, string> = {};

  for (const [dataKey, cfg] of Object.entries(POLLUTANT_MAP)) {
    const raw = h[dataKey] as (number | null)[] | undefined;

    if (!raw) {
      skippedPollutants[cfg.label] = "Key missing from data";
      continue;
    }

    const slice = raw.slice(startIdx, endIdx);
    const validCount = slice.filter(
      (v): v is number => v != null && !isNaN(v),
    ).length;
    const totalInSlice = slice.length;

    if (validCount === 0) {
      skippedPollutants[cfg.label] = `All ${totalInSlice} values are null`;
      continue;
    }

    let concentration: number | null = null;

    if (cfg.avg === "24hr") {
      if (validCount < 16) {
        skippedPollutants[cfg.label] =
          `Only ${validCount}/24 valid hours (need ≥16 for 24-hr avg)`;
        continue;
      }
      concentration = mean(slice);
      if (concentration === null) {
        skippedPollutants[cfg.label] = "Mean returned null unexpectedly";
        continue;
      }
      concentration = cfg.conv(concentration);
    } else {
      if (validCount < 8) {
        skippedPollutants[cfg.label] =
          `Only ${validCount}/24 valid hours (need ≥8 for 8-hr rolling avg)`;
        continue;
      }
      const converted = slice.map((v) =>
        v != null && !isNaN(v) ? cfg.conv(v) : null,
      );
      concentration = max8hrRollingAvg(converted);
      if (concentration === null) {
        skippedPollutants[cfg.label] =
          "No valid 8-hr window found (each window needs ≥6 valid hours)";
        continue;
      }
    }

    const si = calcSubIndex(concentration, cfg.bp);
    if (si === null) {
      skippedPollutants[cfg.label] =
        `Concentration ${concentration.toFixed(2)} didn't match any breakpoint range`;
      continue;
    }

    pollutantResults[cfg.bp] = {
      label: cfg.label,
      dataKey,
      concentration: +concentration.toFixed(2),
      unit: cfg.unit,
      avgType: cfg.avg === "24hr" ? "24-hr average" : "8-hr max rolling avg",
      validHours: validCount,
      totalHours: totalInSlice,
      subIndex: Math.round(si),
      category: getCategory(Math.round(si)).label,
    };
  }

  // Step 4: Validate minimum requirements
  const validKeys = Object.keys(pollutantResults);
  const validLabels = validKeys.map((k) => pollutantResults[k]!.label);

  const hasPM10 = validKeys.includes("pm10");
  const hasPM25 = validKeys.includes("pm25");

  if (!hasPM10 && !hasPM25) {
    throw new Error(
      "NAQI requires at least PM10 or PM2.5, but neither has sufficient valid data.\n" +
        `Valid pollutants: [${validLabels.join(", ")}]\n` +
        `Skipped: ${JSON.stringify(skippedPollutants, null, 2)}`,
    );
  }

  if (validKeys.length < 3) {
    throw new Error(
      `NAQI requires ≥3 valid pollutants, but only ${validKeys.length} available: ` +
        `[${validLabels.join(", ")}].\n` +
        `Skipped: ${JSON.stringify(skippedPollutants, null, 2)}`,
    );
  }

  // Step 5: Overall AQI = max(sub-indices)
  let aqi = 0;
  let prominentPollutant = "";
  let prominentBpKey = "";

  for (const [key, info] of Object.entries(pollutantResults)) {
    if (info.subIndex > aqi) {
      aqi = info.subIndex;
      prominentPollutant = info.label;
      prominentBpKey = key;
    }
  }

  const category = getCategory(aqi);

  // Step 6: Extract EU and US AQI for current hour
  const europeanAqiArr = h.europeanAqi as (number | null)[] | undefined;
  const usAqiArr = h.usAqi as (number | null)[] | undefined;
  const europeanAqi = europeanAqiArr?.[currentIdx] ?? null;
  const usAqi = usAqiArr?.[currentIdx] ?? null;

  return {
    aqi,
    category: category.label,
    color: category.color,
    prominentPollutant,
    prominentBpKey,
    europeanAqi,
    usAqi,
    period: { from: periodFrom, to: periodTo },
    currentTime: currentTimeStr,
    matchStrategy: strategy,
    dataRange: { from: times[0] ?? "", to: times[totalHours - 1] ?? "" },
    totalDataHours: totalHours,
    validPollutantCount: validKeys.length,
    skippedPollutants,
    pollutants: pollutantResults,
  };
}
