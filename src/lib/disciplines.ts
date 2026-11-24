import type { ImageRef } from "@/lib/content.schema";

/**
 * The four disciplines from the brief. Blurbs are assembled only from Section 2 facts and
 * scraped live-site copy (fragments quoted in `source`). Images are chosen from the real projects.
 */
export type Discipline = {
  id: "residential" | "hospitality" | "wellness" | "commercial";
  label: "Residential" | "Hospitality" | "Wellness" | "Commercial";
  blurb: string;
  source: string;
  image: ImageRef | null;
  /** Where a narrow column should hold the photograph (object-position). */
  focus?: string;
  note?: string;
};

export const DISCIPLINES: Discipline[] = [
  {
    id: "residential",
    label: "Residential",
    blurb: "Personalized living spaces that blend elegance with comfort, from cozy retreats to luxurious sanctuaries.",
    source: "Live home page, Residential card",
    image: { slug: "oceanside", mediaId: "6af838_ac92150204054e37bb93bb791be18a57" },
    focus: "24% 50%",
  },
  {
    id: "hospitality",
    label: "Hospitality",
    blurb: "Guest-facing interiors, from short-stay properties to boutique settings, designed to offer a memorable experience.",
    source: "Las Olas project description; blog post on commercial wellness spaces",
    // The guest bedroom: the short-stay property the blurb describes.
    image: { slug: "las-olas", mediaId: "6af838_d23334c06dcf4d8ca2d9095d6874c5cc" },
    focus: "66% 50%",
  },
  {
    id: "wellness",
    label: "Wellness",
    blurb: "Environments that support well-being through natural light, biophilic design and calming color palettes.",
    source: "Blog post: Residential Wellness Spaces",
    // The treatment room evidences the blurb (daylight, natural fibre, calm palette); the cover lounge did not.
    image: { slug: "wellness-space-designs", mediaId: "6af838_df3afeaaae2a48eb8a933dde39fcbb35" },
    focus: "56% 50%",
  },
  {
    id: "commercial",
    label: "Commercial",
    blurb: "Learning environments and workplaces that prioritize productivity and aesthetics.",
    source: "Live home page, Commercial and Education cards",
    image: { slug: "classroom-designs", mediaId: "6af838_cb0e4a1301dc4aa99a95409ebf0b5703" },
    note: "Including education centers: engaging and stimulating environments tailored to all learners.",
  },
];
