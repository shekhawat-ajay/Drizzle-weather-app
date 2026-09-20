import { useContext } from "react";
import { Link } from "react-router";
import { Star, X, GitCompare } from "lucide-react";
import { LocationContext } from "@/context/LocationContext";
import { useAppTheme } from "@/context/ThemeContext";
import useFavorites from "@/hooks/useFavorites";
import type { ResultType } from "@/schema/location";

export default function FavoritesBar() {
  const { setLocation } = useContext(LocationContext)!;
  const { theme } = useAppTheme();
  const { favs, remove } = useFavorites();

  if (favs.length === 0) return null;

  const handleSelect = (loc: ResultType) => {
    setLocation(loc);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-2 mb-3 text-center">
      <span className="text-base-content/40 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
        <Star size={12} /> Favorites
      </span>
      {favs.map((f) => (
        <span
          key={f.id}
          className="badge gap-1 py-3 pl-3"
        >
          <button
            onClick={() => handleSelect(f)}
            className="hover:text-primary text-base-content/70"
          >
            {f.name}
            {f.admin1 ? `, ${f.admin1}` : ""}
          </button>
          <button
            onClick={() => remove(f.id)}
            aria-label={`Remove ${f.name}`}
            className="rounded-full p-1 hover:bg-base-300 text-base-content/40 hover:text-base-content/80"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      {favs.length >= 2 && theme === "weather" ? (
        <Link
          to={`/compare?ids=${favs.slice(0, 2).map((f) => f.id).join(",")}`}
          className="badge badge-primary gap-1"
        >
          <GitCompare size={12} /> Compare
        </Link>
      ) : null}
    </div>
  );
}
