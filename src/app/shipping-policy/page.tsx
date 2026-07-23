import type { Metadata } from "next";
import { Truck, Clock, MapPin } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Shipping Policy — ${siteConfig.name}`,
  description: "Learn about SunEra Lifestyle's shipping rates, delivery times, and order tracking.",
};

export default function ShippingPolicyPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">Delivery Info</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Shipping Policy</h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Last updated: July 2026
            </p>
          </div>
        </div>

        <div className="container-padded py-14">
          {/* Highlights */}
          <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Truck, title: "Free Shipping", sub: `On orders above ₹${siteConfig.shipping.freeAbove}`, color: "text-brand-emerald", bg: "bg-brand-emerald/10" },
              { icon: Clock, title: "Standard Delivery", sub: `${siteConfig.shipping.estimatedDays.standard} business days`, color: "text-blue-600", bg: "bg-blue-50" },
              { icon: Clock, title: "Express Delivery", sub: `${siteConfig.shipping.estimatedDays.express} business days`, color: "text-brand-orange", bg: "bg-brand-orange/10" },
              { icon: MapPin, title: "Pan-India", sub: "All major pin codes", color: "text-purple-600", bg: "bg-purple-50" },
            ].map(({ icon: Icon, title, sub, color, bg }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-5 text-center">
                <div className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="font-bold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">1. Shipping Rates</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong className="text-foreground">Free standard shipping</strong> on all orders above ₹{siteConfig.shipping.freeAbove}.</li>
                <li>Orders below ₹{siteConfig.shipping.freeAbove}: flat ₹{siteConfig.shipping.standardFee} shipping fee.</li>
                <li>Express delivery: ₹{siteConfig.shipping.expressFee} flat (available on select pin codes).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">2. Delivery Timeframes</h2>
              <p className="mb-2">Delivery times are estimated from the date of dispatch, not order placement.</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-foreground">
                    <tr>
                      <th className="px-4 py-3">Delivery Type</th>
                      <th className="px-4 py-3">Estimated Time</th>
                      <th className="px-4 py-3">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3">Standard</td>
                      <td className="px-4 py-3">{siteConfig.shipping.estimatedDays.standard} business days</td>
                      <td className="px-4 py-3">Free over ₹{siteConfig.shipping.freeAbove} / ₹{siteConfig.shipping.standardFee}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Express</td>
                      <td className="px-4 py-3">{siteConfig.shipping.estimatedDays.express} business days</td>
                      <td className="px-4 py-3">₹{siteConfig.shipping.expressFee}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">3. Order Processing</h2>
              <p>Orders placed before 2:00 PM IST on business days (Monday–Saturday) are typically dispatched the same day. Orders placed after 2:00 PM or on Sundays and public holidays are dispatched the next business day.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">4. Tracking Your Order</h2>
              <p>Once dispatched, you will receive a tracking number via email and SMS. You can also track your order under <strong className="text-foreground">My Account → Orders</strong>. It may take up to 24 hours for tracking information to appear.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">5. Delivery Areas</h2>
              <p>We currently ship to most pin codes across India. If delivery is not available at your pin code at checkout, please contact us and we will try to find an alternative.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">6. Damaged or Lost Shipments</h2>
              <p>If your package arrives damaged or is declared lost by the courier, contact us within 48 hours of the expected delivery date. We will arrange a replacement or full refund at no extra cost.</p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">7. Contact</h2>
              <p>
                For any shipping queries, WhatsApp us at{" "}
                <a href="https://wa.me/919135564607" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
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
