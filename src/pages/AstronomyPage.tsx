import { useContext } from "react";
import { LocationContext } from "@/App";
import { ResultType } from "@/schema/location";
import useAstronomy from "@/hooks/useAstronomy";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Star,
  Eye,
  Globe,
  Clock,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

/* ─── Time formatter ─── */
function fmt(date: Date | null, tz?: string): string {
  if (!date) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

/* ─── Tiny twinkling star field ─── */
function StarField() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    delay: `${Math.random() * 4}s`,
    duration: `${2 + Math.random() * 3}s`,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.id}
          className="animate-twinkle absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Info card ─── */
function AstroCard({
  icon: Icon,
  title,
  value,
  sub,
  accent = "violet",
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  sub?: string;
  accent?: "violet" | "amber" | "rose" | "cyan";
}) {
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
  };

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

/* ─── Hero banner ─── */
function AstroHero({ moonEmoji }: { moonEmoji: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 px-6 py-10">
      <StarField />
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="animate-float flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-400/20">
          <span className="text-5xl">{moonEmoji}</span>
        </div>
        <h2
          className="mt-5 bg-gradient-to-r from-violet-300 via-purple-200 to-fuchsia-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Astronomy
        </h2>
        <p className="mt-2 max-w-md text-sm text-violet-200/60">
          Celestial data calculated for your location using astronomical
          algorithms.
        </p>
      </div>
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
}) {
  return (
    <h3 className="text-base-content/60 mb-3 flex items-center gap-2 px-1 text-xs font-semibold tracking-wider uppercase">
      <Icon size={14} className={color} />
      {label}
    </h3>
  );
}

/* ─── Moon phase timeline ─── */
function MoonPhaseTimeline({
  phases,
}: {
  phases: { name: string; date: Date; emoji: string }[];
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
            <span className="text-2xl">{p.emoji}</span>
            <p className="text-base-content text-xs font-medium">{p.name}</p>
            <p className="text-base-content/40 text-[10px]">
              {fmtDate(p.date)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function AstronomyPage() {
  const { location } = useContext(LocationContext) as unknown as {
    location: ResultType;
  };

  const { sun, moon, planets, nextMoonPhases, nextSeason, stargazing } =
    useAstronomy(location.latitude, location.longitude);

  const tz = location.timezone;

  return (
    <div className="space-y-4">
      <AstroHero moonEmoji={moon.emoji} />

      {/* Location context */}
      <div className="flex items-center gap-2 px-1">
        <div className="animate-pulse-soft h-1.5 w-1.5 rounded-full bg-violet-400" />
        <p className="text-base-content/40 text-xs">
          Showing data for{" "}
          <span className="text-base-content/70 font-medium">
            {location.name}, {location.country}
          </span>
        </p>
      </div>

      {/* ── Sun Section ── */}
      <div>
        <SectionHeader icon={Sun} label="Sun" color="text-amber-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AstroCard
            icon={Sunrise}
            title="Sunrise"
            value={fmt(sun.sunrise, tz)}
            sub={`First light ${fmt(sun.civilDawn, tz)}`}
            accent="amber"
          />
          <AstroCard
            icon={Sunset}
            title="Sunset"
            value={fmt(sun.sunset, tz)}
            sub={`Last light ${fmt(sun.civilDusk, tz)}`}
            accent="rose"
          />
          <AstroCard
            icon={Sun}
            title="Day Length"
            value={fmtDuration(sun.dayLengthMinutes)}
            sub={`Golden hour ${fmt(sun.goldenHourStart, tz)}`}
            accent="amber"
          />
        </div>
      </div>

      {/* ── Moon Section ── */}
      <div>
        <SectionHeader icon={Moon} label="Moon" color="text-violet-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <AstroCard
            icon={Moon}
            title="Phase"
            value={moon.phaseName}
            sub={`${moon.emoji}  ${Math.round(moon.phaseDegrees)}°`}
            accent="violet"
          />
          <AstroCard
            icon={Eye}
            title="Illumination"
            value={`${Math.round(moon.illuminationFraction * 100)}%`}
            sub={`↑ ${fmt(moon.moonrise, tz)}  •  ↓ ${fmt(moon.moonset, tz)}`}
            accent="cyan"
          />
          <AstroCard
            icon={Star}
            title="Stargazing"
            value={stargazing.label}
            sub={stargazing.description}
            accent="violet"
          />
        </div>
      </div>

      {/* ── Planets Section ── */}
      <div>
        <SectionHeader icon={Globe} label="Planets" color="text-teal-400" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {planets.map((planet) => (
            <AstroCard
              key={planet.name}
              icon={Globe}
              title={planet.name}
              value={`↑ ${fmt(planet.rise, tz)}`}
              sub={`↓ ${fmt(planet.set, tz)}`}
              accent="cyan"
            />
          ))}
        </div>
      </div>

      {/* ── Moon Phase Timeline ── */}
      <MoonPhaseTimeline phases={nextMoonPhases} />

      {/* ── Upcoming Event ── */}
      <div>
        <SectionHeader
          icon={CalendarDays}
          label="Upcoming"
          color="text-cyan-400"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AstroCard
            icon={CalendarDays}
            title="Next Season"
            value={nextSeason.name}
            sub={nextSeason.date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            accent="cyan"
          />
          <AstroCard
            icon={Clock}
            title="Twilight"
            value={`Nautical ${fmt(sun.nauticalDusk, tz)}`}
            sub={`Astronomical ${fmt(sun.astronomicalDusk, tz)}`}
            accent="violet"
          />
        </div>
      </div>
    </div>
  );
}
