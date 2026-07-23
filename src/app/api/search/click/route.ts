import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { SearchKeyword } from "@/models/search-keyword.model";
import { ok, badRequest, handleApiError } from "@/lib/api/response";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/search/click
// Tracks a product click from a search result. Auth is optional.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (typeof body !== "object" || body === null) {
      return badRequest("Invalid request body");
    }

    const {
      query,
      productId,
      slug,
      position,
    } = body as Record<string, unknown>;

    if (typeof query !== "string" || !query.trim()) {
      return badRequest("query is required");
    }
    if (typeof productId !== "string" || !productId.trim()) {
      return badRequest("productId is required");
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return badRequest("productId is not a valid ObjectId");
    }
    if (typeof slug !== "string" || !slug.trim()) {
      return badRequest("slug is required");
    }
    if (typeof position !== "number" || !Number.isFinite(position)) {
      return badRequest("position must be a number");
    }

    await connectDB();

    // Non-blocking click tracking
    const keyword = query.toLowerCase().trim();
    SearchKeyword.findOneAndUpdate(
      { keyword },
      { $inc: { clickCount: 1 } }
    ).catch(console.error);

    return ok("ok");
  } catch (err) {
    return handleApiError(err);
  }
}
