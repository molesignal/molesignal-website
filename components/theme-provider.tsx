"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Custom theme provider — replaces `next-themes` to avoid React 19's
 * "Scripts inside React components are never executed" warning.
 *
 * The anti-flash inline script lives in app/layout.tsx as a Server
 * Component child of <head>; this provider only manages runtime state
 * (read/write localStorage, listen to system prefers-color-scheme, expose
 * useTheme()).
 *
 * Contract:
 *   - <html data-theme="light"|"dark">  set by the anti-flash script and
 *     by setTheme()
 *   - localStorage["molesignal-theme"]  one of "light" | "dark" | "system"
 *   - Default theme on first paint: "light" (matches DESIGN_BRIEF.md).
 */

const STORAGE_KEY = "molesignal-theme";
const DEFAULT_THEME: Theme = "light";

export type Theme = "light" | "dark" | "system";

type ThemeCtx = {
  theme: Theme | undefined;
  resolvedTheme: "light" | "dark" | undefined;
  setTheme: (next: Theme) => void;
};

const Ctx = createContext<ThemeCtx>({
  theme: undefined,
  resolvedTheme: undefined,
  setTheme: () => {},
});

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);
}

function readStored(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | undefined>(undefined);
  const [resolved, setResolved] = useState<"light" | "dark" | undefined>(
    undefined,
  );

  // Initial read on mount — avoids SSR/CSR mismatch since the anti-flash
  // script already set <html data-theme>.
  useEffect(() => {
    const initial = readStored();
    setThemeState(initial);
    setResolved(resolveTheme(initial));
  }, []);

  // Track system preference changes when theme is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      setResolved(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setThemeState(next);
    setResolved(resolveTheme(next));
    applyTheme(next);
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ theme, resolvedTheme: resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(Ctx);
}
