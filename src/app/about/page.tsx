import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { AboutIntro, AboutDesigner, AboutApproach } from "@/components/sections/About";
import { CtaBlock } from "@/components/sections/CtaBlock";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Style My Space Design is a woman-owned, New York–based interior design firm led by Principal Designer Eve Jean, creating spaces that balance elegance with ease.",
  path: "/about",
});

export default function AboutPage() {
  const { home } = getContent();
  return (
    <>
      <AboutIntro />
      <AboutDesigner designer={home.meetTheDesigner} />
      <AboutApproach />
      <CtaBlock />
    </>
  );
}
