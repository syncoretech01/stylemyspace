import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import { SITE } from "@/lib/site";
import { SkipLink } from "@/components/layout/SkipLink";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { JsonLd, localBusinessGraph } from "@/components/layout/JsonLd";
import { Preloader } from "@/components/preloader/Preloader";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
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
        <SiteHeader />
        <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
          {children}
        </main>
        <Footer />
        <JsonLd data={localBusinessGraph()} />
      </body>
    </html>
  );
}
