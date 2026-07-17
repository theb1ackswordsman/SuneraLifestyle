"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <section className="container-padded section-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] px-8 py-14 sm:px-12 sm:py-20"
      >
        {/* Decorative blobs */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#2d8a22]/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-[#e8940a]/10 blur-3xl" />

        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.04] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22300%22 height=%22300%22 filter=%22url(%23n)%22 opacity=%221%22/%3E%3C/svg%3E')]" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full bg-[#e8940a]/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#f5a823]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8940a]" />
            Limited Time Offer
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-4xl font-black text-white sm:text-5xl lg:text-6xl leading-none tracking-tight"
          >
            Get 20% Off
            <br />
            <span className="text-[#f5a823]">Your First Order</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-white/70 leading-relaxed"
          >
            Use code{" "}
            <span className="font-bold text-white bg-white/10 rounded px-2 py-0.5 font-mono tracking-wider">
              SUNERA20
            </span>{" "}
            at checkout. Valid on your first purchase of ₹999 or more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.28 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link href="/shop">
              <Button
                size="lg"
                className="rounded-full bg-white text-[#103a0c] font-bold hover:bg-white/90 shadow-lg"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="glass"
                className="rounded-full border border-white/25 text-white font-bold hover:bg-white/10"
              >
                Learn More
              </Button>
            </Link>
          </motion.div>

          <p className="text-xs text-white/40 mt-2">
            *Terms apply. Cannot be combined with other offers.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
