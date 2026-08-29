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
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <SectionHeader icon={Moon} label="Moon" color="text-primary" />

          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="relative">
              <img
                src={fullMoonCycle.current.icon}
                alt={fullMoonCycle.current.phaseName}
                className="size-48 sm:size-56 rounded-full object-cover ring-1 ring-primary/20"
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AstroCard
              icon={Calendar}
              title="Moon Age"
              value={`${moon.moonAge.toFixed(1)} days`}
              sub="Into current lunation"
              accent="primary"
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
              accent="primary"
            />
            <AstroCard
              imageSrc="/moonrise.svg"
              title="Moonrise"
              value={fmtTime(moonriseTime, tz)}
              badge={
                <CountdownBadge
                  target={moonriseTime}
                  className="bg-primary/12 text-primary"
                />
              }
              accent="primary"
            />
            <AstroCard
              imageSrc="/moonset.svg"
              title="Moonset"
              value={fmtTime(moonsetTime, tz)}
              badge={
                <CountdownBadge
                  target={moonsetTime}
                  className="bg-primary/12 text-primary"
                />
              }
              accent="primary"
            />
          </div>

          <div className="mt-4">
            <MoonPositionArc
              moonPosition={moonPosition}
              phaseIcon={moon.icon}
              timezone={tz}
            />
          </div>

          <div className="mt-4">
            <MoonPhaseTimeline phases={fullMoonCycle.upcoming} />
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="border-base-content/5 bg-base-200 rounded-xl border p-5">
          <SectionHeader icon={Sparkles} label="Highlights" color="text-primary" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-primary/15 bg-base-300 p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-primary/12 p-2 rounded-lg text-primary">
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
              {distanceExtremes.nextPerigee.isClosest ? (
                <div className="mt-1">
                  <div className="badge badge-sm bg-primary/15 text-primary border-primary/15">Year&apos;s Closest</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-primary/15 bg-base-300 p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-primary/12 p-2 rounded-lg text-primary">
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

            {astronomyData.upcomingEclipses.filter(e => e.kind === "lunar").slice(0, 2).map((eclipse, i) => (
              <div key={eclipse.peak.getTime()} className="rounded-xl border border-primary/15 bg-base-300 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/12 p-2 rounded-lg text-primary">
                      <Eclipse size={16} />
                    </div>
                    <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
                      {i === 0 ? "Next Eclipse" : "Later Eclipse"}
                    </p>
                  </div>
                  {eclipse.isLocal ? (
                    <div className="badge badge-sm bg-accent/15 text-accent border-accent/15 text-xs">Visible</div>
                  ) : null}
                </div>
                <p className="text-base-content text-xl font-semibold capitalize flex items-center gap-2">
                  {eclipse.type}
                </p>
                <p className="text-base-content/40 text-xs">
                  {fmtShortDate(eclipse.peak)}
                </p>
                <div className="mt-1">
                  <CountdownBadge target={eclipse.peak} className="bg-primary/12 text-primary" />
                </div>
              </div>
            ))}

            {supermoonInfo.nextSupermoon ? (
              <div className="rounded-xl border border-accent/15 bg-base-300 p-5">
                 <div className="flex items-center gap-2 mb-1">
                  <div className="bg-accent/12 p-2 rounded-lg text-accent">
                    <Sparkles size={16} />
                  </div>
                  <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">Supermoon</p>
                </div>
                <p className="text-base-content text-xl font-semibold">Full Moon</p>
                <p className="text-base-content/40 text-xs">
                  +{(supermoonInfo.nextSupermoon.sizeRatioVsAverage - 1).toFixed(2)}x visual scale
                </p>
                <div className="mt-1">
                  <CountdownBadge target={supermoonInfo.nextSupermoon.fullMoonTime} className="bg-accent/12 text-accent" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
