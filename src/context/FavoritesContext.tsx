import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ResultType } from "@/schema/location";

const STORAGE_KEY = "drizzle-favorites";
const MAX_FAVS = 8;

function load(): ResultType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ResultType[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

type FavoritesContextType = {
  favs: ResultType[];
  isFav: (loc: ResultType) => boolean;
  toggle: (loc: ResultType) => void;
  remove: (id: number) => void;
  max: number;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<ResultType[]>(() => {
    try { return load(); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favs)); } catch { /* ignore */ }
  }, [favs]);

  // sync across tabs only — same-tab is shared via context, no custom event needed
  useEffect(() => {
    const handler = () => setFavs(load());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isFav = useCallback((loc: ResultType) => favs.some((f) => f.id === loc.id), [favs]);

  const toggle = useCallback((loc: ResultType) => {
    setFavs((prev) => {
      if (prev.some((f) => f.id === loc.id)) return prev.filter((f) => f.id !== loc.id);
      if (prev.length >= MAX_FAVS) return prev;
      return [loc, ...prev];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setFavs((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const value = { favs, isFav, toggle, remove, max: MAX_FAVS };
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

export default FavoritesContext;
