/**
 * Renders a literal {{TODO: …}} token, visibly. Every instance must be logged in OPEN-ITEMS.md.
 */
export function Todo({ children }: { children: string }) {
  return (
    <span data-todo className="inline-block rounded-xs bg-sand px-1 py-0.5 text-[0.85em] text-olive-deep theme-dark:bg-olive theme-dark:text-bone">
      {`{{TODO: ${children}}}`}
    </span>
  );
}
