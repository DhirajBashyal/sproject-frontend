import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import type { Theme } from "@/types/common.types";

const ThemeContext = createContext<{
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system",
  );
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const dark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  function setTheme(next: Theme) {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }

  return <ThemeContext value={{ theme, isDark: dark, setTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = use(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
