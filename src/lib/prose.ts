/** "a, b, c and d": joins a fact list for use inside a sentence. */
export function proseList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1] ?? ""}`;
}

/**
 * Holds a compound like "New York–based" together. An en dash is a line-break opportunity, so without a
 * word joiner after it a line can end on "New York–".
 */
export const bindDashes = (s: string) => s.replace(/–/g, "–\u2060");
