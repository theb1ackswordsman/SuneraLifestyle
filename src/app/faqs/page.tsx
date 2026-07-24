import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";
import { WA_LINK } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: `FAQs — ${siteConfig.name}`,
  description: "Frequently asked questions about SunEra Lifestyle products, shipping, returns and more.",
};

const FAQS = [
  {
    section: "Products",
    items: [
      {
        q: "Are your products 100% natural?",
        a: "Yes. Every SunEra product is made from pure Ayurvedic herbs with no artificial colors, chemicals, or fillers. We believe in what nature offers.",
      },
      {
        q: "Are your products safe for daily use?",
        a: "Our products are formulated using classical Ayurvedic recipes and manufactured in a hygienic facility with strict quality checks. They are safe for daily use by adults. Always read the label. Consult a physician if you are pregnant, nursing, or on medication.",
      },
      {
        q: "Where are your products made?",
        a: "All products are made in Surat, Gujarat, India with carefully sourced ingredients.",
      },
    ],
  },
  {
    section: "Orders & Payments",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept UPI, debit/credit cards, net banking, and cash on delivery (COD) on eligible orders.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "Orders can be cancelled within 1 hour of placement. After that, the order will already be processed for dispatch. Contact us on WhatsApp immediately if you need to change anything.",
      },
      {
        q: "How do I know my order was placed successfully?",
        a: "You will receive an email and SMS confirmation with your order number right after checkout. You can also view it under My Account → Orders.",
      },
    ],
  },
  {
    section: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: `Standard delivery takes ${siteConfig.shipping.estimatedDays.standard} business days. Express delivery takes ${siteConfig.shipping.estimatedDays.express} business days.`,
      },
      {
        q: "Is there free shipping?",
        a: `Yes! Orders above ₹${siteConfig.shipping.freeAbove} qualify for free standard shipping. A flat fee of ₹${siteConfig.shipping.standardFee} applies to smaller orders.`,
      },
      {
        q: "Do you ship across India?",
        a: "Yes, we deliver to all major cities and most pin codes across India.",
      },
    ],
  },
  {
    section: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: `We offer a ${siteConfig.policies.returnDays}-day return window from the date of delivery. Products must be unused, in original packaging and sealed condition.`,
      },
      {
        q: "How do I initiate a return?",
        a: "Log in to your account, go to My Orders, select the item you want to return, and click 'Request Return'. You can also WhatsApp us with your order number.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. Online payments are refunded to your original payment method.",
      },
    ],
  },
  {
    section: "Account",
    items: [
      {
        q: "Do I need an account to order?",
        a: "Yes, a free account is required to place orders, track deliveries and manage returns. Creating one takes under a minute.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "Click 'Forgot password?' on the login page. Enter your email and we'll send a reset link within a few minutes.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">Help Center</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Frequently Asked Questions</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Everything you need to know about SunEra Lifestyle products, orders, and policies.
            </p>
          </div>
        </div>

        <div className="container-padded py-14">
          <div className="mx-auto max-w-3xl space-y-12">
            {FAQS.map(({ section, items }) => (
              <div key={section}>
                <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-brand-emerald">{section}</h2>
                <div className="space-y-4">
                  {items.map(({ q, a }) => (
                    <div key={q} className="rounded-2xl border border-border bg-background p-6">
                      <p className="font-bold text-foreground">{q}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Still have questions */}
            <div className="rounded-3xl bg-muted/50 border border-border px-8 py-10 text-center">
              <h3 className="text-xl font-black">Still have a question?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Our team typically responds within a few hours.</p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
