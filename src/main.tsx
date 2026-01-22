import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalErrorHandlers from "@/components/GlobalErrorHandlers";

createRoot(document.getElementById("root")!).render(
  <>
    <GlobalErrorHandlers />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </>
);
