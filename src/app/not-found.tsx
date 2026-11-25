import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <Section className="grid min-h-[70svh] content-center">
      <Container>
        <Heading as="h1" size="display" className="max-w-[12ch]">
          This page has <em>moved</em> or never existed.
        </Heading>
        <p className="lede mt-4 max-w-[36ch]">Explore the portfolio, or start a conversation about your project.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button href="/portfolio">View the work</Button>
          <Button href="/contact" variant="outline">
            Start a project
          </Button>
        </div>
      </Container>
    </Section>
  );
}
