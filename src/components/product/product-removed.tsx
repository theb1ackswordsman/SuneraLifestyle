import Link from "next/link";
import { PackageX, ArrowLeft, ShoppingBag, Search } from "lucide-react";
import type { RemovedProductInfo } from "@/lib/shop/query-product";

export function ProductRemoved({ product }: { product: RemovedProductInfo }) {
  return (
    <div className="container-padded pt-32 pb-20">
      <div className="mx-auto max-w-lg text-center">

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50">
          <PackageX className="h-12 w-12 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Product image thumbnail if available */}
        {product.image && (
          <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-border bg-muted opacity-40 grayscale">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
        )}

        <h1 className="text-2xl font-black text-foreground mb-2">
          Product No Longer Available
        </h1>

        <p className="text-base font-semibold text-muted-foreground mb-1">
          &ldquo;{product.name}&rdquo;
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
          This product has been removed by our team and is no longer available for purchase.
          It may have been discontinued or replaced by a newer version.
        </p>

        {/* Info box */}
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left">
          <p className="text-sm font-semibold text-amber-800 mb-1">What you can do</p>
          <ul className="space-y-1 text-sm text-amber-700">
            <li>• Browse similar products in our shop</li>
            {product.categoryName && (
              <li>• Explore the <strong>{product.categoryName}</strong> category</li>
            )}
            <li>• Contact us if you need help finding an alternative</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a5c14] px-6 py-3 text-sm font-semibold text-white hover:bg-[#15490f] transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse the Shop
          </Link>

          {product.categoryName && product.categorySlug && (
            <Link
              href={`/shop?category=${product.categorySlug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
              View {product.categoryName}
            </Link>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Orders placed before removal are not affected.{" "}
          <Link href="/contact" className="underline hover:text-foreground transition-colors">
            Contact support
          </Link>{" "}
          if you need assistance.
        </p>
      </div>
    </div>
  );
}
