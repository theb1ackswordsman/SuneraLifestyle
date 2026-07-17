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

    await connectDB();

    const [totalOrders, totalProducts, totalCustomers, revenueResult] = await Promise.all([
      Order.countDocuments({ deletedAt: null }),
      Product.countDocuments({ deletedAt: null }),
      User.countDocuments({ role: "customer", isActive: true }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    // Recent orders (last 5)
    const recentOrders = await Order.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber total status createdAt paymentStatus")
      .lean();

    // Orders by status
    const ordersByStatus = await Order.aggregate([
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
    });
  } catch (err) {
    return handleApiError(err);
  }
}
