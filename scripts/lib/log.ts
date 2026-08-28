/** Tiny leveled console logger shared by the content scripts. */
export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let threshold: LogLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
if (!(threshold in ORDER)) threshold = "info";

const stamp = () => new Date().toISOString().slice(11, 19);

function emit(level: LogLevel, scope: string, msg: string, extra?: unknown): void {
  if (ORDER[level] < ORDER[threshold]) return;
  const line = `${stamp()} ${level.toUpperCase().padEnd(5)} [${scope}] ${msg}`;
  const out = level === "error" || level === "warn" ? console.error : console.log;
  if (extra === undefined) out(line);
  else out(line, typeof extra === "string" ? extra : JSON.stringify(extra));
}

export function setLogLevel(level: LogLevel): void {
  threshold = level;
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, extra?: unknown) => emit("debug", scope, msg, extra),
    info: (msg: string, extra?: unknown) => emit("info", scope, msg, extra),
    warn: (msg: string, extra?: unknown) => emit("warn", scope, msg, extra),
    error: (msg: string, extra?: unknown) => emit("error", scope, msg, extra),
  };
}

export type Logger = ReturnType<typeof createLogger>;

/** Format an unknown thrown value for logs. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}
