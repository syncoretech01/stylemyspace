import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}, interior design in New York`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function tryReadHomeOg() {
  try {
    // Statically scoped path so Turbopack traces only this file (not the whole project).
    return await readFile(join(process.cwd(), "public", "site", "og-home.jpg"));
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [display, italic, sans, photo] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/CormorantGaramond-500.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/CormorantGaramond-500-Italic.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Jost-400.ttf")),
    tryReadHomeOg(),
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
          fontFamily: "Jost",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 56px 52px",
            width: photoSrc ? 620 : 1200,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontFamily: "Cormorant Garamond", fontSize: 30, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Style My Space
            </span>
            <span style={{ fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase", color: "#E7DCCA", marginLeft: 14 }}>
              Design
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Cormorant Garamond",
              fontSize: 76,
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
            }}
          >
            <span>Interiors that</span>
            <span>balance elegance</span>
            <span style={{ fontStyle: "italic" }}>with ease.</span>
          </div>
          <div style={{ fontSize: 20, color: "#E7DCCA", display: "flex", flexDirection: "column", gap: 4 }}>
            <span>{SITE.disciplines.join(", ")}</span>
            <span>{SITE.serviceAreas.join(", ")}</span>
          </div>
        </div>
        {photoSrc && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>, not next/image
          <img src={photoSrc} alt="" width={580} height={630} style={{ objectFit: "cover", objectPosition: "right", width: 580, height: 630 }} />
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant Garamond", data: display, style: "normal", weight: 500 },
        { name: "Cormorant Garamond", data: italic, style: "italic", weight: 500 },
        { name: "Jost", data: sans, style: "normal", weight: 400 },
      ],
    },
  );
}
