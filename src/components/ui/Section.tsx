import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export type Tone = "bone" | "sand" | "dark";

const tones: Record<Tone, string> = {
  bone: "bg-bone text-ink",
  sand: "bg-sand text-ink",
  dark: "bg-olive-deep text-bone",
};

type Props = ComponentPropsWithoutRef<"section"> & { tone?: Tone; flush?: boolean };

/** Page section with brand tone. Dark sections get data-theme="dark" so focus rings switch to sand. */
export function Section({ tone = "bone", flush = false, className, children, ...rest }: Props) {
  return (
    <section
      data-theme={tone === "dark" ? "dark" : undefined}
      className={cn("relative", tones[tone], !flush && "py-10 md:py-14 lg:py-20", className)}
      {...rest}
    >
      {children}
    </section>
  );
}
