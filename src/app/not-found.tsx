import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Section className="min-h-[70svh]">
      <Container>
        <Eyebrow>404</Eyebrow>
        <Heading as="h1" size="h1" className="mt-2">
          This page has moved or never existed.
        </Heading>
        <p className="measure mt-3 text-lead">Explore the portfolio or start a conversation about your project.</p>
        <div className="mt-6 flex gap-2">
          <Button href="/portfolio">View the portfolio</Button>
          <Button href="/contact" variant="outline">
            Contact
          </Button>
        </div>
      </Container>
    </Section>
  );
}
