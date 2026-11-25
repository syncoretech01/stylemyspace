import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { SITE } from "@/lib/site";
import { OG_DEFAULTS } from "@/lib/metadata";
import { SkipLink } from "@/components/layout/SkipLink";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { JsonLd, localBusinessGraph } from "@/components/layout/JsonLd";
import { Preloader } from "@/components/preloader/Preloader";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import "./globals.css";
// Section CSS modules are imported here too so Turbopack emits ONE stylesheet for every route:
// route-specific CSS chunks get <link rel=preload> injected by prefetch and Chrome warns
// "preloaded using link preload but not used" on routes that don't render the section.
import "@/components/sections/Disciplines/Disciplines.module.css";
import "@/components/sections/ServiceAreas/ServiceAreas.module.css";
import "@/components/sections/FeaturedWork/FeaturedWork.module.css";

// No `fallback` list on any of these, on purpose: with one, Next skips its metric-adjusted fallback face
// ("Cormorant Garamond Fallback": Times New Roman resized to Cormorant's widths), and the display
// headlines re-wrap when the webfont arrives. Generic families follow in globals.css `@theme inline`.

// Display. One static instance (23 KB, against 38 KB for the variable file): it is the only preloaded
// face, and it shares the mobile LCP path with the hero photograph.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "500",
  style: "normal",
  display: "swap",
  variable: "--font-cormorant",
});

// The true italic is an accent (one phrase per headline), so it is kept off the preload path. It
// registers under the same family name, so font-style: italic picks it up with no extra CSS.
const cormorantItalic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "500",
  style: "italic",
  display: "swap",
  preload: false,
  variable: "--font-cormorant-italic",
});

// Body and labels. Two calls, because a weight array is served as the 26 KB variable file and the two
// static instances are 9 KB each. Not preloaded: on throttled mobile the body font competed with the hero
// image for bandwidth and pushed LCP past 2.5 s. It still self-hosts and swaps in once loaded.
const jost = Jost({ subsets: ["latin"], weight: "400", display: "swap", preload: false, variable: "--font-jost" });
const jostMedium = Jost({ subsets: ["latin"], weight: "500", display: "swap", preload: false, variable: "--font-jost-medium" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Interior Design, New York`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: OG_DEFAULTS,
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F7F4ED",
  width: "device-width",
  initialScale: 1,
};

/**
 * Runs before first paint. Decides the motion tier and whether the preloader shows this session,
 * so CSS can gate reveals and the preloader without any JS timing gap. The preloader is the home
 * page's overture: someone arriving on /contact from a search result goes straight to the form.
 * Mirrors src/lib/motion/queries.ts; keep both in sync.
 */
const MOTION_SCRIPT = `(function(){try{var d=document.documentElement,m=window.matchMedia;var r=m('(prefers-reduced-motion: reduce)').matches;var c=m('(pointer: coarse)').matches;var f=m('(pointer: fine) and (hover: hover)').matches;d.dataset.motion=r?'reduced':(c||window.innerWidth<1024)?'mobile':'full';if(f)d.dataset.pointer='fine';var p='1';if(!r&&location.pathname==='/'){p=null;try{p=sessionStorage.getItem('sms.preloaded')}catch(e){}}if(!p){d.dataset.preloader='pending'}else{d.dataset.preloaderDone='true'}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${cormorantItalic.variable} ${jost.variable} ${jostMedium.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
      </head>
      <body className="min-h-svh">
        <SkipLink />
        <Preloader />
        <MotionRuntime />
        <TransitionProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
            {children}
          </main>
          <Footer />
        </TransitionProvider>
        <CustomCursor />
        <JsonLd data={localBusinessGraph()} />
      </body>
    </html>
  );
}
