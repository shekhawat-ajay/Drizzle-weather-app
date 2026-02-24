import { Telescope } from "lucide-react";

// rendering-hoist-jsx: stars data computed once, not on every render
const stars = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2 + 1,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 3}s`,
}));

export function StarField() {
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

// rendering-hoist-jsx: static decorative blur elements
const topBlur = (
  <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
);
const bottomBlur = (
  <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
);

export default function AstroHero() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 px-6 py-10">
      <StarField />
      {topBlur}
      {bottomBlur}

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="animate-float flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-400/20">
          <Telescope className="h-10 w-10 text-violet-300" />
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
