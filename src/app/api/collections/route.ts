import { connectDB } from "@/lib/db/connection";
import { Collection } from "@/models/collection.model";
import { ok, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const collections = await Collection.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: 1 })
      .select("-manualProductIds -autoTags -autoCategorySlug")
      .lean();
    return ok(collections);
  } catch (err) {
    return handleApiError(err);
  }
}
