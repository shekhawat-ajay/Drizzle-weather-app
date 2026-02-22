import { type LucideIcon } from "lucide-react";

// Accent map moved out of render cycle for better performance
const accentMap = {
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
    border: "border-violet-500/10",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    border: "border-amber-500/10",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-400",
    border: "border-rose-500/10",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
    border: "border-cyan-500/10",
  },
  teal: {
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-400",
    border: "border-teal-500/10",
  },
};

type AccentColor = keyof typeof accentMap;

interface AstroCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  sub?: string;
  accent?: AccentColor;
}

export default function AstroCard({
  icon: Icon,
  title,
  value,
  sub,
  accent = "violet",
}: AstroCardProps) {
  const a = accentMap[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${a.border} bg-base-200/40 hover:bg-base-200/60 p-5 transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${a.iconBg}`}
        >
          <Icon className={a.iconText} size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
            {title}
          </p>
          <p className="text-base-content mt-1 text-xl font-semibold">
            {value}
          </p>
          {sub && <p className="text-base-content/40 mt-0.5 text-xs">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
