import { Sparkles, Sun, ArrowUp, ArrowDown } from "lucide-react";
import type { AstronomyData } from "@/types/astronomy";

interface StargazingBannerProps {
  stargazing: AstronomyData["stargazing"];
  isDaytime: boolean;
}

export default function StargazingBanner({ stargazing, isDaytime }: StargazingBannerProps) {
  // Map index impacts to colors
  const impactColor = (impact: string) => {
    switch (impact) {
      case "positive": return "text-emerald-400 bg-emerald-400/10";
      case "negative": return "text-red-400 bg-red-400/10";
      default: return "text-base-content/60 bg-base-300/50";
    }
  };

  const impactIcon = (impact: string) => {
    switch (impact) {
      case "positive": return <ArrowUp className="w-3 h-3" />;
      case "negative": return <ArrowDown className="w-3 h-3" />;
      default: return null;
    }
  };

  const mainColor = isDaytime ? "text-amber-400" : (stargazing.score >= 60 ? "text-emerald-400" : stargazing.score >= 40 ? "text-amber-400" : "text-red-400");
  const bgMainColor = isDaytime ? "bg-amber-400/10 border-amber-400/20" : (stargazing.score >= 60 ? "bg-emerald-400/10 border-emerald-400/20" : stargazing.score >= 40 ? "bg-amber-400/10 border-amber-400/20" : "bg-red-400/10 border-red-400/20");

  return (
    <div className={`card shadow-sm border ${bgMainColor} rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${isDaytime ? "bg-amber-400/20 text-amber-500" : "bg-base-200 shadow-inner"}`}>
          {isDaytime ? <Sun size={28} /> : <Sparkles size={28} className={mainColor} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-base-content">{stargazing.label}</h3>
            {!isDaytime && (
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${bgMainColor} ${mainColor}`}>
                {stargazing.score}/100
              </span>
            )}
          </div>
          <p className="text-base-content/70 text-sm mt-0.5">{stargazing.description}</p>
        </div>
      </div>

      {!isDaytime && stargazing.factors.length > 0 && (
        <div className="flex flex-wrap gap-2 md:max-w-[40%] justify-start md:justify-end">
          {stargazing.factors.slice(0, 3).map((factor, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${impactColor(factor.impact)}`}
            >
              {impactIcon(factor.impact)}
              <span>{factor.param}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
