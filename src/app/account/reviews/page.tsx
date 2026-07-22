import Link from "next/link";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ArrowLeft, MessageSquare, Star, Package, PenLine } from "lucide-react";

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < value ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <ShopLayout>
      <div className="container-padded pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-black text-foreground">My Reviews</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-4">Reviews You&apos;ve Written</h2>
            <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 mb-5">
                <PenLine className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">No reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                You haven&apos;t written any reviews yet. Share your experience after receiving
                an order — your feedback helps others.
              </p>
              <div className="mt-5">
                <StarRating value={0} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-foreground mb-4">Pending Reviews</h2>
            <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-5">
                <Package className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Nothing to review yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
                Reviews from your delivered orders will appear here. Once an order is
                delivered, you can rate the product and share your experience with the
                SunEra community.
              </p>
              <div className="flex flex-col items-center gap-2">
                <StarRating value={5} />
                <p className="text-xs text-muted-foreground">Your rating matters to us</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">How reviews work</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Place an order", desc: "Shop our Ayurvedic and ethnic-wear collection." },
                { step: "2", title: "Receive your order", desc: "Enjoy your products once delivered." },
                { step: "3", title: "Write a review", desc: "Rate the product and help the community." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c14]/10 text-xs font-black text-[#1a5c14]">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Shop &amp; Review
            </Link>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
