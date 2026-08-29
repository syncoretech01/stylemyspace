import Link from "next/link";
import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { Wordmark } from "@/components/ui/Wordmark";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** "a, b, c and d" — prose join for Section 2 lists. */
function proseList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1] ?? ""}`;
}

/** Bind the closing token (unit number, ZIP) to the word before it so it never orphans. */
const bindLast = (s: string) => s.replace(/\s+(\S+)$/, "\u00a0$1");

/**
 * The firm descriptor — SITE.positioning without its "creating spaces…" tail, which the home hero
 * already carries in full. Derived rather than retyped so the fact stays single-sourced.
 */
const descriptor = (() => {
  const [head = SITE.positioning] = SITE.positioning.split(" creating ");
  return head.endsWith(".") ? head : `${head}.`;
})();

// One 44px row per line: the address shares the links' rhythm, so every column's first line lands
// on the same baseline instead of the links sitting 11px lower than the address.
const row = "min-h-[2.75rem] items-center";
const link = `inline-flex ${row} rounded-xs text-small text-bone decoration-1 underline-offset-6 transition-colors duration-(--dur-micro) hover:underline focus-visible:underline`;

/**
 * Site footer. Keeps [data-site-footer] + data-theme="dark": globals.css pins it beneath <main>
 * for the sticky reveal (static under reduced motion). Facts: src/lib/site.ts + the live footer email.
 *
 * Three tiers — identity, columns, meta — so the wordmark is never asked to share a first line with
 * the column eyebrows, and Studio / Site / Follow divide the row evenly at every width.
 */
export function Footer() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <footer data-site-footer data-theme="dark" className="bg-olive-deep text-bone">
      {/* The sticky reveal in globals.css only works while the footer FITS the viewport (it is pinned
          at ≥1024 from a 640px-tall window up), so the paddings are kept tight: 593px at 1440/1024. */}
      <div className="mx-auto w-full max-w-content px-3 pt-10 pb-4 md:px-6 md:pt-12 lg:px-10 lg:pt-16">
        <div className="flex flex-col gap-1 border-b border-bone/20 pb-4 md:flex-row md:items-baseline md:justify-between md:gap-8">
          <Link href="/" className="inline-flex min-h-[2.75rem] items-center rounded-xs">
            <Wordmark />
          </Link>
          <p className="max-w-[44ch] text-small text-sand">{descriptor}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 md:mt-6 md:grid-cols-3 md:gap-x-3 lg:gap-x-8">
          <div className="col-span-2 min-w-0 md:col-span-1">
            <Eyebrow>Studio</Eyebrow>
            <address className="mt-2 text-small not-italic">
              <span className={`flex ${row}`}>{bindLast(SITE.address.street)}</span>
              <span className={`flex ${row}`}>
                {`${SITE.address.locality}, ${bindLast(`${SITE.address.region} ${SITE.address.postalCode}`)}`}
              </span>
            </address>
            <ul role="list">
              <li>
                <a href={SITE.phoneHref} className={link}>
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.emailDisplayed}`} className={`${link} [overflow-wrap:anywhere]`}>
                  {site.emailDisplayed}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Footer" className="min-w-0">
            <Eyebrow>Site</Eyebrow>
            <ul className="mt-2" role="list">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            <Eyebrow>Follow</Eyebrow>
            <ul className="mt-2" role="list">
              {socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank" className={link}>
                    {s.label}
                    <span className="visually-hidden"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1 border-t border-bone/20 pt-4 text-small text-sand md:flex-row md:items-center md:justify-between md:gap-4">
          <p>Serving the {proseList(SITE.serviceAreas)}.</p>
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
