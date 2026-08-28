import { SITE, absoluteUrl } from "@/lib/site";
import type { Project } from "@/lib/content.schema";

const businessId = `${SITE.url}/#business`;

export function localBusinessGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": businessId,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        telephone: "+1-516-500-5886",
        email: SITE.email,
        image: absoluteUrl("/opengraph-image"),
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.locality,
          addressRegion: SITE.address.region,
          postalCode: SITE.address.postalCode,
          addressCountry: SITE.address.country,
        },
        areaServed: SITE.serviceAreas.map((name) => ({ "@type": "Place", name })),
        sameAs: [SITE.social.instagram.href, SITE.social.facebook.href, SITE.social.linkedin.href],
        knowsAbout: [...SITE.services],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": businessId },
      },
    ],
  };
}

export function projectGraph(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": absoluteUrl(`/portfolio/${project.slug}#work`),
    name: project.title,
    description: project.description,
    url: absoluteUrl(`/portfolio/${project.slug}`),
    creator: { "@id": businessId },
    genre: project.category ?? undefined,
    image: project.images.map((img) => ({
      "@type": "ImageObject",
      contentUrl: absoluteUrl(img.file),
      url: absoluteUrl(img.file),
      width: img.width,
      height: img.height,
      caption: img.caption ?? img.alt,
      creator: { "@id": businessId },
      copyrightHolder: { "@id": businessId },
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD is trusted, build-time data. Escape "<" so it can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
