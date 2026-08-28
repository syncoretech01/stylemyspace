import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export function Eyebrow({ className, children, ...rest }: ComponentPropsWithoutRef<"span">) {
  return (
    <span className={cn("eyebrow block text-olive theme-dark:text-sand", className)} {...rest}>
      {children}
    </span>
  );
}
