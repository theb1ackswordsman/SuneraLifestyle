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

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year") ?? "all";   // "2026", "2025", "all"
    const monthParam = searchParams.get("month") ?? "all"; // "01".."12", "all"
    const searchParam = searchParams.get("search")?.trim() ?? "";

    const now = new Date();
    
    let dateFilter: Record<string, unknown> = {};
    let prevDateFilter: Record<string, unknown> = {};
    let isFiltered = false;
    let periodType: "year" | "month" | "all" = "all";

    if (yearParam !== "all" || monthParam !== "all") {
      isFiltered = true;
      const targetYear = yearParam !== "all" ? parseInt(yearParam, 10) : now.getFullYear();

      if (monthParam !== "all") {
        periodType = "month";
        const m = parseInt(monthParam, 10); // 1..12
        const startOfMonth = new Date(targetYear, m - 1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(targetYear, m, 0, 23, 59, 59, 999);

        const startOfPrevMonth = new Date(targetYear, m - 2, 1, 0, 0, 0, 0);
        const endOfPrevMonth = new Date(targetYear, m - 1, 0, 23, 59, 59, 999);

        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
        prevDateFilter = { createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } };
      } else {
        periodType = "year";
        const startOfYear = new Date(targetYear, 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

        const startOfPrevYear = new Date(targetYear - 1, 0, 1, 0, 0, 0, 0);
        const endOfPrevYear = new Date(targetYear - 1, 11, 31, 23, 59, 59, 999);

        dateFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
        prevDateFilter = { createdAt: { $gte: startOfPrevYear, $lte: endOfPrevYear } };
      }
    }

    // Search filter for recent orders
    const searchFilter: Record<string, unknown> = { deletedAt: null };
    if (isFiltered) {
      Object.assign(searchFilter, dateFilter);
    }
    if (searchParam) {
      const regex = new RegExp(searchParam, "i");
      searchFilter.$or = [
        { orderNumber: regex },
        { "shippingAddress.name": regex },
        { "shippingAddress.phone": regex },
      ];
    }

    // Chart grouping format
    const chartDateFormat = periodType === "year" ? "%Y-%m" : "%Y-%m-%d";

    const [
      revenueAgg,
      periodRevenueAgg,
      prevPeriodRevenueAgg,
      totalOrders,
      periodOrders,
      ordersByStatus,
      totalCustomers,
      periodCustomers,
      topProductsAgg,
      dailyRevenueAgg,
      recentOrdersRaw,
    ] = await Promise.all([
      // All-time revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Period revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: "paid", ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Prev period revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: "paid", ...prevDateFilter } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Total orders (all, not deleted)
      Order.countDocuments({ deletedAt: null }),

      // Period orders
      Order.countDocuments({ deletedAt: null, ...dateFilter }),

      // Orders by status
      Order.aggregate([
        { $match: { deletedAt: null, ...dateFilter } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),

      // Total active customers
      User.countDocuments({ role: "customer", isActive: true }),

      // New customers in period
      User.countDocuments({
        role: "customer",
        isActive: true,
        ...dateFilter,
      }),

      // Top products by revenue in period
      Order.aggregate([
        { $match: { paymentStatus: "paid", ...dateFilter } },
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

      // Chart revenue aggregation for period
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            ...(isFiltered
              ? dateFilter
              : { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }),
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: chartDateFormat, date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", revenue: 1, orders: 1, _id: 0 } },
      ]),

      // Recent orders matching search and date filter
      Order.find(searchFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber total status createdAt shippingAddress userId")
        .populate("userId", "name email")
        .lean(),
    ]);

    const totalRevenue      = revenueAgg[0]?.total ?? 0;
    const periodRevenue     = periodRevenueAgg[0]?.total ?? (isFiltered ? 0 : totalRevenue);
    const prevPeriodRevenue = prevPeriodRevenueAgg[0]?.total ?? 0;
    const growth =
      prevPeriodRevenue === 0
        ? periodRevenue > 0
          ? 100
          : 0
        : Math.round(((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100 * 10) / 10;

    return ok({
      revenue: {
        total:      totalRevenue,
        period:     periodRevenue,
        prevPeriod: prevPeriodRevenue,
        growth,
      },
      orders: {
        total:      totalOrders,
        period:     periodOrders,
        byStatus:   ordersByStatus,
      },
      customers: {
        total:      totalCustomers,
        period:     periodCustomers,
      },
      topProducts:   topProductsAgg,
      dailyRevenue:  dailyRevenueAgg,
      recentOrders:  recentOrdersRaw.map((o) => {
        const u = o.userId as { name?: string; email?: string } | undefined;
        const addr = o.shippingAddress as { name?: string } | undefined;
        const customerName = addr?.name || u?.name || "Customer";
        return {
          _id:         String(o._id),
          orderNumber: o.orderNumber,
          customerName,
          total:       o.total,
          status:      o.status,
          createdAt:   (o.createdAt as Date).toISOString(),
        };
      }),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
