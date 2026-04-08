import { useOutletContext } from "react-router";
import { Moon, Ruler, Calendar, ArrowDownToLine, ArrowUpFromLine, Eclipse, Sparkles, Info } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import AstroCard from "@/components/astronomy/AstroCard";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import MoonPositionArc from "@/components/astronomy/MoonPositionArc";
import MoonPhaseTimeline from "@/components/astronomy/MoonPhaseTimeline";
import { fmtTime, fmtShortDate } from "@/utils/formatters";
import type { AstronomyOutletContext } from "@/pages/AstronomyPage";

export default function MoonPage() {
  const { tz, astronomyData } = useOutletContext<AstronomyOutletContext>();
  const { moon, moonPosition, fullMoonCycle, distanceExtremes, supermoonInfo } = astronomyData;

  const moonBelow = !moonPosition.isAboveHorizon;
  const moonriseTime = moonBelow
    ? moonPosition.nextEvent
    : moonPosition.previousEvent;

  const moonsetTime = moonBelow
    ? moonPosition.previousEvent
    : moonPosition.nextEvent;

  return (
    <div className="space-y-4">
      <div>
        <SectionHeader icon={Moon} label="Moon" color="text-violet-400" />

        {/* ── Hero: Current Moon Phase Image ── */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="relative">
            <img
              src={fullMoonCycle.current.icon}
              alt={fullMoonCycle.current.phaseName}
              className="size-68 rounded-full object-cover ring-2 ring-violet-500/20"
              onError={(e) => {
                e.currentTarget.src = fullMoonCycle.current.iconFallback;
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-base-content text-lg font-semibold">
              {fullMoonCycle.current.phaseName}
            </p>
            <p className="text-base-content/40 text-sm">
              {Math.round(fullMoonCycle.current.illuminationPercent)}% illuminated ·{" "}
              {Math.round(fullMoonCycle.current.exactAngle)}°
            </p>
          </div>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid gap-3 md:grid-cols-4">
          <AstroCard
            icon={Calendar}
            title="Moon Age"
            value={`${moon.moonAge.toFixed(1)} days`}
            sub="Into current lunation"
            accent="violet"
          />
          <AstroCard
            icon={Ruler}
            title="Distance"
            value={`${(moon.distanceKm / 1000).toFixed(0)}k km`}
            sub={
              moon.distanceKm < 363300
                ? "Near perigee"
                : moon.distanceKm > 405500
                  ? "Near apogee"
                  : "Average distance"
            }
            accent="cyan"
          />
          <AstroCard
            imageSrc="/moonrise.svg"
            title="Moonrise"
            value={fmtTime(moonriseTime, tz)}
            badge={
              <CountdownBadge
                target={moonriseTime}
                className="bg-violet-500/10 text-violet-400"
              />
            }
            accent="violet"
          />
          <AstroCard
            imageSrc="/moonset.svg"
            title="Moonset"
            value={fmtTime(moonsetTime, tz)}
            badge={
              <CountdownBadge
                target={moonsetTime}
                className="bg-violet-500/10 text-violet-400"
              />
            }
            accent="violet"
          />
        </div>

        {/* ── Moon Position Arc ── */}
        <div className="mt-4">
          <MoonPositionArc
            moonPosition={moonPosition}
            phaseIcon={moon.icon}
            timezone={tz}
          />
        </div>

        {/* ── Upcoming Phases ── */}
        <div className="mt-4">
          <MoonPhaseTimeline phases={fullMoonCycle.upcoming} />
        </div>

        {/* ── Distance Extremes & Major Events ── */}
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="card card-border border-cyan-500/10 bg-base-200/40 group hover:bg-base-200/60 transition-colors">
            <div className="card-body p-5 gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
                  <ArrowDownToLine size={16} />
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">Next Perigee</p>
                  <div className="tooltip tooltip-top z-[100]" data-tip="The point in the Moon's orbit closest to Earth.">
                    <button type="button" className="cursor-help" aria-label="Info about Perigee">
                      <Info className="text-base-content/40 hover:text-base-content/80 h-3.5 w-3.5 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-base-content text-xl font-semibold">{(distanceExtremes.nextPerigee.distanceKm / 1000).toFixed(0)}k <span className="text-sm font-normal text-base-content/50">km</span></p>
              <p className="text-base-content/40 text-xs">{fmtShortDate(distanceExtremes.nextPerigee.time)}</p>
              {distanceExtremes.nextPerigee.isClosest && (
                <div className="mt-1">
                  <div className="badge badge-error badge-sm">Year's Closest</div>
                </div>
              )}
            </div>
          </div>

          <div className="card card-border border-cyan-500/10 bg-base-200/40 group hover:bg-base-200/60 transition-colors">
            <div className="card-body p-5 gap-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
                  <ArrowUpFromLine size={16} />
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">Next Apogee</p>
                  <div className="tooltip tooltip-top z-[100]" data-tip="The point in the Moon's orbit farthest from Earth.">
                    <button type="button" className="cursor-help" aria-label="Info about Apogee">
                      <Info className="text-base-content/40 hover:text-base-content/80 h-3.5 w-3.5 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-base-content text-xl font-semibold">{(distanceExtremes.nextApogee.distanceKm / 1000).toFixed(0)}k <span className="text-sm font-normal text-base-content/50">km</span></p>
              <p className="text-base-content/40 text-xs">{fmtShortDate(distanceExtremes.nextApogee.time)}</p>
            </div>
          </div>

          {astronomyData.upcomingEclipses.filter(e => e.kind === "lunar").slice(0, 2).map((eclipse, i) => (
            <div key={i} className="card card-border border-red-500/10 bg-base-200/40 group hover:bg-base-200/60 transition-colors md:col-span-1 lg:col-span-1">
              <div className="card-body p-5 gap-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-500/10 p-2 rounded-lg text-red-400">
                      <Eclipse size={16} />
                    </div>
                    <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
                      {i === 0 ? "Next Eclipse" : "Later Eclipse"}
                    </p>
                  </div>
                  {eclipse.isLocal && (
                    <div className="badge badge-error badge-sm opacity-80 text-xs">Visible</div>
                  )}
                </div>
                <p className="text-base-content text-xl font-semibold capitalize flex items-center gap-2">
                  {eclipse.type}
                </p>
                <p className="text-base-content/40 text-xs">
                  {fmtShortDate(eclipse.peak)}
                </p>
                <div className="mt-1">
                  <CountdownBadge target={eclipse.peak} className="bg-red-500/10 text-red-400" />
                </div>
              </div>
            </div>
          ))}

          {supermoonInfo.nextSupermoon && (
            <div className="card card-border border-warning/10 bg-base-200/40 group hover:bg-base-200/60 transition-colors md:col-span-1 lg:col-span-1">
              <div className="card-body p-5 gap-1">
                 <div className="flex items-center gap-2 mb-1">
                  <div className="bg-warning/10 p-2 rounded-lg text-warning">
                    <Sparkles size={16} />
                  </div>
                  <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">Supermoon</p>
                </div>
                <p className="text-base-content text-xl font-semibold">Full Moon</p>
                <p className="text-base-content/40 text-xs">
                  +{(supermoonInfo.nextSupermoon.sizeRatioVsAverage - 1).toFixed(2)}x visual scale
                </p>
                <div className="mt-1">
                  <CountdownBadge target={supermoonInfo.nextSupermoon.fullMoonTime} className="bg-warning/10 text-warning" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
