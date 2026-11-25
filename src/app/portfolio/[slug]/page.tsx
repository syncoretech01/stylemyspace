import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdjacentProjects, getCover, getProject, getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { JsonLd, breadcrumbGraph, projectGraph } from "@/components/layout/JsonLd";
import { CaseHero, CaseBlocks, CaseGallery, NextProject } from "@/components/sections/CaseStudy";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const cover = getCover(project);
  return pageMetadata({
    title: project.title,
    description: project.description,
    path: `/portfolio/${project.slug}`,
    image: cover ? { url: `/projects/${project.slug}/og.jpg`, width: 1200, height: 630, alt: cover.alt } : undefined,
  });
}

export default async function ProjectPage({ params }: PageProps<"/portfolio/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const adjacent = getAdjacentProjects(project.slug);
  return (
    <>
      <CaseHero project={project} />
      <CaseBlocks project={project} />
      <CaseGallery project={project} />
      {adjacent && <NextProject next={adjacent.next} prev={adjacent.prev} />}
      <JsonLd data={projectGraph(project)} />
      <JsonLd data={breadcrumbGraph(project)} />
    </>
  );
}
