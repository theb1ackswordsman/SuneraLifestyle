import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/models/user.model";
import { Product } from "@/models/product.model";
import { Order } from "@/models/order.model";
import { ok, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("x-user-role") !== "admin" || req.headers.get("x-admin-verified") !== "1") {
      return forbidden();
    }

    const { searchParams } = req.nextUrl;
    const month = searchParams.get("month") ?? "all";
    const year  = searchParams.get("year")  ?? "all";

    await connectDB();

    // ── Build date range filter ─────────────────────────────────────────────
    const orderMatch: Record<string, unknown> = { deletedAt: null };
    const userMatch: Record<string, unknown>  = { role: "customer", isActive: true };

    if (year !== "all" || month !== "all") {
      const now = new Date();
      const y = year !== "all" ? parseInt(year, 10) : now.getFullYear();
      let startDate: Date;
      let endDate: Date;

      if (month !== "all") {
        const m = parseInt(month, 10) - 1;
        startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0));
        endDate   = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
      } else {
        startDate = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
        endDate   = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
      }

      orderMatch.createdAt = { $gte: startDate, $lte: endDate };
      userMatch.createdAt  = { $gte: startDate, $lte: endDate };
    }

    const revenueMatch = { ...orderMatch, paymentStatus: "paid" };

    const [totalOrders, totalProducts, totalCustomers, revenueResult] = await Promise.all([
      Order.countDocuments(orderMatch),
      Product.countDocuments({ deletedAt: null }),
      User.countDocuments(userMatch),
      Order.aggregate([
        { $match: revenueMatch },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    // Recent orders (last 5 in filtered range)
    const recentOrders = await Order.find(orderMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber total status createdAt paymentStatus")
      .lean();

    // Orders by status in filtered range
    const ordersByStatus = await Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    return ok({
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      recentOrders,
      ordersByStatus,
      filter: { month, year },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
