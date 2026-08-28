import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "./cn";

type Size = "display" | "h1" | "h2" | "h3";
const sizes: Record<Size, string> = { display: "text-display", h1: "text-h1", h2: "text-h2", h3: "text-h3" };

type Props = ComponentPropsWithoutRef<"h2"> & { as?: ElementType; size?: Size };

export function Heading({ as: Tag = "h2", size = "h2", className, children, ...rest }: Props) {
  return (
    <Tag className={cn("font-display font-normal", sizes[size], className)} {...rest}>
      {children}
    </Tag>
  );
}
