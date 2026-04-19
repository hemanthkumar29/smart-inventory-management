import dayjs from "dayjs";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateSalesInsights } from "../services/insightService.js";
import { resolveTenantId } from "../utils/tenant.js";

export const getSummary = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const orderScope = {
    status: "completed",
    tenant: tenantId,
  };

  const productScope = {
    isActive: true,
    tenant: tenantId,
  };

  const [revenueResult, totalProducts, lowStockItems, totalOrders] = await Promise.all([
    Order.aggregate([
      { $match: orderScope },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]),
    Product.countDocuments(productScope),
    Product.countDocuments({
      ...productScope,
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    }),
    Order.countDocuments(orderScope),
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  res.status(200).json(
    ApiResponse.success({
      data: {
        totalRevenue,
        totalProducts,
        lowStockItems,
        totalOrders,
      },
    }),
  );
});

export const getSalesTrend = asyncHandler(async (req, res) => {
  const range = Math.min(Number(req.query.range) || 30, 365);
  const startDate = dayjs().subtract(range - 1, "day").startOf("day").toDate();
  const tenantId = resolveTenantId(req.user);

  const salesTrend = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: "completed",
        tenant: tenantId,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trendMap = new Map(salesTrend.map((entry) => [entry._id, entry]));

  const timeline = Array.from({ length: range }).map((_, idx) => {
    const date = dayjs(startDate).add(idx, "day").format("YYYY-MM-DD");
    const data = trendMap.get(date);

    return {
      date,
      revenue: data?.revenue || 0,
      orders: data?.orders || 0,
    };
  });

  res.status(200).json(
    ApiResponse.success({
      data: timeline,
    }),
  );
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const tenantId = resolveTenantId(req.user);

  const topProducts = await Order.aggregate([
    {
      $match: {
        status: "completed",
        tenant: tenantId,
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.nameSnapshot" },
        sku: { $first: "$items.skuSnapshot" },
        soldUnits: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { soldUnits: -1 } },
    { $limit: limit },
  ]);

  res.status(200).json(
    ApiResponse.success({
      data: topProducts,
    }),
  );
});

export const getInsights = asyncHandler(async (req, res) => {
  const range = Math.min(Number(req.query.range) || 30, 180);
  const insights = await generateSalesInsights(range, resolveTenantId(req.user));

  res.status(200).json(
    ApiResponse.success({
      data: insights,
    }),
  );
});
