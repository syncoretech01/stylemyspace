import type { Metadata } from "next";
import { getContent, getProjects, resolveImage } from "@/lib/content";
import { SITE } from "@/lib/site";
import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { Disciplines } from "@/components/sections/Disciplines";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Materials } from "@/components/sections/Materials";
import { Process } from "@/components/sections/Process";
import { ServiceAreas } from "@/components/sections/ServiceAreas";
import { CtaBlock } from "@/components/sections/CtaBlock";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  const content = getContent();
  const projects = getProjects();
  return (
    <>
      <Hero headline={content.home.headline} lede={SITE.positioning} image={resolveImage(content.home.hero)} />
      <Manifesto image={resolveImage(content.home.manifesto)} />
      <Disciplines />
      <FeaturedWork projects={projects} />
      <Materials materials={content.home.materials} />
      <Process />
      <ServiceAreas />
      <CtaBlock />
    </>
  );
}
