import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { SearchKeyword } from "@/models/search-keyword.model";
import { ok, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("x-user-role") === "admin" &&
    req.headers.get("x-admin-verified") === "1"
  );
}

// ---------------------------------------------------------------------------
// GET /api/admin/search/analytics
// Returns aggregated search analytics for the admin dashboard.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    await connectDB();

    const [
      topKeywords,
      noResultKeywords,
      trendingKeywords,
      aggregateTotals,
    ] = await Promise.all([
      // Top 20 by search count
      SearchKeyword.find()
        .sort({ searchCount: -1 })
        .limit(20)
        .select("keyword searchCount clickCount noResultsCount isTrending")
        .lean(),

      // Keywords that returned no results
      SearchKeyword.find({ noResultsCount: { $gt: 0 } })
        .sort({ noResultsCount: -1 })
        .limit(10)
        .select("keyword searchCount noResultsCount")
        .lean(),

      // Currently trending (by trendingOrder)
      SearchKeyword.find({ isTrending: true })
        .sort({ trendingOrder: 1 })
        .select("keyword searchCount clickCount trendingOrder")
        .lean(),

      // Aggregate totals for CTR calculation
      SearchKeyword.aggregate([
        {
          $group: {
            _id: null,
            totalSearches: { $sum: "$searchCount" },
            totalClicks: { $sum: "$clickCount" },
          },
        },
      ]),
    ]);

    const totalSearches: number = aggregateTotals[0]?.totalSearches ?? 0;
    const totalClicks: number = aggregateTotals[0]?.totalClicks ?? 0;
    const clickThroughRate =
      totalSearches > 0
        ? parseFloat(((totalClicks / totalSearches) * 100).toFixed(1))
        : 0;

    return ok({
      topKeywords,
      noResultKeywords,
      trendingKeywords,
      totalSearches,
      totalClicks,
      clickThroughRate,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
