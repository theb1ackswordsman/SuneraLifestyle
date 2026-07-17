"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/data/mock/homepage";

export function CategoryGrid() {
  return (
    <section className="section-padding container-padded">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">
            Shop By Category
          </p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Find Your Focus
          </h2>
        </div>
        <Link
          href="/shop"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-emerald transition-colors group"
        >
          View All
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid: 2 large + 4 small */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className={cn(
              i < 2 ? "col-span-1 row-span-1 sm:col-span-1" : "col-span-1"
            )}
          >
            <Link
              href={cat.href}
              className={cn(
                "group relative flex overflow-hidden rounded-2xl",
                i < 2 ? "aspect-[4/5]" : "aspect-[4/3]",
                "bg-gradient-to-br",
                cat.gradient
              )}
            >
              {/* Grain */}
              <div className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

              {/* Content */}
              <div className="relative z-10 flex h-full w-full flex-col justify-end p-4 sm:p-5">
                <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {cat.count}+ products
                </span>
                <h3
                  className="font-black leading-tight text-white"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {i < 2 ? (
                    <span className="text-xl sm:text-2xl">{cat.label}</span>
                  ) : (
                    <span className="text-base sm:text-lg">{cat.label}</span>
                  )}
                </h3>
                <p className="mt-1 text-xs text-white/60 line-clamp-1">{cat.description}</p>

                {/* CTA arrow */}
                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-2">
                  Shop Now <ArrowRight className="h-3 w-3" />
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/15" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex sm:hidden justify-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-emerald hover:gap-3 transition-all"
        >
          View All Categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
