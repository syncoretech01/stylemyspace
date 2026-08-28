"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import type { ProjectImage, SiteImage } from "@/lib/content.schema";
import { cn } from "./cn";
import { PlaceholderBlock } from "./PlaceholderBlock";

type Props = {
  image: ProjectImage | SiteImage | null | undefined;
  /** Required: the rendered width hint for the srcset chooser (never smaller than the real width). */
  sizes: string;
  /** fill (default) needs a sized wrapper; intrinsic renders width/height from the JSON. */
  fill?: boolean;
  /** Mark exactly one image per route as the LCP candidate. Adds preload + fetchpriority + data-lcp. */
  lcp?: boolean;
  /** Load immediately (above-the-fold images that are not the LCP). Default: load when near the viewport. */
  eager?: boolean;
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

/** Distance from the viewport at which deferred images start loading. */
const ROOT_MARGIN = "600px 0px";

/**
 * Project imagery through next/image with the stored dimensions, blur placeholder and alt text.
 * Non-LCP images are requested only when they come within 600px of the viewport (IntersectionObserver),
 * with a <noscript> fallback — browsers' native lazy-loading still fetches everything within a few
 * screens at parse time, which competes with the LCP image on slow connections.
 */
export function SmartImage({
  image,
  sizes,
  fill = true,
  lcp = false,
  eager = false,
  quality = 75,
  className,
  imgClassName,
  objectPosition,
  alt,
  placeholderTodo,
  style,
  imgProps,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const immediate = lcp || eager;
  const [near, setNear] = useState(immediate);

  useEffect(() => {
    if (immediate || near) return;
    const el = frameRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate, near]);

  if (!image) {
    return <PlaceholderBlock className={className} todo={placeholderTodo} />;
  }

  const resolvedAlt = alt ?? image.alt;
  const imgStyle = { ...(objectPosition ? { objectPosition } : {}), ...style };
  const common = {
    src: image.file,
    alt: resolvedAlt,
    sizes,
    quality,
    preload: lcp,
    // The LCP image must win the bandwidth race against fonts and scripts on slow connections.
    fetchPriority: lcp ? ("high" as const) : undefined,
    placeholder: "blur" as const,
    blurDataURL: image.blurDataURL,
    "data-lcp": lcp ? "" : undefined,
    style: imgStyle,
    ...imgProps,
  };

  // Blur placeholder shown until the real image is requested; keeps the box and its alt text.
  const placeholderStyle: CSSProperties = {
    backgroundImage: `url("${image.blurDataURL}")`,
    backgroundSize: "cover",
    backgroundPosition: objectPosition ?? "center",
  };

  if (fill) {
    return (
      <div
        ref={frameRef}
        className={cn(
          "overflow-clip",
          !/(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className ?? "") && "relative",
          className,
        )}
      >
        {near ? (
          <Image {...common} alt={resolvedAlt} fill loading={immediate ? undefined : "eager"} className={cn("object-cover", imgClassName)} />
        ) : (
          <>
            <div role="img" aria-label={resolvedAlt || undefined} aria-hidden={resolvedAlt ? undefined : true} className="absolute inset-0" style={placeholderStyle} />
            <noscript>
              <Image {...common} alt={resolvedAlt} fill className={cn("object-cover", imgClassName)} />
            </noscript>
          </>
        )}
      </div>
    );
  }

  const ratio = `${image.width} / ${image.height}`;
  return (
    <div ref={frameRef} className={cn("relative w-full", className)} style={{ aspectRatio: ratio }}>
      {near ? (
        <Image
          {...common}
          alt={resolvedAlt}
          width={image.width}
          height={image.height}
          loading={immediate ? undefined : "eager"}
          className={cn("h-auto w-full", imgClassName)}
        />
      ) : (
        <>
          <div role="img" aria-label={resolvedAlt || undefined} aria-hidden={resolvedAlt ? undefined : true} className="absolute inset-0" style={placeholderStyle} />
          <noscript>
            <Image {...common} alt={resolvedAlt} width={image.width} height={image.height} className={cn("h-auto w-full", imgClassName)} />
          </noscript>
        </>
      )}
    </div>
  );
}
