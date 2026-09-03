import { useMemo, useState } from "react";
import { Body, Illumination, MoonPhase } from "astronomy-engine";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "@/components/astronomy/SectionHeader";
import { getMoonPhaseInfo } from "@/utils/astronomy";
import { cn } from "@/utils/cn";

interface DayInfo {
  date: number;
  icon: string;
  iconFallback: string;
  phaseName: string;
  illumination: number;
  isToday: boolean;
  isFullMoon: boolean;
  isNewMoon: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function MoonCalendar() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { days, leadBlanks, label, isCurrentMonth } = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const list: DayInfo[] = [];
    let maxIllum = -1;
    let minIllum = 101;
    let maxIdx = 0;
    let minIdx = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      // Noon UTC — phase drifts ~12°/day so exact hour barely matters
      const atNoon = new Date(Date.UTC(viewYear, viewMonth, d, 12));
      const degrees = MoonPhase(atNoon);
      const info = getMoonPhaseInfo(degrees);
      let illumination = 0;
      try {
        illumination = Illumination(Body.Moon, atNoon).phase_fraction * 100;
      } catch { /* ignore */ }
      if (illumination > maxIllum) { maxIllum = illumination; maxIdx = d - 1; }
      if (illumination < minIllum) { minIllum = illumination; minIdx = d - 1; }
      list.push({
        date: d,
        icon: info.icon,
        iconFallback: info.iconFallback,
        phaseName: info.name,
        illumination,
        isToday:
          d === now.getDate() &&
          viewMonth === now.getMonth() &&
          viewYear === now.getFullYear(),
        isFullMoon: false,
        isNewMoon: false,
      });
    }

    if (list[maxIdx]) list[maxIdx]!.isFullMoon = true;
    if (list[minIdx]) list[minIdx]!.isNewMoon = true;

    return {
      days: list,
      leadBlanks: firstDow,
      label: new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      isCurrentMonth: viewMonth === now.getMonth() && viewYear === now.getFullYear(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  return (
    <div className="card bg-base-200 border border-base-content/5 p-5">
      <div className="flex items-center justify-between gap-2">
        <SectionHeader icon={CalendarDays} label="Moon Calendar" color="text-primary" />
        <div className="flex items-center gap-1 mb-3">
          <button
            onClick={() => shiftMonth(-1)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold min-w-28 text-center">{label}</span>
          <button
            onClick={() => shiftMonth(1)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth ? (
            <button onClick={goToday} className="btn btn-ghost btn-xs">
              Today
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <p key={w} className="text-base-content/40 text-[10px] font-semibold uppercase py-1">
            {w}
          </p>
        ))}
        {Array.from({ length: leadBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.phaseName} — ${Math.round(d.illumination)}% illuminated`}
            className={cn(
              "flex flex-col items-center rounded-lg border px-1 py-2 transition-colors",
              d.isToday
                ? "border-primary/40 bg-primary/10"
                : "border-base-content/5 bg-base-300",
            )}
          >
            <span
              className={cn(
                "text-xs",
                d.isToday ? "font-bold text-primary" : "text-base-content/60",
              )}
            >
              {d.date}
            </span>
            <img
              loading="lazy"
              src={d.icon}
              alt={d.phaseName}
              className="my-1 size-7 sm:size-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = d.iconFallback;
              }}
            />
            <span className="text-base-content/40 text-[9px] font-mono">
              {Math.round(d.illumination)}%
            </span>
            {d.isFullMoon ? (
              <span className="badge badge-accent badge-xs mt-1">Full</span>
            ) : d.isNewMoon ? (
              <span className="badge badge-ghost badge-xs mt-1">New</span>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-3 text-[10px] text-base-content/40">
        <span className="flex items-center gap-1">
          <span className="badge badge-accent badge-xs">Full</span> full moon day
        </span>
        <span className="flex items-center gap-1">
          <span className="badge badge-ghost badge-xs">New</span> new moon day
        </span>
      </p>
    </div>
  );
}
