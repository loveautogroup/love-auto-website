/**
 * Spanish homepage — /es/
 *
 * Renders the SAME component the English homepage renders. The locale comes
 * from src/app/es/layout.tsx, which re-provides the language context pinned
 * to "es", so every <T> inside resolves Spanish without this page passing
 * anything down. One page component, two URLs, no duplicated markup to drift.
 *
 * The metadata below is NOT optional garnish — it is the entire reason this
 * route exists. The root layout sets `canonical` to the site root, and page
 * metadata is INHERITED, so without an explicit canonical here /es/ would
 * declare the English homepage as its canonical URL and Google would drop it
 * from the index as a duplicate. That would leave us with a Spanish page
 * nobody can find, which is exactly the situation we set out to fix.
 *
 * `alternates.languages` emits the hreflang pair. Both directions must agree
 * (the English homepage points back at /es/) or search engines ignore the
 * annotation entirely — hreflang is only honoured when it is reciprocal.
 */

import type { Metadata } from "next";
import HomePage from "../page";

export const metadata: Metadata = {
  title: "Love Auto Group | Autos Usados en Villa Park, IL",
  description:
    "Concesionario familiar de autos usados en Villa Park, IL, desde 2014. Autos japoneses inspeccionados, Carfax gratis y sin cargos de concesionario. Servimos todo el condado de DuPage.",
  alternates: {
    canonical: "https://www.loveautogroup.net/es/",
    languages: {
      "en-US": "https://www.loveautogroup.net/",
      "es-US": "https://www.loveautogroup.net/es/",
      "x-default": "https://www.loveautogroup.net/",
    },
  },
  openGraph: {
    title: "Love Auto Group | Autos Usados en Villa Park, IL",
    description:
      "Concesionario familiar de autos usados en Villa Park, IL. Carfax gratis y sin cargos de concesionario.",
    url: "https://www.loveautogroup.net/es/",
    type: "website",
    siteName: "Love Auto Group",
    locale: "es_US",
  },
};

export default HomePage;
