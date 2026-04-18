import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Car buying tips, vehicle guides, and financing advice from Love Auto Group in Villa Park, IL.",
};

function formatDate(dateString: string): string {
  return new Date(dateString + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  return (
    <>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Blog</h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Car buying tips, vehicle guides, and advice from our team
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-xl border border-brand-gray-200 p-6 md:p-8 hover:border-brand-red/30 transition-colors"
            >
              <div className="flex items-center gap-3 text-sm text-brand-gray-500 mb-3">
                <span className="bg-brand-red/10 text-brand-red px-3 py-0.5 rounded-full font-medium text-xs">
                  {post.category}
                </span>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-brand-gray-900">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-brand-red transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-brand-gray-600 leading-relaxed">
                {post.description}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-brand-red font-semibold text-sm hover:underline"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>

        {blogPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-brand-gray-500 text-lg">
              Blog posts coming soon. Check back later.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
