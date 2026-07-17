import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { BLOG_POSTS } from "@/data/mock/content";
import { siteConfig } from "@/config/site";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: `Article Not Found — ${siteConfig.name}` };
  return { title: `${post.title} — ${siteConfig.name}`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <ShopLayout>
      <article className="pt-20 lg:pt-24">
        <div className="container-padded max-w-3xl py-8">
          <Link href="/blogs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-emerald hover:gap-2.5 transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="mt-6 flex items-center gap-3 text-xs">
            <span className="rounded-full bg-brand-emerald/10 px-2.5 py-1 font-semibold text-brand-emerald-dark">{post.category}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {post.readTime}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{post.title}</h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
          </div>
        </div>

        <div className="container-padded max-w-4xl">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="container-padded max-w-3xl py-10">
          <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p className="text-lg font-medium text-foreground">{post.excerpt}</p>
            <p>
              When it comes to {post.category.toLowerCase()}, the internet is full of conflicting advice. In this
              guide we cut through the noise and focus on what actually works — grounded in current research and
              real-world experience from athletes we work with every day.
            </p>
            <h2 className="pt-2 text-xl font-bold text-foreground">The basics that matter</h2>
            <p>
              Consistency beats intensity over the long run. Nail the fundamentals — sleep, protein intake,
              progressive overload and recovery — before chasing marginal gains. These pillars compound, and
              they&apos;re what separate steady progress from spinning your wheels.
            </p>
            <p>
              The right supplement or piece of gear can absolutely accelerate results, but only once the
              foundation is in place. Think of it as a multiplier on good habits, not a replacement for them.
            </p>
            <h2 className="pt-2 text-xl font-bold text-foreground">Putting it into practice</h2>
            <p>
              Start small, measure, and adjust. Pick one change from this article, apply it for a few weeks, and
              pay attention to how your body responds. Training is personal — the best plan is the one you&apos;ll
              actually stick to.
            </p>
            <blockquote className="border-l-4 border-brand-emerald bg-muted/40 py-3 pl-5 text-foreground italic">
              &ldquo;The best results come from clean fundamentals, done consistently — everything else is a
              bonus.&rdquo;
            </blockquote>
            <p>
              Have questions or want product recommendations for your goals? Browse our range or reach out — our
              team is always happy to help you dial things in.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/shop">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-emerald px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-emerald-dark">
                Shop Our Products <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* Related */}
        <div className="border-t border-border bg-muted/20 py-12">
          <div className="container-padded">
            <h2 className="mb-6 text-2xl font-black tracking-tight">More from the Journal</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((p) => (
                <Link key={p.slug} href={`/blogs/${p.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-soft">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-emerald">{p.category}</p>
                    <h3 className="mt-1 text-sm font-bold leading-snug transition-colors group-hover:text-brand-emerald">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </ShopLayout>
  );
}
