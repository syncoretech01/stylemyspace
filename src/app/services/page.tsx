import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { ServicesIntro, DisciplinesList, ServiceList, Consultations } from "@/components/sections/Services";
import { CtaBlock } from "@/components/sections/CtaBlock";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Interior design, interior architecture, space planning, office design and home staging across residential, hospitality, wellness and commercial interiors.",
  alternates: { canonical: "/services" },
  openGraph: { url: "/services" },
};

export default function ServicesPage() {
  const { consultations, site } = getContent();
  return (
    <>
      <ServicesIntro />
      <DisciplinesList />
      <ServiceList />
      <Consultations items={consultations} showPricing={site.showPricing} />
      <CtaBlock />
    </>
  );
}
