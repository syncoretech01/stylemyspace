import { getContent, getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { PortfolioGrid } from "@/components/sections/PortfolioGrid";
import { CtaBlock } from "@/components/sections/CtaBlock";

export const metadata = pageMetadata({
  title: "Portfolio",
  description:
    "Selected residential, hospitality, wellness and commercial interiors by Style My Space Design, a woman-owned New York interior design firm.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  const { portfolio } = getContent();
  return (
    <>
      <PortfolioGrid projects={getProjects()} title={portfolio.title} intro={portfolio.intro} />
      <CtaBlock />
    </>
  );
}
