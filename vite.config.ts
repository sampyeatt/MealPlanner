import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dev-only pass-through for recipe-page fetches (src/recipeImport.ts).
 *
 * Recipe sites send no CORS headers. On device the request goes out through
 * Capacitor's native HTTP stack, which sidesteps that; in the browser there is
 * no native layer, so `vite dev` fetches the page server-side instead. Not part
 * of any build — `apply: "serve"` keeps it out of production.
 */
function recipeProxy(): Plugin {
  const browserUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

  return {
    name: "recipe-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__recipe", async (req, res) => {
        // Mounted at a path, so `req.url` is only the remainder ("/?url=...").
        const target = new URL(req.url ?? "", "http://localhost").searchParams.get(
          "url",
        );
        if (!target) {
          res.statusCode = 400;
          res.end("missing ?url=");
          return;
        }
        try {
          // Some sites serve a stub to non-browser agents; ask as a browser.
          const upstream = await fetch(target, {
            headers: {
              "User-Agent": browserUserAgent,
              Accept: "text/html,application/xhtml+xml",
            },
          });
          const body = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(body);
        } catch (err) {
          res.statusCode = 502;
          res.end(String(err));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), recipeProxy()],
  // Prevent Vite from clearing Rust's terminal output when run under Tauri.
  clearScreen: false,
  server: {
    // Tauri expects a fixed port; fail if it is taken instead of picking another.
    port: 1420,
    strictPort: false,
    watch: {
      // Rust sources are watched by Tauri, not Vite.
      ignored: ["**/src-tauri/**", "**/android/**"],
    },
  },
});
