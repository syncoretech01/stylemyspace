import { cn } from "./cn";

/** Logotype: display serif, letter-spaced, with a small sans suffix. */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 whitespace-nowrap", className)}>
      <span className={cn("font-display uppercase tracking-[0.18em]", compact ? "text-[0.95rem]" : "text-[1.1rem]")}>
        Style My Space
      </span>{" "}
      <span className="eyebrow text-olive theme-dark:text-sand">Design</span>
    </span>
  );
}
