import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";
import { connectDB } from "@/lib/db/connection";
import { Blog } from "@/models/blog.model";

export const dynamic = "force-dynamic";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlog(slug: string) {
  try {
    await connectDB();
    const blog = await Blog.findOne({ slug, status: "published", deletedAt: null }).lean();
    if (!blog) return null;
    return {
      _id:         String(blog._id),
      title:       blog.title,
      slug:        blog.slug,
      excerpt:     blog.excerpt,
      content:     blog.content,
      coverImage:  blog.coverImage,
      categories:  (blog.categories ?? []) as string[],
      tags:        (blog.tags ?? []) as string[],
      readingTime: (blog.readingTime as number) ?? 1,
      publishedAt: blog.publishedAt ? String(blog.publishedAt) : String(blog.createdAt),
    };
  } catch {
    return null;
  }
}

async function getRelatedBlogs(currentSlug: string, categories: string[]) {
  try {
    await connectDB();
    const related = await Blog.find({
      slug:      { $ne: currentSlug },
      status:    "published",
      deletedAt: null,
      ...(categories.length ? { categories: { $in: categories } } : {}),
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select("title slug coverImage categories")
      .lean();

    if (related.length < 3) {
      const more = await Blog.find({
        slug:      { $ne: currentSlug },
        status:    "published",
        deletedAt: null,
        _id:       { $nin: related.map((r) => r._id) },
      })
        .sort({ publishedAt: -1 })
        .limit(3 - related.length)
        .select("title slug coverImage categories")
        .lean();
      related.push(...more);
    }

    return related.map((b) => ({
      _id:        String(b._id),
      title:      b.title,
      slug:       b.slug,
      coverImage: b.coverImage,
      categories: (b.categories ?? []) as string[],
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlog(slug);
  if (!post) return { title: `Article Not Found — ${siteConfig.name}` };
  return {
    title:       `${post.title} — ${siteConfig.name}`,
    description: post.excerpt,
    openGraph: {
      title:  post.title,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getBlog(slug);
  if (!post) notFound();

  const related = await getRelatedBlogs(slug, post.categories);

  return (
    <ShopLayout>
      <article className="pt-20 lg:pt-24">
        <div className="container-padded max-w-3xl py-8">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-emerald hover:gap-2.5 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            {post.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-brand-emerald/10 px-2.5 py-1 font-semibold text-brand-emerald-dark"
              >
                {cat}
              </span>
            ))}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {post.readingTime} min read
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{post.title}</h1>

          <div className="mt-4 text-sm text-muted-foreground">
            {new Date(post.publishedAt).toLocaleDateString("en-IN", {
              day:   "numeric",
              month: "long",
              year:  "numeric",
            })}
          </div>
        </div>

        <div className="container-padded max-w-4xl">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="container-padded max-w-3xl py-10">
          <div className="prose prose-sm sm:prose max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-bold prose-a:text-brand-emerald prose-strong:text-foreground">
            <p className="not-prose mb-6 text-lg font-medium text-foreground">{post.excerpt}</p>
            {post.content.includes("<") ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              post.content.split("\n\n").map((para, i) => <p key={i}>{para}</p>)
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <Link href="/shop">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-emerald px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-emerald-dark">
                Shop Our Products <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>

        {related.length > 0 && (
          <div className="border-t border-border bg-muted/20 py-12">
            <div className="container-padded">
              <h2 className="mb-6 text-2xl font-black tracking-tight">More from the Journal</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p._id}
                    href={`/blogs/${p.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-soft"
                  >
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      {p.categories[0] && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-emerald">
                          {p.categories[0]}
                        </p>
                      )}
                      <h3 className="mt-1 text-sm font-bold leading-snug transition-colors group-hover:text-brand-emerald">
                        {p.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </ShopLayout>
  );
}
