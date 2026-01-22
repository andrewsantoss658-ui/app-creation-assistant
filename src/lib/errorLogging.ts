export type ClientErrorLog = {
  id: string;
  timestamp: string;
  name?: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  extra?: Record<string, unknown>;
};

const STORAGE_KEY = "gestum_client_error_logs";
const MAX_LOGS = 200;

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getClientErrorLogs = (): ClientErrorLog[] => {
  if (typeof window === "undefined") return [];
  return safeJsonParse<ClientErrorLog[]>(localStorage.getItem(STORAGE_KEY), []);
};

export const logClientError = (err: unknown, extra?: Record<string, unknown>) => {
  if (typeof window === "undefined") return;

  const error = err instanceof Error ? err : new Error(String(err));

  const entry: ClientErrorLog = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    extra,
  };

  const current = getClientErrorLogs();
  const next = [entry, ...current].slice(0, MAX_LOGS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};
