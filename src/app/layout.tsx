import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import { SITE } from "@/lib/site";
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

// Static 400 instance (the family's default optical size) instead of the 68 KB variable file:
// the font is on the mobile LCP path (text pages' LCP is the webfont swap).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-fraunces",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  // Not preloaded: on throttled mobile the body font competed with the hero image for bandwidth
  // and pushed LCP past 2.5 s. It still self-hosts via @font-face and swaps in once loaded.
  preload: false,
  variable: "--font-inter-tight",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Interior Design, New York`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US" },
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
 * so CSS can gate reveals and the preloader without any JS timing gap.
 * Mirrors src/lib/motion/queries.ts — keep both in sync.
 */
const MOTION_SCRIPT = `(function(){try{var d=document.documentElement,m=window.matchMedia;var r=m('(prefers-reduced-motion: reduce)').matches;var c=m('(pointer: coarse)').matches;var f=m('(pointer: fine) and (hover: hover)').matches;d.dataset.motion=r?'reduced':(c||window.innerWidth<1024)?'mobile':'full';if(f)d.dataset.pointer='fine';if(!r){var p=null;try{p=sessionStorage.getItem('sms.preloaded')}catch(e){}if(!p){d.dataset.preloader='pending'}else{d.dataset.preloaderDone='true'}}else{d.dataset.preloaderDone='true'}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${interTight.variable}`} suppressHydrationWarning>
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
