import Link from "next/link";
import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { bindDashes, proseList } from "@/lib/prose";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BackToTop } from "./BackToTop";

/** Bind the closing token (unit number, ZIP) to the word before it so it never orphans. */
const bindLast = (s: string) => s.replace(/\s+(\S+)$/, " $1");

/**
 * The firm descriptor: SITE.positioning without its "creating spaces…" tail, which the home hero
 * already carries in full. Derived rather than retyped so the fact stays single-sourced.
 */
const descriptor = (() => {
  const [head = SITE.positioning] = SITE.positioning.split(" creating ");
  return bindDashes(head.endsWith(".") ? head : `${head}.`);
})();

// One 40px row per line, so the address shares the links' rhythm and every column's first line lands
// on the same baseline.
const row = "min-h-5 items-center";
const link = `inline-flex ${row} rounded-xs text-small text-bone/90 decoration-1 underline-offset-6 transition-colors duration-(--dur-micro) hover:text-bone hover:underline focus-visible:underline`;

/**
 * Site footer. Keeps [data-site-footer] + data-theme="dark": globals.css pins it beneath <main> for the
 * sticky reveal (static under reduced motion), which only works while the footer FITS the viewport.
 * It is pinned from a 640px-tall window up, so the whole composition is kept under that.
 */
export function Footer() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <footer data-site-footer data-theme="dark" className="overflow-clip bg-olive-deep text-bone">
      <div className="mx-auto w-full max-w-content px-3 pt-8 md:px-6 md:pt-9 lg:px-10 lg:pt-9">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-12">
          <p className="lede col-span-2 max-w-[26ch] text-balance text-sand md:col-span-12 lg:col-span-4">{descriptor}</p>

          <div className="col-span-2 min-w-0 md:col-span-5 lg:col-span-4">
            <Eyebrow>Studio</Eyebrow>
            <address className="mt-1 text-small text-bone/90 not-italic">
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

          <nav aria-label="Footer" className="min-w-0 md:col-span-3 lg:col-span-2">
            <Eyebrow>Site</Eyebrow>
            <ul className="mt-1" role="list">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 md:col-span-4 lg:col-span-2">
            <Eyebrow>Follow</Eyebrow>
            <ul className="mt-1" role="list">
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

        <div className="mt-5 flex flex-col gap-1 border-t border-bone/20 pt-1.5 text-small text-sand md:mt-6 md:flex-row md:items-center md:justify-between md:gap-4">
          <p>Serving the {proseList(SITE.serviceAreas)}.</p>
          <div className="flex flex-wrap items-center justify-between gap-x-5">
            <p>
              © {new Date().getFullYear()} {SITE.name}
            </p>
            <BackToTop />
          </div>
        </div>

        {/* The name at full measure: sized in container units so it always spans the column exactly. */}
        <div className="@container mt-2 md:mt-3">
          <Link
            href="/"
            aria-label={`${SITE.name}, home`}
            className="block rounded-xs pb-2 text-center font-display text-[12.7cqw] leading-none font-medium tracking-[0.02em] whitespace-nowrap text-bone/90 uppercase transition-colors duration-(--dur-short) hover:text-bone"
          >
            <span aria-hidden>Style My Space</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
