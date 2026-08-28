import type { ReactNode } from "react";
import { cn } from "./cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-content px-3 md:px-6 lg:px-10", className)}>{children}</div>;
}
