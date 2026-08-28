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

const link =
  "inline-flex min-h-[2.75rem] items-center rounded-xs text-small text-bone decoration-1 underline-offset-6 transition-colors duration-(--dur-micro) hover:underline focus-visible:underline";

/**
 * Site footer. Keeps [data-site-footer] + data-theme="dark": globals.css pins it beneath <main>
 * for the sticky reveal (static under reduced motion). Facts: src/lib/site.ts + the live footer email.
 */
export function Footer() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <footer data-site-footer data-theme="dark" className="bg-olive-deep text-bone">
      <div className="mx-auto w-full max-w-content px-3 pt-12 pb-4 md:px-6 md:pt-16 lg:px-10 lg:pt-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-12 md:gap-x-6 lg:gap-x-8">
          <div className="col-span-2 md:col-span-12 lg:col-span-5">
            <Link href="/" className="inline-flex min-h-[2.75rem] items-center rounded-xs">
              <Wordmark />
            </Link>
            <p className="mt-3 max-w-[38ch] text-small text-sand">{SITE.positioning}</p>
          </div>

          <div className="col-span-2 md:col-span-5 lg:col-span-3">
            <Eyebrow>Studio</Eyebrow>
            <address className="mt-2 text-small not-italic leading-relaxed">
              {SITE.address.street}
              <br />
              {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
            </address>
            <ul className="mt-2" role="list">
              <li>
                <a href={SITE.phoneHref} className={link}>
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.emailDisplayed}`} className={`${link} break-all`}>
                  {site.emailDisplayed}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Footer" className="md:col-span-3 lg:col-span-2">
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

          <div className="md:col-span-4 lg:col-span-2">
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

        <div className="mt-12 flex flex-col gap-1 border-t border-bone/20 pt-4 text-small text-sand md:mt-16 md:flex-row md:items-center md:justify-between md:gap-4">
          <p>Serving the {proseList(SITE.serviceAreas)}.</p>
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
