import type { Metadata } from "next";
import { getContent, getProjects } from "@/lib/content";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { CtaBlock } from "@/components/sections/CtaBlock";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Selected residential, hospitality, wellness and commercial interiors by Style My Space Design, a woman-owned New York interior design firm.",
  alternates: { canonical: "/portfolio" },
  openGraph: { url: "/portfolio" },
};

export default function PortfolioPage() {
  const { portfolio } = getContent();
  return (
    <>
      <PortfolioGrid projects={getProjects()} title={portfolio.title} intro={portfolio.intro} />
      <CtaBlock />
    </>
  );
}
