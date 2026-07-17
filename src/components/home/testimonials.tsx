"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/data/mock/homepage";

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  function next() {
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }
  function prev() {
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  const t = TESTIMONIALS[current];

  return (
    <section className="section-padding bg-muted/40">
      <div className="container-padded">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">
            Social Proof
          </p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            What Our Customers Say
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-semibold text-foreground">4.9</span>
            <span className="text-sm text-muted-foreground">· 2,400+ reviews</span>
          </div>
        </div>

        {/* Testimonial Card */}
        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="premium-card p-8 sm:p-10 text-center"
            >
              {/* Stars */}
              <div className="flex justify-center mb-6">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
                &ldquo;{t.content}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-8 flex items-center justify-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white bg-gradient-to-br",
                    t.avatarGradient
                  )}
                >
                  {t.avatar}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-foreground">{t.name}</p>
                    {t.verified && (
                      <CheckCircle2 className="h-4 w-4 text-brand-emerald" />
                    )}
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

        {/* All testimonials preview (desktop) */}
        <div className="mt-10 hidden lg:grid grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.button
              key={t.id}
              onClick={() => setCurrent(i)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:shadow-soft",
                i === current ? "border-brand-emerald bg-brand-emerald/5" : "border-border bg-background"
              )}
            >
              <div className="flex mb-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 text-left">{t.content}</p>
              <p className="mt-3 text-xs font-semibold text-foreground">{t.name}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
