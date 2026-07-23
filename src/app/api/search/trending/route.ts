import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { SearchKeyword } from "@/models/search-keyword.model";
import { Category } from "@/models/category.model";
import { ok, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    // Fetch explicitly trending keywords (ordered by trendingOrder)
    const trendingDocs = await SearchKeyword.find({ isTrending: true })
      .sort({ trendingOrder: 1 })
      .limit(8)
      .select("keyword")
      .lean();

    const trendingKeywords = trendingDocs.map((d) => d.keyword);

    // If fewer than 4 trending, supplement with highest search-count keywords
    let popularKeywords: string[] = [];
    if (trendingKeywords.length < 4) {
      const trendingSet = new Set(trendingKeywords);
      const popularDocs = await SearchKeyword.find({ isTrending: false })
        .sort({ searchCount: -1 })
        .limit(8)
        .select("keyword")
        .lean();
      popularKeywords = popularDocs
        .map((d) => d.keyword)
        .filter((k) => !trendingSet.has(k));
    }

    // Top-level active categories
    const categoryDocs = await Category.find({ isActive: true, parentId: null })
      .sort({ order: 1 })
      .limit(6)
      .select("name slug")
      .lean();

    const categories = categoryDocs.map((c) => ({
      name: c.name,
      slug: c.slug,
    }));

    return ok({
      trending: trendingKeywords,
      popular: popularKeywords,
      categories,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
