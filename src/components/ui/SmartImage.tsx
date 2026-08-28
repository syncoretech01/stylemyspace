import Image from "next/image";
import type { CSSProperties } from "react";
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
  };
  if (fill) {
    return (
      <div className={cn("relative overflow-clip", className)}>
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
