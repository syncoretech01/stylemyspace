import type { ProjectImage, SiteImage } from "@/lib/content.schema";
import { cn } from "./cn";
import { SmartImage } from "./SmartImage";

/** Centre x, centre y (fractions of the image) and the side of the square, as a fraction of its short edge. */
export type Crop = readonly [x: number, y: number, size: number];

type Props = {
  image: ProjectImage | SiteImage | null;
  crop: Crop;
  /** Rendered frame width in vw per breakpoint, largest first: [minWidthPx, vw]. The last entry is the base. */
  frame: readonly (readonly [minWidth: number, vw: number])[];
  alt?: string;
  className?: string;
};

/**
 * A tight square detail cut out of a larger photograph, with no second file on disk. The image is laid
 * out at its natural ratio, scaled so the requested square fills the frame, then offset and clipped.
 * `sizes` states the layer's true rendered width, so the srcset stays sharp at the crop's zoom.
 */
export function CroppedImage({ image, crop, frame, alt, className }: Props) {
  const [cx, cy, size] = crop;
  const w = image?.width ?? 1;
  const h = image?.height ?? 1;
  const short = Math.min(w, h);
  // Layer size in frame widths.
  const layerW = w / short / size;
  const layerH = h / short / size;
  // Keep the frame inside the photograph.
  const left = Math.min(0, Math.max(1 - layerW, 0.5 - cx * layerW));
  const top = Math.min(0, Math.max(1 - layerH, 0.5 - cy * layerH));
  const pct = (n: number) => `${(n * 100).toFixed(3)}%`;
  const sizes = frame
    .map(([min, vw], i) => {
      const layerVw = `${Math.ceil(vw * layerW)}vw`;
      return i === frame.length - 1 ? layerVw : `(min-width: ${min}px) ${layerVw}`;
    })
    .join(", ");

  return (
    <div className={cn("relative aspect-square overflow-clip bg-taupe/40", className)}>
      <div className="absolute" style={{ width: pct(layerW), height: pct(layerH), left: pct(left), top: pct(top) }}>
        <SmartImage image={image} sizes={sizes} alt={alt} className="h-full w-full" />
      </div>
    </div>
  );
}
