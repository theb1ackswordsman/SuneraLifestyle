"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  image: string;
  badge?: string;
  heading?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  textPosition?: "left" | "center";
}

const AUTOPLAY = 5500;

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? "-40%" : "40%", opacity: 0 }),
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(next, AUTOPLAY);
    return () => clearInterval(id);
  }, [next, paused, slides.length]);

  const slide = slides[current];
  const hasText = !!(slide.heading || slide.badge);

  return (
    <section
      className="relative overflow-hidden w-full min-h-[62vh] sm:min-h-[70vh] lg:min-h-[78vh] select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <Image
            src={slide.image}
            alt={slide.heading ?? `Slide ${current + 1}`}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="100vw"
          />

          {/* Shadow overlay — always present */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/50" />
            <div className="absolute inset-0 shadow-[inset_0_0_80px_20px_rgba(0,0,0,0.25)]" />
            {/* Extra left gradient when text is present */}
            {hasText && (
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />
            )}
          </div>

          {/* Text content (left side) */}
          {hasText && (
            <div className={cn(
              "absolute inset-0 flex items-end sm:items-center px-5 sm:px-10 md:px-14 lg:px-20 xl:px-28 pb-12 sm:pb-0",
              slide.textPosition === "center" && "justify-center px-5 sm:px-8 text-center"
            )}>
              <div className={cn(
                "max-w-lg pt-16 sm:pt-20",
                slide.textPosition === "center" && "text-center flex flex-col items-center"
              )}>
                {/* Badge */}
                {slide.badge && (
                  <motion.span
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    {slide.badge}
                  </motion.span>
                )}

                {/* Heading */}
                {slide.heading && (
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="mt-3 whitespace-pre-line text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
                  >
                    {slide.heading}
                  </motion.h1>
                )}

                {/* Description */}
                {slide.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="mt-3 text-xs leading-relaxed text-white/80 sm:text-sm sm:mt-4 max-w-xs sm:max-w-sm"
                  >
                    {slide.description}
                  </motion.p>
                )}

                {/* Buttons */}
                {(slide.primaryLabel || slide.secondaryLabel) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                    className="mt-5 sm:mt-7 flex flex-wrap items-center gap-2 sm:gap-3"
                  >
                    {slide.primaryLabel && slide.primaryHref && (
                      <Link href={slide.primaryHref}>
                        <button className="rounded-full bg-brand-emerald px-5 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-emerald-dark hover:shadow-xl active:scale-95">
                          {slide.primaryLabel}
                        </button>
                      </Link>
                    )}
                    {slide.secondaryLabel && slide.secondaryHref && (
                      <Link href={slide.secondaryHref}>
                        <button className="rounded-full border-2 border-white/70 px-5 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/15 active:scale-95">
                          {slide.secondaryLabel}
                        </button>
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Next */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            aria-label={`Slide ${i + 1}`}
            className={cn(
              "rounded-full shadow transition-all duration-300",
              i === current ? "h-2.5 w-7 bg-white" : "h-2.5 w-2.5 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <motion.div
          key={`p-${current}`}
          className="absolute bottom-0 left-0 z-20 h-0.5 bg-white/60"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: AUTOPLAY / 1000, ease: "linear" }}
        />
      )}
    </section>
  );
}
