import type { Metadata } from "next";
import { RefreshCw, ShieldCheck, AlertCircle, CheckCircle } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";
import { WA_LINK } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: `Refund & Return Policy — ${siteConfig.name}`,
  description: `SunEra Lifestyle offers a ${siteConfig.policies.returnDays}-day hassle-free return policy. Learn what's eligible and how to initiate a return.`,
};

export default function RefundPolicyPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">Returns</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Refund & Return Policy</h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Last updated: July 2026
            </p>
          </div>
        </div>

        <div className="container-padded py-14">
          {/* Highlights */}
          <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { icon: RefreshCw, title: `${siteConfig.policies.returnDays}-Day Returns`, sub: "From date of delivery", color: "text-brand-emerald", bg: "bg-brand-emerald/10" },
              { icon: ShieldCheck, title: "Hassle-Free Process", sub: "Initiate from your account", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: CheckCircle, title: "Full Refund", sub: "Back to original payment method", color: "text-brand-orange", bg: "bg-brand-orange/10" },
            ].map(({ icon: Icon, title, sub, color, bg }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-6 text-center">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <p className="font-bold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">1. Return Window</h2>
              <p>You may return eligible items within <strong className="text-foreground">{siteConfig.policies.returnDays} days</strong> of the delivery date. Exchange requests must be raised within <strong className="text-foreground">{siteConfig.policies.exchangeDays} days</strong>.</p>
            </section>

            <section>
              <h2 className="mb-4 text-base font-bold text-foreground">2. Eligible Items</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Eligible for Return
                  </p>
                  <ul className="space-y-1.5 text-xs text-green-800">
                    <li>• Unopened, sealed products in original packaging</li>
                    <li>• Items received damaged or defective</li>
                    <li>• Wrong item delivered</li>
                    <li>• Products with manufacturing defects</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" /> Not Eligible
                  </p>
                  <ul className="space-y-1.5 text-xs text-red-800">
                    <li>• Opened or partially used products</li>
                    <li>• Items without original packaging</li>
                    <li>• Products returned after 7 days</li>
                    <li>• Items marked as non-returnable at purchase</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">3. How to Initiate a Return</h2>
              <ol className="space-y-3 list-decimal pl-5">
                <li>Log in to your account and go to <strong className="text-foreground">My Orders</strong>.</li>
                <li>Select the order and item you wish to return.</li>
                <li>Click <strong className="text-foreground">&quot;Request Return&quot;</strong> and select a reason.</li>
                <li>Our team will review your request within 24–48 hours and confirm pick-up details.</li>
                <li>Pack the item securely in its original packaging.</li>
                <li>Hand the package to the courier at the scheduled pick-up time.</li>
              </ol>
              <p className="mt-4">Alternatively, contact us on{" "}
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
                  WhatsApp
                </a>{" "}
                with your order number and reason for return.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">4. Refund Timeline</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li>Once the returned item is received and inspected, we process the refund within <strong className="text-foreground">5–7 business days</strong>.</li>
                <li>Online payments (UPI, cards, net banking) are refunded to the original payment source.</li>
                <li>COD orders are refunded via bank transfer — please provide your account details when raising the request.</li>
                <li>You will receive an email/SMS confirmation when the refund is processed.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">5. Damaged or Wrong Item</h2>
              <p>If you received a damaged, defective or incorrect item, please contact us within <strong className="text-foreground">48 hours</strong> of delivery with photos and your order number. We will arrange a free replacement or full refund — no return pick-up needed for damaged items.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">6. Contact</h2>
              <p>
                For return and refund queries, WhatsApp us at{" "}
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
                  +91 91355 64607
                </a>{" "}
                or email{" "}
                <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-brand-emerald hover:underline">
                  {siteConfig.contact.email}
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
