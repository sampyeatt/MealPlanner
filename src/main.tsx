import React from "react";
import ReactDOM from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { defineCustomElements as defineJeepSqlite } from "jeep-sqlite/loader";
import App from "./App";
import { initDb } from "./db";

// PrimeReact theme (dark + green accent to match the app palette), core
// component styles, and icon font — imported before styles.css so our custom
// layout rules win where they overlap.
import "primereact/resources/themes/lara-dark-green/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./styles.css";

const queryClient = new QueryClient();

/** Bring up the SQLite store, then mount the app. */
async function bootstrap() {
  // On web, @capacitor-community/sqlite runs on wasm via the jeep-sqlite web
  // component; on device it uses native SQLite and this block is skipped.
  if (Capacitor.getPlatform() === "web") {
    defineJeepSqlite(window);
    const jeep = document.createElement("jeep-sqlite");
    document.body.appendChild(jeep);
    await customElements.whenDefined("jeep-sqlite");
  }

  await initDb();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <PrimeReactProvider>
          <App />
        </PrimeReactProvider>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

bootstrap();
