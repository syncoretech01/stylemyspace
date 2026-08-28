import Link from "next/link";
import { SITE } from "@/lib/site";
import { getContent } from "@/lib/content";
import { Wordmark } from "@/components/ui/Wordmark";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function Footer() {
  const { site } = getContent();
  const socials = [SITE.social.instagram, SITE.social.facebook, SITE.social.linkedin];
  return (
    <footer data-site-footer data-theme="dark" className="bg-olive-deep text-bone">
      <div className="mx-auto w-full max-w-content px-3 py-12 md:px-6 md:py-16 lg:px-10">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-block rounded-xs" aria-label={`${SITE.name} — home`}>
              <Wordmark />
            </Link>
            <p className="measure mt-3 text-sand">{SITE.positioning}</p>
          </div>

          <div className="md:col-span-3">
            <Eyebrow>Studio</Eyebrow>
            <address className="mt-2 not-italic leading-relaxed">
              {SITE.address.street}
              <br />
              {SITE.address.locality}, {SITE.address.region} {SITE.address.postalCode}
              <br />
              <a href={SITE.phoneHref} className="underline-offset-4 hover:underline">
                {SITE.phone}
              </a>
              <br />
              <a href={`mailto:${site.emailDisplayed}`} className="underline-offset-4 hover:underline">
                {site.emailDisplayed}
              </a>
            </address>
          </div>

          <div className="md:col-span-2">
            <Eyebrow>Site</Eyebrow>
            <ul className="mt-2 space-y-1">
              {SITE.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <Eyebrow>Follow</Eyebrow>
            <ul className="mt-2 space-y-1">
              {socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank" className="underline-offset-4 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-bone/20 pt-4 text-small text-sand md:flex-row md:items-center md:justify-between">
          <p>
            Serving the {SITE.serviceAreas.join(", ")}.
          </p>
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
