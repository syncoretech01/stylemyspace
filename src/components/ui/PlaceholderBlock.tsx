import { cn } from "./cn";
import { Todo } from "./Todo";

/**
 * Neutral placeholder for a missing image, in the brand palette. Never a stock photo.
 * Pass `todo` to render the literal {{TODO}} token describing what is needed.
 */
export function PlaceholderBlock({
  className,
  label = "Image pending",
  todo,
}: {
  className?: string;
  label?: string;
  todo?: string;
}) {
  return (
    <div role="img" aria-label={label} className={cn("relative flex items-end overflow-clip bg-sand", className)}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-70 bg-[linear-gradient(135deg,transparent_calc(50%-0.5px),var(--color-taupe)_calc(50%-0.5px),var(--color-taupe)_calc(50%+0.5px),transparent_calc(50%+0.5px))]"
      />
      <div aria-hidden className="absolute inset-0 border border-taupe" />
      <p className="relative m-2 eyebrow text-olive">{todo ? <Todo>{todo}</Todo> : label}</p>
    </div>
  );
}
