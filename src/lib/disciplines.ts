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
  note?: string;
};

export const DISCIPLINES: Discipline[] = [
  {
    id: "residential",
    label: "Residential",
    blurb: "Personalized living spaces that blend elegance with comfort — from cozy retreats to luxurious sanctuaries.",
    source: "Live home page, Residential card",
    image: { slug: "oceanside", mediaId: "6af838_11540b40c17b4fd0a0222d068ac45c0a" },
  },
  {
    id: "hospitality",
    label: "Hospitality",
    blurb: "Guest-facing interiors, from short-stay properties to boutique settings, designed to offer a memorable experience.",
    source: "Las Olas project description; blog post on commercial wellness spaces",
    image: { slug: "las-olas", mediaId: "6af838_f8e79c545f2b47778b768e61159a2478" },
  },
  {
    id: "wellness",
    label: "Wellness",
    blurb: "Environments that support well-being through natural light, biophilic design and calming color palettes.",
    source: "Blog post: Residential Wellness Spaces",
    // The yoga room evidences the blurb (daylight, timber, calm palette); the cover lounge did not.
    image: { slug: "wellness-space-designs", mediaId: "6af838_2c26386f93924bfea1018d162a4036b5" },
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
