"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HeadphonesIcon, ChevronDown, MessageCircle, Mail, Phone } from "lucide-react";

const FAQS = [
  { q: "How can I track my order?", a: "Once your order is shipped, you will receive an email with a tracking link. You can also find tracking details in your Orders section under My Account. Delivery typically takes 4–7 business days across India." },
  { q: "What is the return and refund policy?", a: "We accept returns within 7 days of delivery for unused, unopened items in their original packaging. Consumable Ayurvedic products (capsules, powders, oils) are non-returnable once opened. To initiate a return, contact us on WhatsApp or email with your order ID." },
  { q: "How long does shipping take?", a: "Orders are processed within 1–2 business days. Standard delivery takes 4–7 business days. For remote areas (North-East, J&K, Andaman), it may take up to 10 business days. We ship across India with tracking on every order." },
  { q: "Are the Ayurvedic products certified?", a: "Yes. All our Ayurvedic products are manufactured in GMP-certified facilities and comply with AYUSH Ministry guidelines. Each product batch is quality-tested for purity and potency before dispatch." },
  { q: "Can I change or cancel my order after placing it?", a: "Orders can be modified or cancelled within 2 hours of placement, before they enter processing. Please contact us immediately on WhatsApp at +91 91355 64607 with your order ID. Once dispatched, cancellation is not possible." },
  { q: "Do you offer Cash on Delivery (COD)?", a: "Yes, COD is available for most pin codes across India with an additional handling fee of ₹50. Prepaid orders (UPI, cards, net banking) are processed with priority and often dispatch faster." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start justify-between gap-4 py-5 text-left">
        <span className="text-sm font-semibold text-foreground leading-snug">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 mt-0.5 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-96 pb-5" : "max-h-0"}`}>
        <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function SupportContent() {
  return (
    <div className="container-padded pt-32 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
            <HeadphonesIcon className="h-5 w-5 text-teal-600" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Help &amp; Support</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <h2 className="text-base font-bold text-foreground mb-1">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground mb-6">Quick answers to the most common questions about orders, shipping, and products.</p>
          <div>{FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-bold text-foreground mb-2">Contact Us</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Couldn&apos;t find what you were looking for? Reach out — we&apos;re here to help, typically within a few hours on working days.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="https://wa.me/919135564607" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/20 p-6 text-center hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10 group-hover:bg-[#25D366]/20 transition-colors">
                <MessageCircle className="h-6 w-6 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground mt-0.5">+91 91355 64607</p>
                <p className="text-xs text-[#25D366] font-semibold mt-1.5">Chat Now →</p>
              </div>
            </a>

            <a href="mailto:suneralifestyle@gmail.com"
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/20 p-6 text-center hover:border-blue-400/40 hover:bg-blue-50/50 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Email Us</p>
                <p className="text-xs text-muted-foreground mt-0.5 break-all">suneralifestyle@gmail.com</p>
                <p className="text-xs text-blue-500 font-semibold mt-1.5">Send Email →</p>
              </div>
            </a>

            <a href="tel:+919135564607"
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/20 p-6 text-center hover:border-[#1a5c14]/40 hover:bg-green-50/50 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                <Phone className="h-6 w-6 text-[#1a5c14]" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Call Us</p>
                <p className="text-xs text-muted-foreground mt-0.5">+91 91355 64607</p>
                <p className="text-xs text-[#1a5c14] font-semibold mt-1.5">Call Now →</p>
              </div>
            </a>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/20 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Support hours:</span>{" "}
              Monday – Saturday, 10 AM – 6 PM IST
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
