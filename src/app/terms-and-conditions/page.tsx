import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${siteConfig.name}`,
  description: "Read the terms and conditions for using SunEra Lifestyle's website and services.",
};

export default function TermsPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">Legal</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Terms &amp; Conditions</h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Last updated: July 2026
            </p>
          </div>
        </div>

        <div className="container-padded py-14">
          <div className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the {siteConfig.name} website (&quot;Site&quot;) or placing an order, you agree to be
                bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree, please do not use
                our Site or services.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">2. Use of the Site</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li>You must be at least 18 years old to create an account and place orders.</li>
                <li>You agree to provide accurate, current, and complete information during registration and checkout.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You may not use the Site for any unlawful purpose or in a way that violates these Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">3. Products &amp; Pricing</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</li>
                <li>We reserve the right to change product prices at any time without prior notice.</li>
                <li>Product images are for illustration purposes and actual products may vary slightly.</li>
                <li>We do not guarantee that all products displayed are available at all times.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">4. Orders &amp; Payment</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li>An order confirmation email constitutes our acceptance of your order.</li>
                <li>We reserve the right to cancel any order at our discretion, including due to pricing errors or stock unavailability.</li>
                <li>Payment must be completed at the time of order. For COD, payment is due at delivery.</li>
                <li>We use secure third-party payment gateways and do not store card information.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">5. Shipping &amp; Delivery</h2>
              <p>
                Delivery timelines are estimates and not guarantees. {siteConfig.name} is not liable for delays
                caused by courier partners, natural events, or other circumstances beyond our control. Please refer
                to our{" "}
                <a href="/shipping-policy" className="font-semibold text-brand-emerald hover:underline">
                  Shipping Policy
                </a>{" "}
                for full details.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">6. Returns &amp; Refunds</h2>
              <p>
                Our return and refund terms are governed by our{" "}
                <a href="/refund-policy" className="font-semibold text-brand-emerald hover:underline">
                  Refund &amp; Return Policy
                </a>
                , which is incorporated by reference into these Terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">7. Intellectual Property</h2>
              <p>
                All content on this Site — including logos, product images, text, designs, and code — is the
                intellectual property of {siteConfig.name} and may not be copied, reproduced, distributed or used
                without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">8. Disclaimer of Warranties</h2>
              <p>
                Our Ayurvedic products are dietary and wellness supplements and are not intended to diagnose, treat,
                cure or prevent any disease. Results may vary. Always consult a qualified healthcare professional before
                using any supplement, especially if you are pregnant, nursing, or taking medication.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, {siteConfig.name} shall not be liable for any indirect,
                incidental, special, or consequential damages arising from your use of the Site or our products.
                Our total liability in any matter arising from these Terms shall not exceed the amount you paid for
                the relevant order.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">10. Governing Law</h2>
              <p>
                These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
                jurisdiction of the courts in Surat, Gujarat, India.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">11. Changes to These Terms</h2>
              <p>
                We may update these Terms from time to time. The &quot;Last updated&quot; date at the top of this page
                will reflect any changes. Continued use of the Site after changes constitutes acceptance of the
                revised Terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">12. Contact Us</h2>
              <p>
                For any legal queries or concerns about these Terms, contact us at{" "}
                <a href={`mailto:${siteConfig.contact.email}`} className="font-semibold text-brand-emerald hover:underline">
                  {siteConfig.contact.email}
                </a>{" "}
                or write to us at {siteConfig.contact.address}.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
