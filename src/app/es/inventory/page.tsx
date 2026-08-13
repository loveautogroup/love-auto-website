/**
 * Spanish inventory page — /es/inventory/
 *
 * Renders the SAME component the English inventory page renders. The locale
 * comes from src/app/es/layout.tsx, which re-provides the language context
 * pinned to "es", so every string inside resolves Spanish without this page
 * passing anything down. One page component, two URLs, nothing to drift.
 *
 * As with /es/, the metadata is the reason the route exists rather than
 * decoration: page metadata is INHERITED, so without an explicit canonical
 * this would declare the English inventory page as its canonical URL and
 * Google would drop it as a duplicate.
 *
 * The hreflang pair must be reciprocal — the English page at
 * src/app/inventory/page.tsx points back here. Search engines ignore a
 * one-sided annotation entirely.
 *
 * The vehicle data is locale-independent (year, make, model, price, mileage),
 * so nothing about the listings themselves needs translating; the chrome
 * around them — hero, trust strip, filters, sort labels, the reduced-price
 * rail, card labels — all resolve through the language context.
 */

import type { Metadata } from "next";
import InventoryPage from "../../inventory/page";

export const metadata: Metadata = {
  title: "Inventario de Autos Usados | Love Auto Group",
  description:
    "Explora nuestro inventario de autos usados en Villa Park, IL, desde $4,500 hasta $18,000. Lexus, Subaru, Acura, Mazda. Totalmente reacondicionados y listos para manejar. Carfax gratis y sin cargos de concesionario.",
  alternates: {
    canonical: "https://www.loveautogroup.net/es/inventory/",
    languages: {
      "en-US": "https://www.loveautogroup.net/inventory/",
      "es-US": "https://www.loveautogroup.net/es/inventory/",
      "x-default": "https://www.loveautogroup.net/inventory/",
    },
  },
  openGraph: {
    title: "Inventario de Autos Usados | Love Auto Group",
    description:
      "Autos usados inspeccionados en Villa Park, IL. Carfax gratis y sin cargos de concesionario.",
    url: "https://www.loveautogroup.net/es/inventory/",
    type: "website",
    siteName: "Love Auto Group",
    locale: "es_US",
  },
};

export default InventoryPage;
