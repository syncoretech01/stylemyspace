import Image from "next/image";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { ProjectImage, SiteImage } from "@/lib/content.schema";
import { cn } from "./cn";
import { PlaceholderBlock } from "./PlaceholderBlock";

type Props = {
  image: ProjectImage | SiteImage | null | undefined;
  /** Required: the rendered width hint for the srcset chooser (never smaller than the real width). */
  sizes: string;
  /** fill (default) needs a sized wrapper; intrinsic renders width/height from the JSON. */
  fill?: boolean;
  /** Mark exactly one image per route as the LCP candidate. Adds preload + data-lcp. */
  lcp?: boolean;
  quality?: 75 | 85;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  /** Override the stored alt (e.g. decorative duplicates use ""). */
  alt?: string;
  placeholderTodo?: string;
  style?: CSSProperties;
  /** Extra attributes for the <img> (e.g. data-flip-id / data-flip-target for the Flip transition). */
  imgProps?: Omit<ComponentPropsWithoutRef<"img">, "src" | "alt" | "width" | "height" | "sizes" | "style" | "className"> &
    Record<`data-${string}`, string | undefined>;
};

export function SmartImage({
  image,
  sizes,
  fill = true,
  lcp = false,
  quality = 75,
  className,
  imgClassName,
  objectPosition,
  alt,
  placeholderTodo,
  style,
  imgProps,
}: Props) {
  if (!image) {
    return <PlaceholderBlock className={className} todo={placeholderTodo} />;
  }
  const common = {
    src: image.file,
    alt: alt ?? image.alt,
    sizes,
    quality,
    preload: lcp,
    placeholder: "blur" as const,
    blurDataURL: image.blurDataURL,
    "data-lcp": lcp ? "" : undefined,
    style: { ...(objectPosition ? { objectPosition } : {}), ...style },
    ...imgProps,
  };
  if (fill) {
    return (
      <div
        className={cn(
          "overflow-clip",
          !/(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className ?? "") && "relative",
          className,
        )}
      >
        <Image {...common} alt={common.alt} fill className={cn("object-cover", imgClassName)} />
      </div>
    );
  }
  return (
    <Image
      {...common}
      alt={common.alt}
      width={image.width}
      height={image.height}
      className={cn("h-auto w-full", className, imgClassName)}
    />
  );
}
