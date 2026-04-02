import { fmtShortDate } from "@/utils/formatters";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import type { NextMoonPhaseData } from "@/types/astronomy";

interface MoonPhaseTimelineProps {
  phases: NextMoonPhaseData[];
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
            <div key={i} className="card bg-base-300/40">
              <figure className="pt-5">
                <img
                  src={p.icon}
                  alt={p.name}
                  className="size-64 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = p.iconFallback;
                  }}
                />
              </figure>
              <div className="card-body items-center text-center">
                <h3 className="card-title text-sm">{p.name}</h3>
                <p className="text-base-content/40 text-xs">
                  {fmtShortDate(p.date)}
                </p>
                <div className="card-actions">
                  <CountdownBadge
                    target={p.date}
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
