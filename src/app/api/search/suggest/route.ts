import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { suggestProducts } from "@/lib/shop/search";
import { ok, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q") ?? "";
    const q = rawQ.replace(/[\x00-\x1F\x7F]/g, "").trim();

    if (!q || q.length < 1) {
      return badRequest("Query parameter q is required");
    }
    if (q.length > 100) {
      return badRequest("Query must not exceed 100 characters");
    }

    const result = await suggestProducts(q);

    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
