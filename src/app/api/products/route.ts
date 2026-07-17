import { type NextRequest } from "next/server";
import { ok, badRequest, handleApiError } from "@/lib/api/response";
import { queryProducts, type SortOption, type BadgeFilter } from "@/lib/shop/query-products";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const category  = searchParams.get("category") ?? undefined;
    const search    = searchParams.get("q") ?? undefined;
    const sortRaw   = searchParams.get("sort") ?? undefined;
    const badgeRaw  = searchParams.get("badge") ?? undefined;
    const pageRaw   = searchParams.get("page");
    const limitRaw  = searchParams.get("limit");
    const minRaw    = searchParams.get("minPrice");
    const maxRaw    = searchParams.get("maxPrice");

    const page      = pageRaw  ? parseInt(pageRaw,  10) : 1;
    const limit     = limitRaw ? parseInt(limitRaw, 10) : 12;
    const minPrice  = minRaw   ? parseInt(minRaw,   10) : undefined;
    const maxPrice  = maxRaw   ? parseInt(maxRaw,   10) : undefined;

    if (isNaN(page) || page < 1)   return badRequest("Invalid page");
    if (isNaN(limit) || limit < 1) return badRequest("Invalid limit");

    const VALID_BADGES = new Set(["new", "bestseller", "sale"]);
    const badge = badgeRaw && VALID_BADGES.has(badgeRaw) ? (badgeRaw as BadgeFilter) : undefined;

    const result = await queryProducts({
      category,
      search,
      sort: sortRaw as SortOption | undefined,
      badge,
      page,
      limit,
      minPrice: minPrice && !isNaN(minPrice) ? minPrice : undefined,
      maxPrice: maxPrice && !isNaN(maxPrice) ? maxPrice : undefined,
    });

    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
