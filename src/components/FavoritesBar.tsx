import { useContext } from "react";
import { Link } from "react-router";
import { Star, X, GitCompare } from "lucide-react";
import { LocationContext } from "@/context/LocationContext";
import useFavorites from "@/hooks/useFavorites";
import type { ResultType } from "@/schema/location";

export default function FavoritesBar() {
  const { setLocation } = useContext(LocationContext)!;
  const { favs, remove } = useFavorites();

  if (favs.length === 0) return null;

  const handleSelect = (loc: ResultType) => {
    setLocation(loc);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-base-content/40 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
        <Star size={12} /> Favorites
      </span>
      {favs.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1 rounded-full bg-base-200 border border-base-content/5 pl-3 pr-1 py-1 text-xs"
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
      {favs.length >= 2 ? (
        <Link
          to={`/compare?ids=${favs.slice(0, 2).map((f) => f.id).join(",")}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary/12 text-primary border border-primary/15 px-3 py-1 text-xs font-medium hover:bg-primary/20"
        >
          <GitCompare size={12} /> Compare
        </Link>
      ) : null}
    </div>
  );
}
