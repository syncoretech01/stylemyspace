import Link from "next/link";
import type { Route } from "next";
import type { Project } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { SmartImage } from "@/components/ui/SmartImage";

type Props = { projects: Project[]; title: string; intro: string };

/** STUB (P0). Owner ④: editorial grid, staggered entrance, 3D tilt, Flip zoom into the case study. */
export function PortfolioGrid({ projects, title, intro }: Props) {
  return (
    <Section aria-labelledby="portfolio-title">
      <Container>
        <Eyebrow>Portfolio</Eyebrow>
        <Heading as="h1" id="portfolio-title" size="h1" className="mt-2">
          {title}
        </Heading>
        <p className="measure mt-4 text-lead">{intro}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list">
          {projects.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/portfolio/${p.slug}` as Route} className="group block rounded-xs" data-cursor="View" data-flip-id={p.slug}>
                <SmartImage image={getCover(p)} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[4/5]" placeholderTodo={`${p.title} cover — pending image pipeline`} />
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-h3">{p.title}</h2>
                  <span className="eyebrow text-olive">{String(i + 1).padStart(2, "0")}</span>
                </div>
                {p.category && <p className="text-small text-olive">{p.category}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
