import { Sparkles, Sun, ArrowUp, ArrowDown } from "lucide-react";
import type { AstronomyData } from "@/types/astronomy";

interface StargazingBannerProps {
  stargazing: AstronomyData["stargazing"];
  isDaytime: boolean;
}

export default function StargazingBanner({ stargazing, isDaytime }: StargazingBannerProps) {
  const impactIcon = (impact: string) => {
    switch (impact) {
      case "positive": return <ArrowUp className="w-3 h-3" />;
      case "negative": return <ArrowDown className="w-3 h-3" />;
      default: return null;
    }
  };

  const mainColor = isDaytime ? "text-accent" : (stargazing.score >= 60 ? "text-primary" : stargazing.score >= 40 ? "text-accent" : "text-base-content/40");
  const bgMainColor = isDaytime ? "bg-accent/12 border-accent/20" : (stargazing.score >= 60 ? "bg-primary/12 border-primary/20" : stargazing.score >= 40 ? "bg-accent/12 border-accent/20" : "bg-base-content/5 border-base-content/10");

  return (
    <div className={`rounded-xl border ${bgMainColor} p-4 md:p-5 flex flex-col gap-4 items-center text-center`}>
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className={`rounded-full p-3 ${isDaytime ? "bg-accent/15 text-accent" : "bg-base-300"}`}>
          {isDaytime ? <Sun size={28} /> : <Sparkles size={28} className={mainColor} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-base-content">{stargazing.label}</h3>
            {!isDaytime ? (
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${bgMainColor} ${mainColor}`}>
                {stargazing.score}/100
              </span>
            ) : null}
          </div>
          <p className="text-base-content/70 text-sm mt-0.5">{stargazing.description}</p>
        </div>
      </div>

      {!isDaytime && stargazing.factors.length > 0 ? (
        <div className="flex flex-wrap gap-2 justify-center">
          {stargazing.factors.slice(0, 3).map((factor) => (
            <span
              key={factor.param}
              className={`badge badge-xs ${factor.impact === "positive" ? "badge-primary" : factor.impact === "negative" ? "badge-accent" : "badge-ghost"}`}
            >
              {impactIcon(factor.impact)}
              {factor.param}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
