import appStore from "@/stores/app-store";
import { useEffect } from "react";
import { useStore } from "zustand";

/**
 * Applies the resolved theme to <html data-theme>. "system" follows the OS and
 * keeps following it — the listener stays attached while that mode is active.
 */
const ThemeProvider = () => {
  const mode = useStore(appStore, (i) => i.themeMode);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      const theme = dark ? "garage-dark" : "garage-light";

      document.documentElement.setAttribute("data-theme", theme);
      // Lets the browser paint native widgets and scrollbars to match.
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };

    apply();

    if (mode !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  return null;
};

export default ThemeProvider;
