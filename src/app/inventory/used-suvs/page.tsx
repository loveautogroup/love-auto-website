import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MAKE_LANDINGS } from "@/data/makeLandings";
import MakeLandingPage, { makeLandingMetadata } from "@/components/MakeLandingPage";

const SLUG = "suvs";
const content = MAKE_LANDINGS.find((m) => m.slug === SLUG);

export const metadata: Metadata = content ? makeLandingMetadata(content) : {};

export default function Page() {
  if (!content) notFound();
  return <MakeLandingPage content={content} />;
}
