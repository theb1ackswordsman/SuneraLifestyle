"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, CheckCircle2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/data/mock/homepage";

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(cls, i < rating ? "fill-amber-400 text-amber-400" : "fill-muted-foreground/25 text-muted-foreground/25")}
        />
      ))}
    </div>
  );
}

function MarqueeCard({ t }: { t: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="w-72 shrink-0 rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3">
        <StarRow rating={t.rating} size="sm" />
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{t.content}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white bg-linear-to-br",
            t.avatarGradient
          )}
        >
          {t.avatar}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-foreground">{t.name}</p>
            {t.verified && <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald" />}
          </div>
          <p className="text-xs text-muted-foreground">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  function next() { setCurrent((c) => (c + 1) % TESTIMONIALS.length); }
  function prev() { setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length); }

  const t = TESTIMONIALS[current];

  return (
    <section className="section-padding bg-muted/40">
      <div className="container-padded">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">
            Customer Love
          </p>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
            What Our Customers Say
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">4.8</span>
            <span className="text-sm text-muted-foreground">· 2,400+ reviews</span>
          </div>
        </div>

        {/* Featured review card */}
        <div className="relative mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="premium-card p-5 sm:p-8 lg:p-10 text-center"
            >
              <Quote className="mx-auto mb-4 h-8 w-8 text-brand-emerald/30" />

              <div className="flex justify-center mb-5">
                <StarRow rating={t.rating} size="md" />
              </div>

              <blockquote className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
                &ldquo;{t.content}&rdquo;
              </blockquote>

              <div className="mt-8 flex items-center justify-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white bg-linear-to-br",
                    t.avatarGradient
                  )}
                >
                  {t.avatar}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground">{t.name}</p>
                    {t.verified && <CheckCircle2 className="h-4 w-4 text-brand-emerald" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              aria-label="Previous review"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:border-brand-emerald hover:text-brand-emerald transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === current ? "w-6 bg-brand-emerald" : "w-1.5 bg-border"
                  )}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Next review"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:border-brand-emerald hover:text-brand-emerald transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Infinite scrolling marquee — all reviews */}
      <div className="relative mt-12 overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-muted/40 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-muted/40 to-transparent" />

        <div
          className="animate-marquee flex gap-4 py-3"
          style={{ width: "max-content" }}
        >
          {/* Duplicated for seamless loop */}
          {[...TESTIMONIALS, ...TESTIMONIALS].map((item, i) => (
            <MarqueeCard key={i} t={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
