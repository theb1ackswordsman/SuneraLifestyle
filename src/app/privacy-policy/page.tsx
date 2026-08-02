import type { Metadata } from "next";
import { ShieldCheck, Lock, Cookie, UserCheck } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";
import { WA_LINK } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: `Privacy Policy — ${siteConfig.name}`,
  description: `Learn how ${siteConfig.name} collects, uses, and protects your personal information when you shop with us.`,
};

export default function PrivacyPolicyPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">Your Privacy</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Last updated: August 2026
            </p>
          </div>
        </div>

        <div className="container-padded py-14">
          {/* Highlights */}
          <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { icon: Lock, title: "Data Encrypted", sub: "Secured in transit & at rest", color: "text-brand-emerald", bg: "bg-brand-emerald/10" },
              { icon: ShieldCheck, title: "Never Sold", sub: "We don't sell your data", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: UserCheck, title: "You're in Control", sub: "Access or delete anytime", color: "text-brand-orange", bg: "bg-brand-orange/10" },
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
              <p>
                At <strong className="text-foreground">{siteConfig.name}</strong>, we respect your privacy and are
                committed to protecting the personal information you share with us. This policy explains what we
                collect, why we collect it, and the choices you have.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">1. Information We Collect</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong className="text-foreground">Account details</strong> — your name, email address, and mobile number when you create an account.</li>
                <li><strong className="text-foreground">Order &amp; shipping information</strong> — delivery address, billing details, and order history.</li>
                <li><strong className="text-foreground">Payment information</strong> — processed securely by our payment partner (Razorpay). We never store your full card details.</li>
                <li><strong className="text-foreground">Usage data</strong> — pages visited, products viewed, and device/browser information to improve your experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">2. How We Use Your Information</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li>To process and deliver your orders and send order updates.</li>
                <li>To verify your account (including one-time verification codes sent to your email).</li>
                <li>To provide customer support and respond to your queries.</li>
                <li>To personalise your shopping experience and recommend relevant products.</li>
                <li>To send promotional offers — only if you have opted in. You can unsubscribe at any time.</li>
                <li>To detect, prevent, and address fraud or security issues.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">3. Sharing Your Information</h2>
              <p>
                We do <strong className="text-foreground">not sell or rent</strong> your personal data. We only share
                it with trusted partners who help us operate our business, such as:
              </p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>Payment gateways to process transactions (Razorpay).</li>
                <li>Logistics and courier partners to deliver your orders.</li>
                <li>Email service providers to send transactional and verification emails.</li>
                <li>Government or law-enforcement authorities where required by law.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-base font-bold text-foreground">4. Cookies</h2>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Cookie className="h-3.5 w-3.5 text-brand-orange" /> How we use cookies
                </p>
                <p className="text-xs">
                  We use cookies to keep you signed in, remember your cart, and understand how our site is used. You
                  can disable cookies in your browser settings, but some features (like your cart and login) may not
                  work correctly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">5. Data Security</h2>
              <p>
                We use industry-standard security measures — including encrypted connections (HTTPS), hashed passwords,
                and secure verification codes — to protect your information. However, no method of transmission over the
                internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>Access and review the personal data we hold about you.</li>
                <li>Update or correct your account information at any time from your profile.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of marketing communications.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">7. Children&apos;s Privacy</h2>
              <p>
                Our services are not directed at children under 13. We do not knowingly collect personal information
                from children. If you believe a child has provided us with their data, please contact us and we will
                delete it.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an
                updated &quot;Last updated&quot; date. We encourage you to review it periodically.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-bold text-foreground">9. Contact Us</h2>
              <p>
                For any privacy-related questions or requests, WhatsApp us at{" "}
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#25D366] hover:underline">
                  {siteConfig.contact.phone}
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
