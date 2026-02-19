import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router";

type AppTheme = "weather" | "astronomy";

interface ThemeContextType {
  theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "weather" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  const theme: AppTheme = useMemo(() => {
    if (pathname.startsWith("/astronomy")) return "astronomy";
    return "weather";
  }, [pathname]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      <div data-app-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
