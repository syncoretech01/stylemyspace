import Link from "next/link";
import type { Route } from "next";
import type { Project } from "@/lib/content.schema";
import { getCover } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";

/** STUB (P0). Owner ④: pinned horizontal parallax track; native scroll-snap list on mobile/reduced. */
export function FeaturedWork({ projects }: { projects: Project[] }) {
  const featured = projects.slice(0, 5);
  return (
    <Section tone="sand" aria-labelledby="featured-title">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Selected work</Eyebrow>
            <Heading id="featured-title" className="mt-2">
              Recent projects
            </Heading>
          </div>
          <Button href="/portfolio" variant="ghost">
            All projects
          </Button>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3" role="list">
          {featured.map((p, i) => (
            <li key={p.slug}>
              <Link href={`/portfolio/${p.slug}` as Route} className="group block rounded-xs" data-cursor="View">
                <SmartImage image={getCover(p)} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[4/5]" placeholderTodo={`${p.title} cover — pending image pipeline`} />
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-h3">{p.title}</h3>
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
