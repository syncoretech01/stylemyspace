import type { ProjectsFile } from "@/lib/content.schema";
import { getContent } from "@/lib/content";
import { bindDashes, proseList } from "@/lib/prose";
import { SITE } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";
import { AboutMotionRoot } from "./AboutMotionRoot";

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
      <Section aria-labelledby="about-title" className="pb-8 md:pb-10 lg:pt-12 lg:pb-12" data-section="about-intro">
        <Container>
          {/* Drawn from SITE.positioning. Its hyphen/en-dash compounds ("woman-owned", "New York–based")
              broke mid-word at display size, so the statement uses the short words of the same sentence;
              the compounds are carried verbatim by the positioning line below. */}
          <Heading as="h1" id="about-title" size="display" className="max-w-[17ch]" data-reveal data-reveal-lcp>
            Spaces that balance <em>ease and&nbsp;elegance.</em>
          </Heading>
          <div className="mt-5 grid gap-3 lg:mt-6 lg:grid-cols-12 lg:items-start lg:gap-4">
            <p className="lede max-w-[38ch] text-balance lg:col-span-6">{bindDashes(SITE.positioning)}</p>
            <p className="max-w-[46ch] text-olive lg:col-span-5 lg:col-start-8 lg:pt-0.5">
              {`Our work spans ${disciplines} interiors: ${services}, across the ${areas}.`}
            </p>
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
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-4">
            <div className="md:w-7/12 lg:col-span-5 lg:w-auto" data-portrait>
              <SmartImage
                image={designer.portrait}
                lcp
                quality={85}
                sizes="(min-width: 1024px) 40vw, (min-width: 768px) 60vw, 100vw"
                className="aspect-[4/5]"
                objectPosition="50% 62%"
                placeholderTodo="portrait of Eve Jean"
              />
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="text-olive" data-reveal>
                {designer.heading}
              </p>
              <Heading id="designer-title" size="h1" className="mt-1" data-reveal>
                {designer.name}
                <em className="mt-1 block text-h3 text-olive">{designer.role}</em>
              </Heading>
              <div className="mt-4 border-t border-brass pt-4">
                {designer.bio.map((p, i) => (
                  <p key={p} className={i === 0 ? "measure" : "lede mt-4 max-w-[36ch]"} data-reveal>
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
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[calc(var(--header-h)+4rem)]">
                <Heading id="approach-title" data-reveal>
                  How we <em>work</em>
                </Heading>
                <p className="mt-3 max-w-[34ch]" data-reveal>
                  {SITE.approach}
                </p>
                {post && (
                  <p className="mt-3 max-w-[34ch] text-small text-olive" data-reveal>
                    The principles are from the studio&rsquo;s journal:{" "}
                    <a
                      href={post.sourceUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="rounded-xs underline decoration-1 underline-offset-4 transition-colors duration-(--dur-micro) hover:text-ink"
                    >
                      {post.title}
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </p>
                )}
              </div>
            </div>

            <ul className="lg:col-span-7 lg:col-start-6" role="list">
              {PRINCIPLES.map((p, i) => (
                <li key={p.title} className={i > 0 ? "mt-5 border-t border-taupe pt-5 lg:mt-6 lg:pt-6" : undefined} data-reveal>
                  <h3 className="font-display text-h2">{p.title}</h3>
                  <p className="mt-2 max-w-[50ch] text-olive">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
    </AboutMotionRoot>
  );
}
