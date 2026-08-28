import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — interior design, New York`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function tryRead(path: string) {
  try {
    return await readFile(join(process.cwd(), path));
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [display, sans, photo] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Fraunces-400.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/InterTight-400.ttf")),
    tryRead("public/site/og-home.jpg"),
  ]);
  const photoSrc = photo ? `data:image/jpeg;base64,${photo.toString("base64")}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#363B2B",
          color: "#F7F4ED",
          fontFamily: "Inter Tight",
        }}
      >
        {photoSrc && (
           
          <img src={photoSrc} alt="" width={600} height={630} style={{ objectFit: "cover", width: 600, height: 630 }} />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            width: photoSrc ? 600 : 1200,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Fraunces", fontSize: 28, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Style My Space
            </div>
            <div style={{ fontSize: 16, letterSpacing: "0.16em", textTransform: "uppercase", color: "#E7DCCA", marginTop: 8 }}>
              Design
            </div>
          </div>
          <div style={{ fontFamily: "Fraunces", fontSize: photoSrc ? 44 : 64, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Interiors that balance elegance with ease.
          </div>
          <div style={{ fontSize: 18, color: "#E7DCCA", display: "flex", flexDirection: "column", gap: 4 }}>
            <span>Residential · Hospitality · Wellness · Commercial</span>
            <span>{SITE.serviceAreas.join(" · ")}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: display, style: "normal", weight: 400 },
        { name: "Inter Tight", data: sans, style: "normal", weight: 400 },
      ],
    },
  );
}
