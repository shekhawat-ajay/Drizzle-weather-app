import React from "react";
import {
  Sun,
  Moon,
  Satellite,
  Globe,
} from "lucide-react";

interface CelestialIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function CelestialIcon({ name, className = "", size = 20 }: CelestialIconProps) {
  const normalized = name.toLowerCase().trim();

  // Handle standard Lucide icons
  if (normalized === "sun") {
    return <Sun className={className} size={size} />;
  }
  if (normalized === "moon") {
    return <Moon className={className} size={size} />;
  }
  if (normalized === "iss") {
    return <Satellite className={className} size={size} />;
  }
  if (normalized === "overview") {
    // Elegant orbit/constellation view for overview
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ width: size, height: size }}
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M3 16a9 9 0 0 1 18-8" />
        <path d="M21 8a9 9 0 0 1-18 8" />
      </svg>
    );
  }

  // Handle planet astrological symbols as high-quality custom SVGs
  const renderPlanetPath = () => {
    switch (normalized) {
      case "mercury":
        return (
          <>
            <circle cx="12" cy="12" r="4.5" />
            <path d="M9 20h6" />
            <path d="M12 16.5v7" />
            <path d="M8.5 4.5a3.5 3.5 0 0 1 7 0" />
          </>
        );
      case "venus":
        return (
          <>
            <circle cx="12" cy="10" r="5" />
            <path d="M9 19h6" />
            <path d="M12 15v7" />
          </>
        );
      case "mars":
        return (
          <>
            <circle cx="10.5" cy="13.5" r="5" />
            <path d="M14.5 9.5L20 4" />
            <path d="M15 4h5v5" />
          </>
        );
      case "jupiter":
        return (
          <>
            <path d="M9 15h6" />
            <path d="M12 5v14" />
            <path d="M8.5 7.5a3.5 3.5 0 0 1 3.5 3.5h3" />
          </>
        );
      case "saturn":
        return (
          <>
            <path d="M11 5v9" />
            <path d="M8.5 7.5h5" />
            <path d="M11 11.5c2 0 4 1.5 4 4.5s-1.5 4.5-3.5 4.5-2.5-1-2.5-3.5v-1" />
          </>
        );
      case "uranus":
        return (
          <>
            <circle cx="12" cy="14" r="4.5" />
            <circle cx="12" cy="14" r="1" fill="currentColor" />
            <path d="M12 9.5v-6" />
            <path d="M9 6.5l3-3 3 3" />
          </>
        );
      case "neptune":
        return (
          <>
            <path d="M12 4v16" />
            <path d="M9 16.5h6" />
            <path d="M8.5 7.5v3.5a3.5 3.5 0 0 0 7 0V7.5" />
          </>
        );
      default:
        return null;
    }
  };

  const path = renderPlanetPath();

  if (path) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ width: size, height: size }}
      >
        {path}
      </svg>
    );
  }

  // Fallback to Globe
  return <Globe className={className} size={size} />;
}
