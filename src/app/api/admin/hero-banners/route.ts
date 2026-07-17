import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { HeroBanner } from "@/models/hero-banner.model";
import { ok, created, forbidden, badRequest, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-user-role") === "admin" && req.headers.get("x-admin-verified") === "1";
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const banners = await HeroBanner.find().sort({ order: 1, createdAt: 1 }).lean();
    return ok(banners);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return forbidden();
    await connectDB();
    const body = await req.json();
    if (!body.eyebrow?.trim()) return badRequest("Eyebrow is required");
    if (!body.headline?.trim()) return badRequest("Headline is required");

    if (body.order === undefined) {
      const count = await HeroBanner.countDocuments();
      body.order = count;
    }

    const banner = await HeroBanner.create(body);
    return created({ banner }, "Hero banner created");
  } catch (err) {
    return handleApiError(err);
  }
}
