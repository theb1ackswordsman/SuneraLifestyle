import { connectDB } from "@/lib/db/connection";
import { HeroBanner } from "@/models/hero-banner.model";
import { ok, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const banners = await HeroBanner.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return ok(banners);
  } catch (err) {
    return handleApiError(err);
  }
}
