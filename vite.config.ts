import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prevent Vite from clearing Rust's terminal output when run under Tauri.
  clearScreen: false,
  server: {
    // Tauri expects a fixed port; fail if it is taken instead of picking another.
    port: 1420,
    strictPort: false,
    watch: {
      // Rust sources are watched by Tauri, not Vite.
      ignored: ["**/src-tauri/**"],
    },
  },
});
