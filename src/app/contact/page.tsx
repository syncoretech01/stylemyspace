import type { Metadata } from "next";
import { ContactIntro, ContactForm, ContactDetails } from "@/components/sections/Contact";
import { ServiceAreas } from "@/components/sections/ServiceAreas";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Style My Space Design — interior design in the New York Tri-State Area, New Jersey, Miami and Atlanta. 516-500-5886.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <ContactIntro />
      <ContactForm />
      <ContactDetails />
      <ServiceAreas />
    </>
  );
}
