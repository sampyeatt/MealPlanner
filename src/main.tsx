import React from "react";
import ReactDOM from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

// PrimeReact theme (dark + green accent to match the app palette), core
// component styles, and icon font — imported before styles.css so our custom
// layout rules win where they overlap.
import "primereact/resources/themes/lara-dark-green/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
