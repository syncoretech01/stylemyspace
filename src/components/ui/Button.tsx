import Link from "next/link";
import type { Route } from "next";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "outline" | "ghost";

const base =
  "inline-flex min-h-6 items-center justify-center gap-1 rounded-xs eyebrow whitespace-nowrap transition-[background-color,color,border-color,scale] duration-(--dur-micro) ease-(--ease-out-expo)";

// Filled and outlined buttons answer a press; the ghost variant is a text link and does not.
const press = "active:scale-[0.98] active:duration-100";

const variants: Record<Variant, string> = {
  primary: cn(
    press,
    "px-3.5 bg-olive text-bone hover:bg-olive-deep theme-dark:bg-bone theme-dark:text-olive-deep theme-dark:hover:bg-sand",
  ),
  outline: cn(
    press,
    "px-3.5 border border-olive text-olive hover:bg-olive hover:text-bone theme-dark:border-bone/60 theme-dark:text-bone theme-dark:hover:border-bone theme-dark:hover:bg-bone theme-dark:hover:text-olive-deep",
  ),
  ghost: "px-0 text-olive theme-dark:text-bone",
};

type LinkProps = { href: Route; variant?: Variant; className?: string; children: ReactNode } & Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "className" | "children"
>;
type ButtonProps = { href?: undefined; variant?: Variant; className?: string; children: ReactNode } & Omit<
  ComponentPropsWithoutRef<"button">,
  "className" | "children"
>;

const OWN_KEYS = new Set(["href", "variant", "className", "children"]);
const omitOwn = <T extends object>(props: T) =>
  Object.fromEntries(Object.entries(props).filter(([k]) => !OWN_KEYS.has(k))) as Record<string, unknown>;

export function Button(props: LinkProps | ButtonProps) {
  const { variant = "primary", className, children } = props;
  const classes = cn(base, variants[variant], variant === "ghost" && "group", className);
  const label = variant === "ghost" ? <span className="link-rule">{children}</span> : children;
  if (props.href !== undefined) {
    const rest = omitOwn(props) as Omit<LinkProps, "href" | "variant" | "className" | "children">;
    return (
      <Link href={props.href} className={classes} {...rest}>
        {label}
      </Link>
    );
  }
  const { type = "button", ...other } = omitOwn(props) as Omit<ButtonProps, "href" | "variant" | "className" | "children">;
  return (
    <button type={type} className={classes} {...other}>
      {label}
    </button>
  );
}
