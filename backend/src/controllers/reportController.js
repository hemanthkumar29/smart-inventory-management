import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { resolveTenantId } from "../utils/tenant.js";

export const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const tenantId = resolveTenantId(req.user);

  const match = {
    status: "completed",
    tenant: tenantId,
  };

  if (from || to) {
    match.createdAt = {};

    if (from) {
      match.createdAt.$gte = new Date(from);
    }

    if (to) {
      match.createdAt.$lte = new Date(to);
    }
  }

  const [dailySales, paymentBreakdown, summaryResult] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
        },
      },
    ]),
  ]);

  res.status(200).json(
    ApiResponse.success({
      data: {
        summary: summaryResult[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        },
        dailySales,
        paymentBreakdown,
      },
    }),
  );
});

export const getInventoryReport = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, tenant: resolveTenantId(req.user) })
    .select("name sku category quantity lowStockThreshold price")
    .sort({ quantity: 1 });

  const report = products.map((product) => ({
    _id: product._id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    quantity: product.quantity,
    lowStockThreshold: product.lowStockThreshold,
    status: product.quantity <= product.lowStockThreshold ? "low" : "healthy",
    inventoryValue: Number((product.quantity * product.price).toFixed(2)),
  }));

  res.status(200).json(
    ApiResponse.success({
      data: report,
    }),
  );
});
