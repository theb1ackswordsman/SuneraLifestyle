import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { Order } from "@/models/order.model";
import { User } from "@/models/user.model";
import { ok, forbidden, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (
      req.headers.get("x-user-role") !== "admin" ||
      req.headers.get("x-admin-verified") !== "1"
    ) {
      return forbidden();
    }

    await connectDB();

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thirtyDaysAgo    = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueAgg,
      thisMonthRevenueAgg,
      lastMonthRevenueAgg,
      totalOrders,
      thisMonthOrders,
      ordersByStatus,
      totalCustomers,
      thisMonthCustomers,
      topProductsAgg,
      dailyRevenueAgg,
      recentOrders,
    ] = await Promise.all([
      // All-time revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // This month revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Last month revenue from paid orders
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Total orders (all, not deleted)
      Order.countDocuments({ deletedAt: null }),

      // This month orders
      Order.countDocuments({ deletedAt: null, createdAt: { $gte: startOfThisMonth } }),

      // Orders by status
      Order.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),

      // Total active customers
      User.countDocuments({ role: "customer", isActive: true }),

      // New customers this month
      User.countDocuments({
        role: "customer",
        isActive: true,
        createdAt: { $gte: startOfThisMonth },
      }),

      // Top 8 products by revenue from order items
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            units:   { $sum: "$items.quantity" },
            name:    { $first: "$items.name" },
            image:   { $first: "$items.image" },
            slug:    { $first: "$items.slug" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
        {
          $project: {
            _id: { $toString: "$_id" },
            name: 1,
            image: 1,
            slug: 1,
            revenue: 1,
            units: 1,
          },
        },
      ]),

      // Daily revenue for last 30 days
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", revenue: 1, orders: 1, _id: 0 } },
      ]),

      // Last 6 orders
      Order.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("orderNumber total status createdAt")
        .lean(),
    ]);

    const totalRevenue     = revenueAgg[0]?.total ?? 0;
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total ?? 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total ?? 0;
    const growth =
      lastMonthRevenue === 0
        ? thisMonthRevenue > 0
          ? 100
          : 0
        : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10;

    return ok({
      revenue: {
        total:      totalRevenue,
        thisMonth:  thisMonthRevenue,
        lastMonth:  lastMonthRevenue,
        growth,
      },
      orders: {
        total:      totalOrders,
        thisMonth:  thisMonthOrders,
        byStatus:   ordersByStatus,
      },
      customers: {
        total:      totalCustomers,
        thisMonth:  thisMonthCustomers,
      },
      topProducts:   topProductsAgg,
      dailyRevenue:  dailyRevenueAgg,
      recentOrders:  recentOrders.map((o) => ({
        _id:         String(o._id),
        orderNumber: o.orderNumber,
        total:       o.total,
        status:      o.status,
        createdAt:   o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
