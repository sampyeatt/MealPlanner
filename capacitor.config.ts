import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sam.mealplanner",
  appName: "mealplanner",
  webDir: "dist",
  plugins: {
    // Route `window.fetch` through the native HTTP stack. Recipe sites send no
    // CORS headers, so importing ingredients from a link (src/recipeImport.ts)
    // would be blocked from the WebView otherwise; native requests are not
    // subject to CORS. This is global — every fetch in the app goes native on
    // device.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
