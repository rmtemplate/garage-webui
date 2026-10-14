import { themeModes, type ThemeMode } from "@/app/themes";
import { Segmented } from "@/components/ui/toolbar";
import appStore from "@/stores/app-store";
import { Monitor, Moon, Sun } from "lucide-react";
import { useStore } from "zustand";

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;
const LABELS = { system: "System", light: "Light", dark: "Dark" } as const;

const ThemeSwitcher = ({ className }: { className?: string }) => {
  const mode = useStore(appStore, (i) => i.themeMode);

  return (
    <Segmented<ThemeMode>
      ariaLabel="Colour theme"
      className={className}
      value={mode}
      onChange={appStore.setThemeMode}
      options={themeModes.map((m) => ({
        value: m,
        icon: ICONS[m],
        title: `${LABELS[m]} theme`,
      }))}
    />
  );
};

export default ThemeSwitcher;
