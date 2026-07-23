import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { SearchKeyword } from "@/models/search-keyword.model";
import { ok, badRequest, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest): boolean {
  return (
    req.headers.get("x-user-role") === "admin" &&
    req.headers.get("x-admin-verified") === "1"
  );
}

// ---------------------------------------------------------------------------
// GET /api/admin/search/trending
// Lists all trending keywords ordered by trendingOrder.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    await connectDB();

    const keywords = await SearchKeyword.find({ isTrending: true })
      .sort({ trendingOrder: 1 })
      .lean();

    return ok({ keywords });
  } catch (err) {
    return handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/search/trending
// Adds a keyword to the trending list. Upserts the SearchKeyword doc,
// sets isTrending: true, and assigns trendingOrder = current max + 1.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).keyword !== "string"
    ) {
      return badRequest("Body must contain a string field keyword");
    }

    const keyword = ((body as Record<string, unknown>).keyword as string)
      .toLowerCase()
      .trim();

    if (!keyword) {
      return badRequest("keyword must not be empty");
    }
    if (keyword.length > 100) {
      return badRequest("keyword must not exceed 100 characters");
    }

    await connectDB();

    // Determine the next trendingOrder value
    const maxDoc = await SearchKeyword.findOne({ isTrending: true })
      .sort({ trendingOrder: -1 })
      .select("trendingOrder")
      .lean();

    const nextOrder =
      maxDoc && typeof maxDoc.trendingOrder === "number" && maxDoc.trendingOrder < 999
        ? maxDoc.trendingOrder + 1
        : 1;

    const updated = await SearchKeyword.findOneAndUpdate(
      { keyword },
      {
        $set: { isTrending: true, trendingOrder: nextOrder, lastSearchedAt: new Date() },
        $setOnInsert: { searchCount: 1, clickCount: 0, noResultsCount: 0 },
      },
      { upsert: true, new: true }
    ).lean();

    return ok({ keyword: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/search/trending
// Updates isTrending or trendingOrder on an existing keyword.
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).keyword !== "string"
    ) {
      return badRequest("Body must contain a string field keyword");
    }

    const payload = body as Record<string, unknown>;
    const keyword = (payload.keyword as string).toLowerCase().trim();

    if (!keyword) {
      return badRequest("keyword must not be empty");
    }

    const updates: Record<string, unknown> = {};

    if (typeof payload.isTrending === "boolean") {
      updates.isTrending = payload.isTrending;
      // If demoting, reset trendingOrder to default
      if (!payload.isTrending) {
        updates.trendingOrder = 999;
      }
    }

    if (typeof payload.trendingOrder === "number" && Number.isFinite(payload.trendingOrder)) {
      updates.trendingOrder = Math.max(0, payload.trendingOrder);
    }

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields provided to update (isTrending, trendingOrder)");
    }

    await connectDB();

    const updated = await SearchKeyword.findOneAndUpdate(
      { keyword },
      { $set: updates },
      { new: true }
    ).lean();

    if (!updated) {
      return badRequest(`Keyword "${keyword}" not found`);
    }

    return ok({ keyword: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/search/trending
// Removes a keyword from the trending list (sets isTrending: false).
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).keyword !== "string"
    ) {
      return badRequest("Body must contain a string field keyword");
    }

    const keyword = ((body as Record<string, unknown>).keyword as string)
      .toLowerCase()
      .trim();

    if (!keyword) {
      return badRequest("keyword must not be empty");
    }

    await connectDB();

    const updated = await SearchKeyword.findOneAndUpdate(
      { keyword },
      { $set: { isTrending: false, trendingOrder: 999 } },
      { new: true }
    ).lean();

    if (!updated) {
      return badRequest(`Keyword "${keyword}" not found`);
    }

    return ok({ keyword: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
