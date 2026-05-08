"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const PANEL_THEME_STORAGE_KEY = "seumenu_panel_theme";

type PanelTheme = "light" | "dark";

type PanelThemeContextValue = {
  theme: PanelTheme;
  setTheme: (theme: PanelTheme) => void;
  toggleTheme: () => void;
};

const PanelThemeContext = createContext<PanelThemeContextValue | null>(null);

export function PanelThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<PanelTheme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(PANEL_THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      }
    } catch {
      // Ignore storage failures and keep light as default.
    } finally {
      setHydrated(true);
    }
  }, []);

  function setTheme(nextTheme: PanelTheme) {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(PANEL_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures so UI remains usable.
    }
  }

  const value = useMemo<PanelThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
    }),
    [theme],
  );

  const shouldRenderToggle =
    pathname !== "/painel/login" && pathname !== "/smmanageapps/login";

  return (
    <PanelThemeContext.Provider value={value}>
      <div
        data-panel-theme={hydrated ? theme : "light"}
        className="min-h-screen bg-[image:var(--panel-shell-bg)] bg-fixed text-[color:var(--foreground)] transition-colors duration-200"
      >
        {shouldRenderToggle ? <PanelThemeToggle theme={theme} onToggle={value.toggleTheme} /> : null}
        {children}
      </div>
    </PanelThemeContext.Provider>
  );
}

function PanelThemeToggle({
  theme,
  onToggle,
}: {
  theme: PanelTheme;
  onToggle: () => void;
}) {
  const isDark = theme === "dark";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex justify-end lg:right-6 lg:top-6">
      <button
        type="button"
        onClick={onToggle}
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        aria-pressed={isDark}
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-[color:var(--panel-toggle-ring)] bg-[color:var(--color-white)]/92 px-3 py-2 text-[color:var(--brand-ink)] shadow-[var(--shadow-soft-lg)] backdrop-blur"
      >
        <span className="text-[10px] font-extrabold uppercase tracking-[0.28em]">
          {isDark ? "Dark" : "Light"}
        </span>
        <span
          className={`relative flex h-7 w-14 items-center rounded-full transition ${
            isDark ? "bg-[color:var(--brand-green)]/70" : "bg-[color:var(--brand-navy)]/18"
          }`}
        >
          <span
            className={`absolute left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-white)] text-[11px] shadow-[var(--shadow-soft)] transition-transform ${
              isDark ? "translate-x-7" : "translate-x-0"
            }`}
            aria-hidden="true"
          >
            {isDark ? "☾" : "☀"}
          </span>
        </span>
      </button>
    </div>
  );
}

export function usePanelTheme() {
  const context = useContext(PanelThemeContext);
  if (!context) {
    throw new Error("usePanelTheme must be used within PanelThemeProvider");
  }
  return context;
}
