import { cn } from "./cn";

/** Logotype: tracked Cormorant capitals with a small tracked-sans suffix. */
export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 whitespace-nowrap min-[360px]:gap-1.5", className)}>
      <span
        className={cn(
          "font-display font-medium uppercase leading-none tracking-[0.2em]",
          compact ? "text-[1.0625rem]" : "text-[0.9375rem] min-[360px]:text-[1.0625rem] sm:text-[1.1875rem] lg:text-[1.3125rem]",
        )}
      >
        Style My Space
      </span>{" "}
      <span className="eyebrow text-[0.6875rem] text-olive sm:text-[0.75rem] theme-dark:text-sand">Design</span>
    </span>
  );
}
