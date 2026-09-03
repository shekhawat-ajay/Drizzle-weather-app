import { Sparkles, Zap, Gauge, MapPin } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import CountdownBadge from "@/components/astronomy/CountdownBadge";
import { getNextShowers } from "@/data\/meteorShowers";
import { fmtShortDate } from "@/utils/formatters";

export default function MeteorShowers() {
  const upcoming = getNextShowers(3);

  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <SectionHeader icon={Sparkles} label="Meteor Showers — Next Up" color="text-accent" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {upcoming.map(({ shower, peakDate, active }) => (
          <div
            key={shower.name}
            className={`card relative overflow-hidden border p-4 ${active ? "bg-accent/10 border-accent/20" : "bg-base-300 border-base-content/5"}`}
          >
            {active ? (
              <span className="badge badge-accent absolute top-2 right-2">
                Active
              </span>
            ) : null}
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${active ? "bg-accent/20 text-accent" : "bg-base-content/5 text-base-content/60"}`}>
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold leading-none">{shower.name}</h4>
                <p className="text-base-content/50 text-xs">{shower.parent}</p>
              </div>
            </div>
            <p className="text-base-content/60 text-xs mt-2 line-clamp-2 leading-relaxed">{shower.description}</p>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-base-content/70">
                <Gauge size={12} className="text-accent" />
                <span>ZHR {shower.zhr}</span>
                <span className="text-base-content/30">·</span>
                <span className="flex items-center gap-1"><Zap size={12} />{shower.velocityKms} km/s</span>
              </div>
              <div className="flex items-center gap-1.5 text-base-content/70">
                <MapPin size={12} className="text-primary" />
                <span>Radiant {shower.radiant}</span>
              </div>
              <p className="text-base-content/40 text-xs">Active {shower.activeStart} → {shower.activeEnd}</p>
              <p className="font-medium text-xs">Peak {fmtShortDate(peakDate)}</p>
            </div>
            <div className="mt-3">
              <CountdownBadge target={peakDate} className={active ? "badge-accent" : "badge-ghost"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
