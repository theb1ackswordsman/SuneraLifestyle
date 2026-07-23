import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/layout/shop-layout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Track Your Order — ${siteConfig.name}`,
  description: "Track the status of your SunEra Lifestyle order in real time.",
};

export default function TrackOrderPage() {
  return (
    <ShopLayout>
      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <div className="border-b border-border bg-muted/30 py-14">
          <div className="container-padded text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-emerald">
              Order Status
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Track Your Order</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Already placed an order? Sign in to your account to see live tracking and delivery updates.
            </p>
          </div>
        </div>

        <div className="container-padded py-14">
          <div className="mx-auto max-w-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-emerald/10">
                <PackageSearch className="h-10 w-10 text-brand-emerald" />
              </div>
            </div>
            <h2 className="text-2xl font-black">Check your order status</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sign in to your account to view all your orders, track shipments, and manage returns in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-emerald px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Sign In to Track <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                View My Orders
              </Link>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 text-left">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Need help?</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If you placed a guest order or have trouble finding your order, reach out to us on{" "}
                <a
                  href="https://wa.me/919135564607"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#25D366] hover:underline"
                >
                  WhatsApp
                </a>{" "}
                or email{" "}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-semibold text-brand-emerald hover:underline"
                >
                  {siteConfig.contact.email}
                </a>{" "}
                with your order number and we&apos;ll help you right away.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
