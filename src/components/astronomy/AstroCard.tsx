import { Info, type LucideIcon } from "lucide-react";
import { type ReactNode, memo } from "react";

// Palette-only: primary (violet) / accent (amber) / muted
const accentMap = {
  primary: {
    iconBg: "bg-primary/12",
    iconText: "text-primary",
    border: "border-primary/15",
  },
  accent: {
    iconBg: "bg-accent/12",
    iconText: "text-accent",
    border: "border-accent/15",
  },
  muted: {
    iconBg: "bg-base-content/5",
    iconText: "text-base-content/60",
    border: "border-base-content/5",
  },
  // legacy aliases — remapped to palette
  violet: {
    iconBg: "bg-primary/12",
    iconText: "text-primary",
    border: "border-primary/15",
  },
  amber: {
    iconBg: "bg-accent/12",
    iconText: "text-accent",
    border: "border-accent/15",
  },
  rose: {
    iconBg: "bg-primary/12",
    iconText: "text-primary",
    border: "border-primary/15",
  },
  cyan: {
    iconBg: "bg-primary/12",
    iconText: "text-primary",
    border: "border-primary/15",
  },
  teal: {
    iconBg: "bg-primary/12",
    iconText: "text-primary",
    border: "border-primary/15",
  },
};

type AccentColor = keyof typeof accentMap;

interface AstroCardProps {
  icon?: LucideIcon;
  imageSrc?: string;
  imageSize?: "sm" | "lg";
  title: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
  info?: string;
  accent?: AccentColor;
}

function AstroCardInner({
  icon: Icon,
  imageSrc,
  imageSize = "sm",
  title,
  value,
  sub,
  badge,
  info,
  accent = "violet",
}: AstroCardProps) {
  const a = accentMap[accent];
  const isLg = imageSize === "lg";

  return (
    <div
      className={`group relative overflow-visible rounded-xl border ${a.border} bg-base-300 hover:bg-base-200 p-5 transition-colors duration-200`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg ${a.iconBg} ${
            isLg ? "h-14 w-14 rounded-full" : "h-10 w-10"
          }`}
        >
          {imageSrc ? (
            <img
              loading="lazy"
              src={imageSrc}
              alt={title}
              className={isLg ? "size-14 rounded-full object-cover" : "h-7 w-7"}
            />
          ) : Icon ? (
            <Icon className={a.iconText} size={20} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
              {title}
            </p>
            {info ? (
              <div className="tooltip tooltip-top z-[100]" data-tip={info}>
                <button
                  type="button"
                  className="cursor-help"
                  aria-label={`Info about ${title}`}
                >
                  <Info className="text-base-content/40 hover:text-base-content/80 h-3.5 w-3.5 transition-colors" />
                </button>
              </div>
            ) : null}
          </div>
          <p className="text-base-content mt-1 text-xl font-semibold">
            {value}
          </p>
          {sub ? (
            <p className="text-base-content/40 mt-0.5 text-xs">{sub}</p>
          ) : null}
          {badge ? <div className="mt-1.5">{badge}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default memo(AstroCardInner);
