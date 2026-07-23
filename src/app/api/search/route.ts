import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { searchProducts } from "@/lib/shop/search";
import { SearchKeyword } from "@/models/search-keyword.model";
import { ok, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Parse and validate query
    const rawQ = searchParams.get("q") ?? "";
    const q = rawQ.replace(/[\x00-\x1F\x7F]/g, "").trim();

    if (!q || q.length < 1) {
      return badRequest("Search query is required");
    }
    if (q.length > 100) {
      return badRequest("Search query must not exceed 100 characters");
    }

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const rawLimit = parseInt(searchParams.get("limit") ?? "12", 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 12 : rawLimit), 24);

    const sortRaw = searchParams.get("sort") ?? "relevance";
    const validSorts = ["relevance", "newest", "price-asc", "price-desc", "rating", "popular", "discount"] as const;
    type SortOption = typeof validSorts[number];
    const sort: SortOption = (validSorts as readonly string[]).includes(sortRaw)
      ? (sortRaw as SortOption)
      : "relevance";

    const minPriceRaw = parseFloat(searchParams.get("minPrice") ?? "");
    const maxPriceRaw = parseFloat(searchParams.get("maxPrice") ?? "");
    const minPrice = isNaN(minPriceRaw) ? undefined : Math.max(0, minPriceRaw);
    const maxPrice = isNaN(maxPriceRaw) ? undefined : Math.max(0, maxPriceRaw);

    const category = searchParams.get("category") ?? undefined;

    const inStockRaw = searchParams.get("inStock");
    const inStock = inStockRaw === "true" ? true : undefined;

    const ratingRaw = parseFloat(searchParams.get("rating") ?? "");
    const rating = isNaN(ratingRaw) ? undefined : Math.min(5, Math.max(0, ratingRaw));

    const result = await searchProducts({
      q,
      page,
      limit,
      sort,
      minPrice,
      maxPrice,
      category,
      inStock,
      rating,
    });

    // Non-blocking analytics tracking
    const keyword = q.toLowerCase().trim();
    const isNoResults = result.total === 0;
    SearchKeyword.findOneAndUpdate(
      { keyword },
      {
        $inc: {
          searchCount: 1,
          ...(isNoResults ? { noResultsCount: 1 } : {}),
        },
        $set: { lastSearchedAt: new Date() },
      },
      { upsert: true, new: true }
    ).catch(console.error);

    return ok({ ...result, query: q });
  } catch (err) {
    return handleApiError(err);
  }
}
