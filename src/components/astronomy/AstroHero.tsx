import { Telescope } from "lucide-react";

const stars = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 1.6 + 1,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 3}s`,
}));

export function StarField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
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

export default function AstroHero() {
  return (
    <div className="hero relative overflow-hidden rounded-xl border border-base-content/5 bg-gradient-to-br from-primary/15 via-base-200 to-base-200 px-6 py-8">
      <StarField />
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />

      <div className="hero-content relative z-10 flex-col text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
          <Telescope className="h-7 w-7 text-primary" />
        </div>
        <h2
          className="mt-4 text-2xl font-bold tracking-tight text-primary sm:text-3xl"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Astronomy
        </h2>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-base-content/60">
          Real-time celestial calculations for your location — sun, moon & planets.
        </p>
      </div>
    </div>
  );
}
