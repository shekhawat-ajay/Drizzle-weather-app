import { useState, useEffect } from "react";

interface CountdownBadgeProps {
  target: Date | null;
  /** Label shown before the time, e.g. "Sunset in" → "● Sunset in 3h 45m" */
  label?: string;
  className?: string;
}

/** Returns formatted duration string like "3h 45m" */
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const totalHr = Math.floor(totalMin / 60);
  const totalDays = Math.floor(totalHr / 24);

  if (totalDays > 0) {
    const hrs = totalHr - totalDays * 24;
    return hrs > 0 ? `${totalDays}d ${hrs}h` : `${totalDays}d`;
  }
  if (totalHr > 0) {
    const mins = totalMin - totalHr * 60;
    return mins > 0 ? `${totalHr}h ${mins}m` : `${totalHr}h`;
  }
  return totalMin > 0 ? `${totalMin}m` : "";
}

function compute(target: Date): { text: string; isFuture: boolean } | null {
  const diffMs = target.getTime() - Date.now();
  const dur = formatDuration(Math.abs(diffMs));
  if (!dur) return null;
  return {
    text: diffMs > 0 ? `in ${dur}` : `${dur} ago`,
    isFuture: diffMs > 0,
  };
}

export default function CountdownBadge({
  target,
  label = "",
  className = "",
}: CountdownBadgeProps) {
  const [result, setResult] = useState<{
    text: string;
    isFuture: boolean;
  } | null>(() => (target ? compute(target) : null));

  useEffect(() => {
    if (!target) return;
    setResult(compute(target));

    const id = setInterval(() => setResult(compute(target)), 30_000);
    return () => clearInterval(id);
  }, [target]);

  if (!result) return null;

  const futureColors = className || "badge-accent";
  const pastColors = "badge-ghost";

  return (
    <span
      className={`badge badge-xs gap-1 shrink-0 ${
        result.isFuture ? futureColors : pastColors
      }`}
    >
      {result.isFuture ? (
        <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-current" />
      ) : null}
      {label ? `${label} ` : ""}
      {result.text}
    </span>
  );
}
