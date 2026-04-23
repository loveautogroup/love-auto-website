import type { Metadata } from "next";
import SignFlow from "./SignFlow";

// Static export: we pre-render a single shell page per known param. The
// SignFlow client component reads window.location.pathname at runtime and
// fetches the real session. Unknown IDs resolve to the "placeholder" shell,
// which then fetches /api/sign/:id based on the actual URL path.
//
// Cloudflare Pages serves the shell for any /sign/* path via _redirects-
// style rewrites, so this works for any session ID the dealer generates.
export async function generateStaticParams() {
  return [{ id: "shell" }];
}

export const metadata: Metadata = {
  title: "E-Sign Documents | Love Auto Group",
  description: "Sign your Love Auto Group paperwork electronically.",
  robots: { index: false, follow: false },
};

export default function SignPage() {
  return (
    <main className="min-h-screen bg-brand-gray-50 py-6 md:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <SignFlow />
      </div>
    </main>
  );
}
