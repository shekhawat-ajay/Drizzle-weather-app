export interface MeteorShower {
  name: string;
  parent: string;
  peakMonth: number; // 1-12
  peakDay: number;
  activeStart: string; // MM-DD
  activeEnd: string;
  zhr: number;
  velocityKms: number;
  radiant: string;
  description: string;
}

export const METEOR_SHOWERS: MeteorShower[] = [
  { name: "Quadrantids", parent: "2003 EH1", peakMonth: 1, peakDay: 3, activeStart: "12-28", activeEnd: "01-12", zhr: 80, velocityKms: 41, radiant: "Boötes", description: "Sharp peak, bright fireballs from asteroid 2003 EH1." },
  { name: "Lyrids", parent: "C/1861 G1 Thatcher", peakMonth: 4, peakDay: 22, activeStart: "04-16", activeEnd: "04-25", zhr: 18, velocityKms: 49, radiant: "Lyra", description: "Ancient shower, occasional outbursts; fast streaks." },
  { name: "Eta Aquariids", parent: "1P/Halley", peakMonth: 5, peakDay: 6, activeStart: "04-19", activeEnd: "05-28", zhr: 50, velocityKms: 66, radiant: "Aquarius", description: "Halley debris, pre-dawn best in southern latitudes." },
  { name: "Perseids", parent: "109P/Swift-Tuttle", peakMonth: 8, peakDay: 12, activeStart: "07-17", activeEnd: "08-24", zhr: 100, velocityKms: 59, radiant: "Perseus", description: "Most popular, bright meteors and fireballs." },
  { name: "Orionids", parent: "1P/Halley", peakMonth: 10, peakDay: 21, activeStart: "10-02", activeEnd: "11-07", zhr: 20, velocityKms: 66, radiant: "Orion", description: "Halley’s autumn branch, fast and faint." },
  { name: "Leonids", parent: "55P/Tempel-Tuttle", peakMonth: 11, peakDay: 17, activeStart: "11-06", activeEnd: "11-30", zhr: 15, velocityKms: 71, radiant: "Leo", description: "Famous for historic storms every 33 years." },
  { name: "Geminids", parent: "3200 Phaethon", peakMonth: 12, peakDay: 14, activeStart: "12-04", activeEnd: "12-17", zhr: 150, velocityKms: 35, radiant: "Gemini", description: "Brightest annual shower, slow colorful meteors." },
  { name: "Ursids", parent: "8P/Tuttle", peakMonth: 12, peakDay: 22, activeStart: "12-17", activeEnd: "12-26", zhr: 10, velocityKms: 33, radiant: "Ursa Minor", description: "Modest winter shower near winter solstice." },
];

export function getNextShowers(count = 3): { shower: MeteorShower; peakDate: Date; daysAway: number; active: boolean }[] {
  const now = new Date();
  const curYear = now.getFullYear();
  const withDates = METEOR_SHOWERS.map((s) => {
    let peak = new Date(curYear, s.peakMonth - 1, s.peakDay, 2, 0, 0); // 02:00 local peak
    if (peak.getTime() < now.getTime() - 24 * 3600000) {
      peak = new Date(curYear + 1, s.peakMonth - 1, s.peakDay, 2, 0, 0);
    }
    const daysAway = Math.round((peak.getTime() - now.getTime()) / (24 * 3600000));
    // active check: is now within activeStart–activeEnd window (handles year wrap)
    const [sM, sD] = s.activeStart.split("-").map(Number) as [number, number];
    const [eM, eD] = s.activeEnd.split("-").map(Number) as [number, number];
    const startThisYear = new Date(curYear, sM - 1, sD);
    const endThisYear = new Date(curYear, eM - 1, eD);
    let active = false;
    if (sM > eM) { // wraps year (e.g., 12-28 to 01-12)
      active = now >= startThisYear || now <= endThisYear;
    } else {
      active = now >= startThisYear && now <= endThisYear;
    }
    return { shower: s, peakDate: peak, daysAway, active };
  });
  withDates.sort((a, b) => a.daysAway - b.daysAway);
  return withDates.slice(0, count);
}
