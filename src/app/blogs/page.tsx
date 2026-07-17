import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { BLOG_POSTS } from "@/data/mock/content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Blog — ${siteConfig.name}`,
  description: "Training tips, nutrition science and gear guides from the SunEra team.",
};

export default function BlogsPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <ShopLayout>
      {/* Header */}
      <div className="bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] pb-12 pt-24 lg:pt-28">
        <div className="container-padded">
          <nav className="mb-4 flex items-center gap-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Blog</span>
          </nav>
          <h1 className="text-3xl font-black text-white sm:text-4xl">The SunEra Journal</h1>
          <p className="mt-2 max-w-lg text-sm text-white/60">
            Science-backed training, nutrition and recovery advice to help you get the most from every session.
          </p>
        </div>
      </div>

      <div className="container-padded py-12">
        {/* Featured */}
        <Link
          href={`/blogs/${featured.slug}`}
          className="group grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-border lg:grid-cols-2"
        >
          <div className="relative aspect-video overflow-hidden bg-muted lg:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featured.image} alt={featured.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-brand-emerald/10 px-2.5 py-1 font-semibold text-brand-emerald-dark">{featured.category}</span>
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {featured.readTime}</span>
            </div>
            <h2 className="mt-4 text-2xl font-black leading-tight transition-colors group-hover:text-brand-emerald sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featured.excerpt}</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{featured.author}</span>
              <span>·</span>
              <span>{featured.date}</span>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-emerald transition-all group-hover:gap-3">
              Read Article <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-soft"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
                  {post.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {post.readTime}
                </div>
                <h3 className="mt-2 text-base font-bold leading-snug transition-colors group-hover:text-brand-emerald">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{post.author}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}
