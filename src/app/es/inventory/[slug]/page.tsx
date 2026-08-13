/**
 * Spanish vehicle detail page — /es/inventory/<slug>/
 *
 * Renders the SAME component the English VDP renders. The locale comes from
 * src/app/es/layout.tsx, which pins the language context to "es", so the whole
 * page resolves Spanish without this route passing anything down.
 *
 * generateStaticParams and the slug resolver are imported from
 * src/lib/vdpRoute.ts rather than re-implemented, so this route publishes
 * exactly the vehicle set the English route publishes. A Spanish VDP for a car
 * the English side has already dropped would be a live page for a sold vehicle.
 *
 * ⚠ What is NOT Spanish on this page: the per-vehicle Public Description and
 * the feature list. Both are authored in the DMS in English and arrive as
 * data — the dictionary cannot reach them. Everything the site itself writes
 * (specs chrome, payment estimator, recon checklist, FAQ, trust strip,
 * similar vehicles) is translated. Closing that last gap needs a Spanish
 * description field in the DMS, which is a backend change, not a copy change.
 */

import type { Metadata } from "next";
import { resolveVehicle, vehicleStaticParams } from "@/lib/vdpRoute";
import { applyPhotoOrder } from "@/data/photoOrder";
import VehicleDetailPage from "../../../inventory/[slug]/page";

export async function generateStaticParams() {
  return vehicleStaticParams("generateStaticParams:es");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await resolveVehicle(slug);
  if (!vehicle) return {};

  const base = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  // Same 60-char guard as the English title: drop the trim rather than let
  // Google truncate mid-word in the SERP.
  const withTrim = `${[base, vehicle.trim].filter(Boolean).join(" ")} en Venta | Love Auto Group`;
  const withoutTrim = `${base} en Venta | Love Auto Group`;
  const title = withTrim.length <= 60 ? withTrim : withoutTrim;

  const formattedMileage = new Intl.NumberFormat("es-US").format(vehicle.mileage);
  const description = `${[base, vehicle.trim].filter(Boolean).join(" ")} en venta en Villa Park, IL. ${formattedMileage} millas, ${vehicle.drivetrain}. Seleccionado con cuidado y completamente reacondicionado en Love Auto Group.`;

  const url = `https://www.loveautogroup.net/es/inventory/${slug}/`;
  const englishUrl = `https://www.loveautogroup.net/inventory/${slug}/`;

  const orderedImages = applyPhotoOrder(vehicle.slug, vehicle.images ?? []);
  const ogImageUrl =
    vehicle.bakedHeroUrl ??
    orderedImages[0] ??
    "https://www.loveautogroup.net/og-image.png";
  const ogImageAlt = `${base} ${vehicle.trim} — Love Auto Group`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-US": englishUrl,
        "es-US": url,
        "x-default": englishUrl,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Love Auto Group",
      locale: "es_US",
      images: [{ url: ogImageUrl, width: 1200, height: 900, alt: ogImageAlt }],
    },
  };
}

export default VehicleDetailPage;
