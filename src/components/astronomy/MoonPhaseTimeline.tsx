import { fmtShortDate } from "@/utils/formatters";
import CountdownBadge from "@/components/astronomy/CountdownBadge";

export default function MoonPhaseTimeline({
  phases,
}: {
  phases: { name: string; date: Date; emoji: string; icon: string }[];
}) {
  return (
    <div className="bg-base-200/40 overflow-hidden rounded-xl border border-violet-500/10 p-5">
      <p className="text-base-content/50 mb-4 text-xs font-medium tracking-wider uppercase">
        Upcoming Moon Phases
      </p>
      <div className="grid grid-cols-4 gap-3">
        {phases.map((p, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <img src={p.icon} alt={p.name} className="h-10 w-10" />
            <p className="text-base-content text-xs font-medium">{p.name}</p>
            <p className="text-base-content/40 text-[10px]">
              {fmtShortDate(p.date)}
            </p>
            <CountdownBadge
              target={p.date}
              className="bg-violet-500/10 text-violet-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
