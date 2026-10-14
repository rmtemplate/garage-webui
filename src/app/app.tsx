import { PageContextProvider } from "@/context/page-context";
import Router from "./router";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ThemeProvider from "@/components/containers/theme-provider";
import { ConfirmDialogHost } from "@/components/ui/confirm";
import "./styles.css";

const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The admin API is cheap and the data is operational — a short
            // staleness window keeps pages snappy without going stale.
            staleTime: 10_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <PageContextProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <ConfirmDialogHost />
      </QueryClientProvider>

      <Toaster
        richColors
        closeButton
        position="bottom-right"
        toastOptions={{
          className: "!rounded-box !border !text-[0.8125rem] !font-sans",
        }}
      />
      <ThemeProvider />
    </PageContextProvider>
  );
};

export default App;
