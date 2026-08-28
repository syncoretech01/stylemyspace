import { cn } from "@/components/ui/cn";

/**
 * Scroll cue: a thin bone rule ending in a chevron, linking to the manifesto.
 * Static in P0–P2; P3 fades it (autoAlpha 0) after the first 50 px of scroll via data-hero="cue".
 */
export function ScrollCue({ className }: { className?: string }) {
  return (
    <a
      href="#manifesto"
      data-hero="cue"
      className={cn(
        "group inline-flex min-h-11 min-w-11 flex-col items-center justify-end gap-1 rounded-xs text-bone",
        className,
      )}
    >
      <span className="visually-hidden">Scroll to the manifesto</span>
      <span
        aria-hidden
        className="block h-8 w-px origin-top bg-bone/80 transition-transform duration-(--dur-short) ease-(--ease-out-expo) group-hover:scale-y-150 lg:h-10"
      />
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        width="12"
        height="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block opacity-80"
      >
        <path d="M1 1.5 6 6.5 11 1.5" />
      </svg>
    </a>
  );
}
