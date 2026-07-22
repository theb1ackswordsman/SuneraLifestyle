import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Return } from "@/models/return.model";
import "@/models/user.model";
import { ok, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const status = searchParams.get("status") ?? "";
    const limit  = 20;
    const skip   = (page - 1) * limit;

    const query: Record<string, unknown> = { deletedAt: null };
    if (status) query.status = status;

    const [returns, total] = await Promise.all([
      Return.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .lean(),
      Return.countDocuments(query),
    ]);

    return ok({ returns, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
