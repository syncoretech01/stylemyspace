import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { AboutIntro, AboutDesigner, AboutApproach } from "@/components/sections/About";
import { ServiceAreas } from "@/components/sections/ServiceAreas";
import { CtaBlock } from "@/components/sections/CtaBlock";

export const metadata: Metadata = {
  title: "About",
  description:
    "Style My Space Design is a woman-owned, New York–based interior design firm led by Principal Designer Eve Jean, creating spaces that balance elegance with ease.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about" },
};

export default function AboutPage() {
  const { home } = getContent();
  return (
    <>
      <AboutIntro />
      <AboutDesigner designer={home.meetTheDesigner} />
      <AboutApproach />
      <ServiceAreas />
      <CtaBlock />
    </>
  );
}
