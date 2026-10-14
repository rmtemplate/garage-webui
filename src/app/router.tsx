import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import AuthLayout from "@/components/layouts/auth-layout";
import MainLayout from "@/components/layouts/main-layout";
import RouteError from "./route-error";
import { BASE_PATH } from "@/lib/consts";
import { LoadingBlock } from "@/components/ui/states";

const LoginPage = lazy(() => import("@/pages/auth/login"));
const ClusterPage = lazy(() => import("@/pages/cluster/page"));
const HomePage = lazy(() => import("@/pages/home/page"));
const BucketsPage = lazy(() => import("@/pages/buckets/page"));
const ManageBucketPage = lazy(() => import("@/pages/buckets/manage/page"));
const KeysPage = lazy(() => import("@/pages/keys/page"));

const router = createBrowserRouter(
  [
    {
      path: "/auth",
      Component: AuthLayout,
      ErrorBoundary: RouteError,
      children: [
        {
          path: "login",
          Component: LoginPage,
        },
      ],
    },
    {
      path: "/",
      Component: MainLayout,
      ErrorBoundary: RouteError,
      children: [
        {
          index: true,
          Component: HomePage,
        },
        {
          path: "cluster",
          Component: ClusterPage,
        },
        {
          path: "buckets",
          children: [
            { index: true, Component: BucketsPage },
            { path: ":id", Component: ManageBucketPage },
          ],
        },
        {
          path: "keys",
          Component: KeysPage,
        },
      ],
    },
    {
      path: "*",
      Component: RouteError,
    },
  ],
  {
    basename: BASE_PATH,
  }
);

const Router = () => {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default Router;
