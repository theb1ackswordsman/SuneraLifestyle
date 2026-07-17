import { ok, handleApiError } from "@/lib/api/response";
import { queryCategories } from "@/lib/shop/query-categories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await queryCategories();
    return ok(categories);
  } catch (err) {
    return handleApiError(err);
  }
}
