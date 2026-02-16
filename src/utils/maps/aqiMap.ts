/**
 * NAQI category → Tailwind CSS color utilities
 * Based on CPCB IND-AQI Standard color scheme
 */

type NaqiCategoryStyle = {
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
};

export function getNaqiCategoryStyle(category: string): NaqiCategoryStyle {
  switch (category) {
    case "Good":
      return {
        textColor: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        dotColor: "bg-green-400",
      };
    case "Satisfactory":
      return {
        textColor: "text-lime-400",
        bgColor: "bg-lime-500/10",
        borderColor: "border-lime-500/20",
        dotColor: "bg-lime-400",
      };
    case "Moderate":
      return {
        textColor: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
        dotColor: "bg-yellow-400",
      };
    case "Poor":
      return {
        textColor: "text-orange-400",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
        dotColor: "bg-orange-400",
      };
    case "Very Poor":
      return {
        textColor: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        dotColor: "bg-red-400",
      };
    case "Severe":
      return {
        textColor: "text-red-600",
        bgColor: "bg-red-600/10",
        borderColor: "border-red-600/20",
        dotColor: "bg-red-600",
      };
    default:
      return {
        textColor: "text-base-content/50",
        bgColor: "bg-base-300",
        borderColor: "border-base-content/10",
        dotColor: "bg-base-content/30",
      };
  }
}

/** European AQI category style (0–20 Good … 100+ Extremely Poor) */
export function getEuAqiCategory(aqi: number): {
  label: string;
  textColor: string;
} {
  if (aqi <= 20) return { label: "Good", textColor: "text-green-400" };
  if (aqi <= 40) return { label: "Fair", textColor: "text-lime-400" };
  if (aqi <= 60) return { label: "Moderate", textColor: "text-yellow-400" };
  if (aqi <= 80) return { label: "Poor", textColor: "text-orange-400" };
  if (aqi <= 100) return { label: "Very Poor", textColor: "text-red-400" };
  return { label: "Extremely Poor", textColor: "text-red-600" };
}

/** US AQI category style (0–50 Good … 301–500 Hazardous) */
export function getUsAqiCategory(aqi: number): {
  label: string;
  textColor: string;
} {
  if (aqi <= 50) return { label: "Good", textColor: "text-green-400" };
  if (aqi <= 100) return { label: "Moderate", textColor: "text-yellow-400" };
  if (aqi <= 150)
    return { label: "Unhealthy (SG)", textColor: "text-orange-400" };
  if (aqi <= 200) return { label: "Unhealthy", textColor: "text-red-400" };
  if (aqi <= 300)
    return { label: "Very Unhealthy", textColor: "text-purple-400" };
  return { label: "Hazardous", textColor: "text-red-600" };
}
