"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  _id?: string;
  id?: number;
  eyebrow: string;
  headline: string;
  discount?: string;
  sub?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image?: string;
  bg?: string;
  accentColor?: string;
  // legacy fallback fields
  imageEmoji?: string;
  imageLabel?: string;
  imageBg?: string;
}

const AUTOPLAY = 5500;

const variants = {
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
  const hasImage = !!slide.image;
  const accent = slide.accentColor ?? "#1a5c14";
  const slideKey = slide._id ?? String(slide.id ?? current);

  return (
    <section
      className="relative overflow-hidden min-h-[540px] lg:min-h-[620px] select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={slideKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex"
          style={hasImage ? undefined : { backgroundColor: slide.bg ?? "#f7f3ee" }}
        >
          {/* Full-bleed background image */}
          {hasImage && (
            <>
              <Image
                src={slide.image!}
                alt={slide.headline}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/10" />
            </>
          )}

          {/* Left — text content */}
          <div
            className={cn(
              "relative z-10 flex flex-1 flex-col justify-center px-8 pb-16 pt-[104px] md:px-12 lg:px-16 xl:px-24 lg:pt-[112px] lg:pb-24",
              hasImage ? "lg:max-w-[58%]" : ""
            )}
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-3 text-sm font-medium italic"
              style={{
                color: hasImage ? "#f5a823" : accent,
                fontFamily: "Georgia, serif",
              }}
            >
              {slide.eyebrow}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "whitespace-pre-line text-5xl font-black leading-none tracking-tighter sm:text-6xl lg:text-7xl xl:text-[80px]",
                hasImage ? "text-white" : "text-gray-900"
              )}
            >
              {slide.headline}
            </motion.h1>

            {slide.discount && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className={cn(
                  "mt-3 text-lg font-semibold",
                  hasImage ? "text-white/90" : "text-gray-500"
                )}
              >
                {slide.discount}
              </motion.p>
            )}

            {slide.sub && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className={cn(
                  "mt-2 max-w-sm text-sm leading-relaxed",
                  hasImage ? "text-white/70" : "text-gray-400"
                )}
              >
                {slide.sub}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link href={slide.ctaHref}>
                <button
                  className={cn(
                    "px-8 py-3 text-sm font-bold uppercase tracking-widest transition-colors",
                    hasImage
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-[#0a0a0a] text-white hover:bg-[#2d2d2d]"
                  )}
                >
                  {slide.ctaLabel}
                </button>
              </Link>
              {slide.secondaryLabel && (
                <Link href={slide.secondaryHref ?? "/about"}>
                  <button
                    className={cn(
                      "px-8 py-3 text-sm font-bold uppercase tracking-widest transition-colors",
                      hasImage
                        ? "border border-white/60 text-white hover:border-white hover:bg-white/10"
                        : "border border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800"
                    )}
                  >
                    {slide.secondaryLabel}
                  </button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* Right — emoji panel (legacy fallback only) */}
          {!hasImage && slide.imageEmoji && (
            <div className="relative hidden flex-1 overflow-hidden lg:flex">
              <div className={cn("absolute inset-0 bg-linear-to-br opacity-20", slide.imageBg)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="relative z-10 flex h-full flex-col items-center justify-center gap-4"
              >
                <div className="text-[160px] leading-none">{slide.imageEmoji}</div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  {slide.imageLabel}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Prev */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30 sm:left-5"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Next */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30 sm:right-5"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s._id ?? s.id ?? i}
            onClick={() => {
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
            }}
            aria-label={`Slide ${i + 1}`}
            className={cn(
              "rounded-full shadow transition-all duration-300",
              i === current
                ? "h-2.5 w-7 bg-white"
                : "h-2.5 w-2.5 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <motion.div
          key={`progress-${slideKey}`}
          className="absolute bottom-0 left-0 z-20 h-0.5 bg-white/60"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: AUTOPLAY / 1000, ease: "linear" }}
        />
      )}
    </section>
  );
}
