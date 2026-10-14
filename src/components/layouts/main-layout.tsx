import { usePageContext, type Crumb } from "@/context/page-context";
import { Fragment, Suspense, useEffect } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Sidebar from "../containers/sidebar";
import { ArrowLeft, ChevronRight, MenuIcon } from "lucide-react";
import Button from "../ui/button";
import { useDisclosure } from "@/hooks/useDisclosure";
import { Drawer } from "react-daisyui";
import { useAuth } from "@/hooks/useAuth";
import { LoadingBlock } from "../ui/states";

const MainLayout = () => {
  const sidebar = useDisclosure();
  const { pathname } = useLocation();
  const auth = useAuth();

  // Navigating from the mobile drawer should close it.
  useEffect(() => {
    if (sidebar.isOpen) sidebar.onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (auth.isLoading) {
    return (
      <div className="min-h-svh grid place-items-center">
        <LoadingBlock label="Starting Garage Web UI…" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <Drawer
      open={sidebar.isOpen}
      onClickOverlay={sidebar.onClose}
      className="md:drawer-open h-screen max-h-dvh"
      side={<Sidebar />}
      contentClassName="flex flex-col overflow-hidden bg-base-200"
    >
      <Header onSidebarOpen={sidebar.onOpen} />

      <main
        id="content"
        className="flex-1 overflow-y-auto px-[var(--page-gutter)] py-5 md:py-7"
      >
        <Suspense fallback={<LoadingBlock />}>
          <Outlet />
        </Suspense>
      </main>
    </Drawer>
  );
};

type HeaderProps = {
  onSidebarOpen: () => void;
};

const Header = ({ onSidebarOpen }: HeaderProps) => {
  const page = usePageContext();
  const navigate = useNavigate();

  return (
    <header className="shrink-0 bg-base-100 border-b border-base-300 px-[var(--page-gutter)]">
      <div className="page-container h-16 flex flex-row items-center gap-3">
        <Button
          icon={MenuIcon}
          color="ghost"
          size="sm"
          title="Open navigation"
          className="md:hidden -ml-1.5 shrink-0"
          onClick={onSidebarOpen}
        />

        {page.prev ? (
          <Button
            icon={ArrowLeft}
            color="ghost"
            size="sm"
            title="Go back"
            className="-ml-1.5 shrink-0 hidden md:inline-flex"
            onClick={() => navigate(page.prev!, { replace: true })}
          />
        ) : null}

        <div className="flex-1 min-w-0">
          {page.breadcrumbs?.length ? (
            <Breadcrumbs items={page.breadcrumbs} />
          ) : null}

          <h1 className="text-[0.9375rem] md:text-base font-semibold tracking-[-0.011em] truncate">
            {page.title || "Dashboard"}
          </h1>

          {page.description ? (
            <p className="text-xs muted truncate hidden sm:block">
              {page.description}
            </p>
          ) : null}
        </div>

        {page.actions ? (
          <div className="flex flex-row items-center gap-2 shrink-0">
            {page.actions}
          </div>
        ) : null}
      </div>
    </header>
  );
};

const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav aria-label="Breadcrumb" className="hidden sm:block">
    <ol className="flex flex-row items-center gap-1 text-[0.6875rem] muted mb-0.5">
      {items.map((crumb, i) => (
        <Fragment key={`${crumb.label}-${i}`}>
          {i > 0 ? (
            <ChevronRight size={11} className="shrink-0 opacity-50" aria-hidden />
          ) : null}
          <li className="truncate max-w-[12rem]">
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="hover:text-base-content transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              crumb.label
            )}
          </li>
        </Fragment>
      ))}
    </ol>
  </nav>
);

export default MainLayout;
