import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type Tab = {
  name: string;
  title?: string;
  icon?: LucideIcon;
  Component?: () => JSX.Element | null;
};

type Props = {
  tabs: Tab[];
  name?: string;
  className?: string;
  contentClassName?: string;
};

/**
 * URL-backed tabs: the active tab lives in a query param, so a tab is
 * linkable, survives a reload, and works with the back button.
 */
const TabView = ({
  tabs,
  name = "tab",
  className,
  contentClassName,
}: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const curTab = searchParams.get(name) || tabs[0].name;

  const content = useMemo(() => {
    const Comp = tabs.find((tab) => tab.name === curTab)?.Component;
    return Comp ? <Comp /> : null;
  }, [curTab, tabs]);

  return (
    <>
      <div
        role="tablist"
        aria-label="Sections"
        className={cn(
          "flex flex-row items-center gap-1 border-b border-base-300 overflow-x-auto",
          className
        )}
      >
        {tabs.map(({ icon: Icon, ...tab }) => {
          const active = curTab === tab.name;

          return (
            <button
              key={tab.name}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => {
                setSearchParams(
                  (params) => {
                    params.set(name, tab.name);
                    return params;
                  },
                  { replace: true }
                );
              }}
              className={cn(
                "relative inline-flex flex-row items-center gap-2 shrink-0",
                "h-10 px-3 -mb-px text-[0.8125rem] font-medium rounded-t-btn",
                "border-b-2 transition-colors duration-150",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/60 hover:text-base-content hover:bg-base-content/[0.04]"
              )}
            >
              {Icon ? <Icon size={15} aria-hidden /> : null}
              {tab.title || tab.name}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className={cn("mt-4 md:mt-5 animate-fade-in", contentClassName)}
      >
        {content}
      </div>
    </>
  );
};

export default TabView;
