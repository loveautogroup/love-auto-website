import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost, getAllBlogSlugs } from "@/data/blog";
import { SITE_CONFIG } from "@/lib/constants";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Article structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };

  // Find related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center text-brand-gray-300 hover:text-white text-sm mb-6 transition-colors"
          >
            ← Back to Blog
          </Link>
          <div className="flex items-center gap-3 text-sm text-brand-gray-300 mb-4">
            <span className="bg-white/10 px-3 py-0.5 rounded-full font-medium text-xs">
              {post.category}
            </span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {post.title}
          </h1>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <div
          className="prose prose-lg max-w-none
            prose-headings:text-brand-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
            prose-p:text-brand-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-brand-red prose-a:font-medium prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 bg-brand-red rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Ready to Find Your Next Vehicle?
          </h2>
          <p className="text-red-100 mb-6 max-w-lg mx-auto">
            Browse our current inventory or get in touch. We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/inventory"
              className="inline-flex items-center justify-center bg-white text-brand-red px-8 py-3 rounded-xl font-bold hover:bg-brand-gray-100 transition-colors"
            >
              Browse Inventory
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="inline-flex items-center justify-center border-2 border-white/30 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </a>
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-brand-gray-900 mb-6">
              More from the Blog
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="bg-white rounded-xl border border-brand-gray-200 p-5 hover:border-brand-red/30 transition-colors group"
                >
                  <span className="text-xs text-brand-gray-500">
                    {related.category}
                  </span>
                  <h3 className="mt-1 font-bold text-brand-gray-900 group-hover:text-brand-red transition-colors">
                    {related.title}
                  </h3>
                  <p className="mt-2 text-sm text-brand-gray-500 line-clamp-2">
                    {related.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
