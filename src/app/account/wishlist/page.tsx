import Link from "next/link";
import { ShopLayout } from "@/components/layout/shop-layout";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";

export default function WishlistPage() {
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <Heart className="h-5 w-5 text-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Wishlist</h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-16 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
                <Heart className="h-10 w-10 text-rose-300" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-border shadow-soft">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
              Save items you love by tapping the heart icon on any product. They&apos;ll all
              appear here for easy access.
            </p>
            <Link
              href="/shop"
              className="rounded-xl bg-[#0f0f0f] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Browse Products
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Save for later", desc: "Heart any product to save it to your wishlist." },
              { title: "Easy checkout", desc: "Move wishlist items directly to your cart." },
              { title: "Price drops", desc: "Get notified when saved items go on sale." },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5 text-center">
                <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
