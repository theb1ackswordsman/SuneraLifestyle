import type { Metadata } from "next";
import Link from "next/link";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";
import { connectDB } from "@/lib/db/connection";
import { Blog } from "@/models/blog.model";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Blog — ${siteConfig.name}`,
  description: "Ayurvedic wellness tips, herbal guides and lifestyle articles from the SunEra team.",
};

async function getPublishedBlogs() {
  try {
    await connectDB();
    const blogs = await Blog.find({ status: "published", deletedAt: null })
      .sort({ publishedAt: -1 })
      .select("title slug excerpt coverImage categories readingTime publishedAt createdAt")
      .lean();
    return blogs.map((b) => ({
      _id:         String(b._id),
      title:       b.title,
      slug:        b.slug,
      excerpt:     b.excerpt,
      coverImage:  b.coverImage,
      categories:  (b.categories ?? []) as string[],
      readingTime: (b.readingTime as number) ?? 1,
      publishedAt: b.publishedAt ? String(b.publishedAt) : String(b.createdAt),
    }));
  } catch {
    return [];
  }
}

export default async function BlogsPage() {
  const blogs = await getPublishedBlogs();

  return (
    <ShopLayout>
      {/* Hero header */}
      <div className="bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] pb-14 pt-24 lg:pt-28">
        <div className="container-padded">
          <nav className="mb-4 flex items-center gap-2 text-xs text-white/50">
            <Link href="/" className="transition-colors hover:text-white/80">Home</Link>
            <span>/</span>
            <span className="text-white/80">Blog</span>
          </nav>
          <h1 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">The SunEra Journal</h1>
          <p className="mt-3 max-w-xl text-sm text-white/60">
            Ayurvedic wisdom, wellness guides and lifestyle articles from our team of experts.
          </p>
        </div>
      </div>

      <div className="container-padded py-14">
        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <BookOpen className="mb-4 h-14 w-14 text-gray-200" />
            <h2 className="text-xl font-bold text-gray-700">No articles yet</h2>
            <p className="mt-2 text-sm text-gray-400">Check back soon — new articles are on the way.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((post) => (
              <Link
                key={post._id}
                href={`/blogs/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Cover image */}
                <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "16/10" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {post.categories[0] && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-brand-emerald-dark backdrop-blur-sm">
                      {post.categories[0]}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min read
                    <span className="mx-1 text-gray-300">·</span>
                    {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                      day:   "numeric",
                      month: "short",
                      year:  "numeric",
                    })}
                  </div>

                  <h2 className="mt-2.5 text-base font-bold leading-snug tracking-tight transition-colors group-hover:text-brand-emerald">
                    {post.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald transition-all group-hover:gap-2">
                      Read Article <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
