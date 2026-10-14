import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  process.env = { ...process.env, ...env };

  const isDemo = env.VITE_DEMO_MODE === "true";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      // Demo Mode avoids Vite's default 5173: on Windows with Hyper-V/WSL
      // enabled, 5173 usually falls inside a reserved TCP range and the
      // server dies with `EACCES ::1:5173`. 4280 sits clear of those ranges.
      // Not strict, so Vite still steps to the next free port if it is taken.
      ...(isDemo ? { port: 4280 } : {}),

      // Local Demo Mode answers every request from the in-memory mock adapter,
      // so there is nothing to proxy — and no proxy is registered, which makes
      // it impossible for a stray request to reach a real backend.
      proxy:
        isDemo || !env.VITE_API_URL
          ? undefined
          : {
              "/api": {
                target: env.VITE_API_URL,
                changeOrigin: true,
              },
            },
    },
  };
});
