import { fmtShortDate } from "@/utils/formatters";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import type { MoonPhaseEvent } from "@/types/astronomy";

interface MoonPhaseTimelineProps {
  phases: MoonPhaseEvent[];
}

export default function MoonPhaseTimeline({
  phases,
}: MoonPhaseTimelineProps) {
  return (
    <div className="card card-border border-violet-500/10 bg-base-200/40">
      <div className="card-body">
        <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
          Upcoming Moon Phases
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {phases.map((p, i) => (
            <div key={i} className="card bg-base-300/40 shadow-sm border border-violet-500/5">
              <figure className="pt-5">
                <img
                  src={p.icon}
                  alt={p.phaseName}
                  className="size-64 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = p.iconFallback;
                  }}
                />
              </figure>
              <div className="card-body items-center text-center pb-5 px-3 pt-3">
                <h3 className="card-title text-sm">{p.phaseName}</h3>
                <p className="text-base-content/40 text-xs">
                  {fmtShortDate(p.time)}
                </p>
                {p.isSupermoon || p.lunarEclipse ? (
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                     {p.isSupermoon && <div className="badge badge-warning badge-xs">Supermoon</div>}
                     {p.lunarEclipse && <div className="badge badge-error badge-xs capitalize">{p.lunarEclipse} Eclipse</div>}
                  </div>
                ) : null}
                <div className="card-actions mt-2">
                  <CountdownBadge
                    target={p.time}
                    className="bg-violet-500/10 text-violet-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
