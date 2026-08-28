/** Route list for QA and Lighthouse. Extras that are not in the sitemap go here. */
import { getRoutes } from "../src/lib/content";

export const STATIC_EXTRAS = ["/this-page-does-not-exist"];
export const getQaRoutes = () => [...getRoutes(), ...STATIC_EXTRAS];
