import { cn } from "@/lib/utils";
import {
  Archive,
  Clapperboard,
  HardDrive,
  KeySquare,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import Button from "../ui/button";
import garageLogo from "@/assets/garage-logo.svg";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import * as utils from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO } from "@/lib/consts";
import ClusterStatus from "./cluster-status";
import ThemeSwitcher from "./theme-switcher";
import { Badge } from "../ui/badge";

type NavItem = { icon: LucideIcon; title: string; path: string; exact?: boolean };

/**
 * Grouped so the sidebar reads as three concerns rather than a flat list of
 * four links — it scales as the app grows without widening.
 */
const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, title: "Dashboard", path: "/", exact: true },
    ],
  },
  {
    label: "Storage",
    items: [
      { icon: Archive, title: "Buckets", path: "/buckets" },
      { icon: KeySquare, title: "Access Keys", path: "/keys" },
    ],
  },
  {
    label: "Infrastructure",
    items: [{ icon: HardDrive, title: "Cluster", path: "/cluster" }],
  },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const auth = useAuth();

  return (
    <aside
      className="bg-base-100 border-r border-base-300 w-[17rem] md:w-[15.5rem]
                 flex flex-col h-full overflow-hidden"
    >
      {/* -- Brand -- */}
      <div className="flex flex-row items-center gap-2.5 h-16 px-4 shrink-0 border-b border-base-300">
        <img src={garageLogo} alt="" aria-hidden className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-semibold tracking-[-0.01em] leading-tight">
            Garage
          </p>
          <p className="text-[0.6875rem] muted leading-tight">Web UI</p>
        </div>
        {IS_DEMO ? (
          <Badge tone="warning" className="shrink-0">
            DEMO
          </Badge>
        ) : null}
      </div>

      {/* -- Navigation -- */}
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2.5 py-4">
        {NAV.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="eyebrow px-2.5 mb-1.5">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.exact
                  ? pathname === item.path
                  : pathname.startsWith(item.path);

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex flex-row items-center gap-2.5 h-9 px-2.5 rounded-btn",
                        "text-[0.8125rem] font-medium transition-colors duration-150",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-base-content/70 hover:text-base-content hover:bg-base-content/[0.05]"
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
                        />
                      ) : null}
                      <item.icon size={17} className="shrink-0" aria-hidden />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* -- Footer -- */}
      <div className="shrink-0 border-t border-base-300 p-2.5 flex flex-col gap-2.5">
        <ClusterStatus />

        <div className="flex flex-row items-center gap-2">
          <ThemeSwitcher className="flex-1 justify-between" />
          {auth.isEnabled ? <LogoutButton /> : null}
        </div>

        {IS_DEMO ? (
          <p className="flex items-center gap-1.5 text-[0.6875rem] muted px-1">
            <Clapperboard size={12} className="shrink-0" aria-hidden />
            Local Demo Mode · mock adapter
          </p>
        ) : null}
      </div>
    </aside>
  );
};

const LogoutButton = () => {
  const logout = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      window.location.href = utils.url("/auth/login");
    },
    onError: (err) => {
      toast.error(err?.message || "Unknown error");
    },
  });

  return (
    <Button
      icon={LogOut}
      size="sm"
      color="ghost"
      title="Log out"
      loading={logout.isPending}
      onClick={() => logout.mutate()}
    />
  );
};

export default Sidebar;
