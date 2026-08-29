import type { ProjectsFile } from "@/lib/content.schema";
import { getContent } from "@/lib/content";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { AboutMotionRoot } from "./AboutMotionRoot";

/** "a, b, c and d" — prose join for Section 2 lists. */
function proseList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1] ?? ""}`;
}

/**
 * Statement (Nine To Five hierarchy: statement → portrait → detail). The h1 is the page's only h1;
 * both paragraphs are built solely from Section 2 facts in src/lib/site.ts.
 */
export function AboutIntro() {
  const disciplines = proseList(SITE.disciplines.map((d) => d.toLowerCase()));
  const services = proseList(SITE.services.map((s) => s.toLowerCase()));
  const areas = proseList(SITE.serviceAreas);
  return (
    <AboutMotionRoot>
      <Section aria-labelledby="about-title" className="lg:pt-24" data-section="about-intro">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-4 xl:gap-8">
            <div className="lg:col-span-10">
              <Eyebrow>About</Eyebrow>
              {/* Drawn from SITE.positioning. Its hyphen/en-dash compounds ("woman-owned",
                  "New York–based") broke mid-word and orphaned at display size on three of the five
                  widths and cannot be held together at 390 without overflowing, so the statement
                  uses the short words of the same sentence; the compounds are carried verbatim by
                  the positioning line at lead size below. */}
              <Heading as="h1" id="about-title" size="display" className="mt-3 max-w-[13ch]" data-reveal data-reveal-lcp>
                Spaces that balance ease and elegance.
              </Heading>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="measure text-lead">{SITE.positioning}</p>
              <p className="measure mt-4 text-olive">
                {`Our work spans ${disciplines} interiors — ${services} — across the ${areas}.`}
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </AboutMotionRoot>
  );
}

/** Portrait beside the designer's own copy, verbatim from the live "Meet the Designer" block. */
export function AboutDesigner({ designer }: { designer: ProjectsFile["home"]["meetTheDesigner"] }) {
  return (
    <AboutMotionRoot>
      <Section tone="sand" aria-labelledby="designer-title" data-section="about-designer">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-4 xl:gap-8">
            <div className="md:w-7/12 lg:col-span-6 lg:w-auto xl:col-span-5">
              <SmartImage
                image={designer.portrait}
                lcp
                quality={85}
                sizes="(min-width: 1024px) 40vw, (min-width: 768px) 60vw, 100vw"
                className="aspect-[3/4]"
                objectPosition="50% 35%"
                placeholderTodo="portrait of Eve Jean — pending image pipeline"
              />
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-6 xl:col-span-7 xl:col-start-6">
              <Eyebrow data-reveal>{designer.heading}</Eyebrow>
              <Heading id="designer-title" className="mt-3" data-reveal>
                <span className="whitespace-nowrap">{designer.role}:</span> {designer.name}
              </Heading>
              <div className="mt-6 border-t border-brass pt-4">
                {designer.bio.map((p, i) => (
                  <p key={p} className={i === 0 ? "measure text-lead" : "measure mt-4"} data-reveal>
                    {p}
                  </p>
                ))}
                {designer.pressConfirmed && designer.pressMention && (
                  <p className="measure mt-4 text-olive" data-reveal>
                    {designer.pressMention}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </AboutMotionRoot>
  );
}

/** Principles quoted verbatim from the firm's own blog post ("Tranquil and Functional Interior Design"). */
export const PRINCIPLES = [
  { title: "Intentional Design Choices", body: "Every color, texture, and material is selected to evoke calm and balance." },
  { title: "Customized Functionality", body: "We work with you to understand how you use your space and design solutions that make your life easier." },
  { title: "Sustainability Matters", body: "Incorporating eco-friendly materials and designs not only helps the environment but also contributes to a healthier, more serene atmosphere." },
];

const PRINCIPLES_POST_SLUG = "functional-and-tranquil-interior-design-solutions-by-style-my-space";

export function AboutApproach() {
  const post = getContent().blog.find((b) => b.slug === PRINCIPLES_POST_SLUG) ?? null;
  return (
    <AboutMotionRoot>
      <Section aria-labelledby="approach-title" data-section="about-approach">
        <Container>
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-4 xl:gap-8">
            <div className="lg:col-span-5">
              <Eyebrow data-reveal>Approach</Eyebrow>
              <Heading id="approach-title" className="mt-3 max-w-[12ch]" data-reveal>
                How we work
              </Heading>
            </div>
            <p className="measure text-lead lg:col-span-7 lg:self-end" data-reveal>
              {SITE.approach}
            </p>
          </div>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 md:mt-14 md:gap-4 lg:grid-cols-3" role="list">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title} className="border-t border-taupe pt-3" data-reveal>
                <span className="font-display text-h2 leading-none text-brass tabular-nums" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-h3">{p.title}</h3>
                <p className="mt-2 max-w-[38ch] text-olive">{p.body}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8 max-w-[60ch] text-small text-olive" data-reveal>
            <span className="eyebrow">From the studio&rsquo;s journal</span>
            {post && (
              <>
                {" — "}
                <a
                  href={post.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="rounded-xs underline decoration-1 underline-offset-4 transition-colors duration-(--dur-micro) hover:text-ink"
                >
                  &ldquo;{post.title}&rdquo;
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </>
            )}
          </p>
        </Container>
      </Section>
    </AboutMotionRoot>
  );
}
