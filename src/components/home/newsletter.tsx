"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <section className="section-padding container-padded">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-background px-8 py-14 sm:px-12"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-emerald/5 via-transparent to-brand-orange/5" />

        <div className="relative z-10 mx-auto max-w-xl text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald"
          >
            Stay in the loop
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-black tracking-tight sm:text-4xl"
          >
            Get Exclusive Offers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-sm text-muted-foreground leading-relaxed"
          >
            Subscribe for early access to new products, exclusive deals, and Ayurvedic wellness tips from our experts.
          </motion.p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <CheckCircle2 className="h-12 w-12 text-brand-emerald" />
              <p className="font-bold text-foreground">You&apos;re subscribed! 🎉</p>
              <p className="text-sm text-muted-foreground">
                Check your inbox for a welcome gift — use code{" "}
                <span className="font-bold font-mono text-brand-emerald">WELCOME15</span> for 15% off.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-12 flex-1 rounded-full border border-border bg-background px-5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 transition-all"
              />
              <Button
                type="submit"
                size="lg"
                variant="primary"
                loading={loading}
                className="rounded-full flex-shrink-0"
              >
                Subscribe <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>

          {/* Perks */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {["Early product access", "Exclusive member deals", "Ayurvedic wellness tips"].map((perk) => (
              <div key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald flex-shrink-0" />
                {perk}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
