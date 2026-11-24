import { pageMetadata } from "@/lib/metadata";
import { ContactMain, ContactDetails } from "@/components/sections/Contact";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with Style My Space Design: interior design in the New York Tri-State Area, New Jersey, Miami and Atlanta. 516-500-5886.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <ContactMain />
      <ContactDetails />
    </>
  );
}
