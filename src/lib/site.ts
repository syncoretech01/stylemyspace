/**
 * Business facts — verbatim from the client brief (Section 2) and the live site footer.
 * Do not add facts here that are not in the brief or scraped content.
 */
export const SITE = {
  name: "Style My Space Design",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.stylemyspacedesign.com",
  positioning:
    "Woman-owned, New York–based interior design firm creating spaces that balance elegance with ease, sophistication with warmth.",
  description:
    "Style My Space Design is a woman-owned, New York–based interior design firm creating residential, hospitality, wellness and commercial interiors that balance elegance with ease, sophistication with warmth.",
  disciplines: ["Residential", "Hospitality", "Wellness", "Commercial"] as const,
  services: [
    "Interior design",
    "Interior architecture",
    "Space planning",
    "Office design",
    "Home staging",
  ] as const,
  approach:
    "Works across a range of budgets, styles, and timelines; guides clients through every phase of the design process.",
  serviceAreas: ["New York Tri-State Area", "New Jersey", "Miami", "Atlanta"] as const,
  phone: "516-500-5886",
  phoneHref: "tel:+15165005886",
  email: "info@stylemyspacedesign.com",
  address: {
    street: "1035 Park Boulevard, Unit 2C",
    locality: "Massapequa Park",
    region: "NY",
    postalCode: "11762",
    country: "US",
  },
  social: {
    instagram: { label: "Instagram", handle: "@stylemyspace_designs", href: "https://www.instagram.com/stylemyspace_designs" },
    facebook: { label: "Facebook", href: "https://www.facebook.com/profile.php?id=100071912508539" },
    linkedin: { label: "LinkedIn", href: "https://www.linkedin.com/in/eve-jean/" },
  },
  nav: [
    { label: "Portfolio", href: "/portfolio" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ] as const,
} as const;

export const absoluteUrl = (path: string) => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
