import Link from "next/link";
import type { Route } from "next";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex min-h-6 items-center justify-center gap-1 rounded-xs eyebrow transition-[background-color,color,border-color] duration-(--dur-micro) ease-(--ease-out-expo)";

const variants: Record<Variant, string> = {
  primary:
    "px-3 bg-olive text-bone hover:bg-olive-deep theme-dark:bg-bone theme-dark:text-olive-deep theme-dark:hover:bg-sand",
  outline:
    "px-3 border border-olive text-olive hover:bg-olive hover:text-bone theme-dark:border-bone theme-dark:text-bone theme-dark:hover:bg-bone theme-dark:hover:text-olive-deep",
  ghost: "px-0 text-olive underline-offset-6 hover:underline theme-dark:text-bone",
};

type LinkProps = { href: Route; variant?: Variant; className?: string; children: ReactNode; cursor?: string } & Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "className" | "children"
>;
type ButtonProps = { href?: undefined; variant?: Variant; className?: string; children: ReactNode; cursor?: string } & Omit<
  ComponentPropsWithoutRef<"button">,
  "className" | "children"
>;

const OWN_KEYS = new Set(["href", "variant", "className", "children", "cursor"]);
const omitOwn = <T extends object>(props: T) =>
  Object.fromEntries(Object.entries(props).filter(([k]) => !OWN_KEYS.has(k))) as Record<string, unknown>;

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", className, children, cursor } = props;
  const classes = cn(base, variants[variant], className);
  if (props.href !== undefined) {
    const rest = omitOwn(props) as Omit<LinkProps, "href" | "variant" | "className" | "children" | "cursor">;
    return (
      <Link href={props.href} className={classes} data-cursor={cursor} {...rest}>
        {children}
      </Link>
    );
  }
  const { type = "button", ...other } = omitOwn(props) as Omit<ButtonProps, "href" | "variant" | "className" | "children" | "cursor">;
  return (
    <button type={type} className={classes} data-cursor={cursor} {...other}>
      {children}
    </button>
  );
}
