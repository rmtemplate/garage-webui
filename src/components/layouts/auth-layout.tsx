import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { LoadingBlock } from "../ui/states";
import ThemeSwitcher from "../containers/theme-switcher";

const AuthLayout = () => {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-svh grid place-items-center">
        <LoadingBlock label="Loading…" />
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center px-4 py-10 bg-base-200">
      {/* A single, very soft wash — enough to stop the page reading as a
          blank form, not enough to be decoration for its own sake. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80
                   bg-gradient-to-b from-primary/[0.07] to-transparent"
      />

      <div className="relative w-full max-w-sm">
        <Outlet />
      </div>

      <div className="relative mt-8">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default AuthLayout;
