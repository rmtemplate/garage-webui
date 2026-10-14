import type { ThemeMode } from "@/app/themes";
import { createStore } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  /** "system" tracks the OS preference; light/dark pin it. */
  themeMode: ThemeMode;
  /** Object browser list/grid preference, remembered across bucket visits. */
  browseView: "list" | "grid";
};

const store = createStore(
  persist<AppState>(
    () => ({
      themeMode: "system",
      browseView: "list",
    }),
    {
      name: "appdata",
      // v1 persisted a daisyUI theme name ("pastel", "dracula", …) that no
      // longer exists; drop it and fall back to the defaults.
      version: 2,
      migrate: () => ({
        themeMode: "system" as ThemeMode,
        browseView: "list" as const,
      }),
    }
  )
);

const appStore = {
  ...store,
  setThemeMode: (themeMode: ThemeMode) => store.setState({ themeMode }),
  setBrowseView: (browseView: AppState["browseView"]) =>
    store.setState({ browseView }),
};

export default appStore;
