import { useEffect } from "react";
import { toast } from "sonner";
import { logClientError } from "@/lib/errorLogging";

export default function GlobalErrorHandlers() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const err = event.error ?? new Error(event.message);
      console.error("window.onerror:", err);
      logClientError(err, {
        source: "window.onerror",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      toast.error("Ocorreu um erro inesperado. Se persistir, recarregue a página.");
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("unhandledrejection:", event.reason);
      logClientError(event.reason, { source: "unhandledrejection" });
      toast.error("Ocorreu um erro inesperado. Se persistir, recarregue a página.");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
