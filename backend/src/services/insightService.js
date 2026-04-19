import dayjs from "dayjs";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const generateSalesInsights = async (windowDays = 30, tenantId = null) => {
  if (!tenantId) {
    return {
      frequentlySoldProducts: [],
      restockSuggestions: [],
      insightWindowDays: windowDays,
    };
  }

  const startDate = dayjs().subtract(windowDays, "day").startOf("day").toDate();

  const salesByProduct = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: "completed",
        tenant: tenantId,
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.nameSnapshot" },
        soldUnits: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { soldUnits: -1 } },
  ]);

  const frequentlySoldProducts = salesByProduct
    .filter((entry) => entry.soldUnits >= 10)
    .slice(0, 5)
    .map((entry) => ({
      productId: entry._id,
      productName: entry.productName,
      soldUnits: entry.soldUnits,
      revenue: entry.revenue,
    }));

  const productIds = salesByProduct.map((entry) => entry._id).filter(Boolean);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds }, tenant: tenantId }).select("name quantity lowStockThreshold")
    : [];

  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const restockSuggestions = salesByProduct
    .map((entry) => {
      const product = productMap.get(String(entry._id));
      if (!product) {
        return null;
      }

      const avgDailySales = entry.soldUnits / windowDays;
      const suggestedMinimum = Math.max(product.lowStockThreshold, Math.ceil(avgDailySales * 7));

      if (product.quantity >= suggestedMinimum) {
        return null;
      }

      return {
        productId: product._id,
        productName: product.name,
        currentStock: product.quantity,
        soldUnits: entry.soldUnits,
        avgDailySales: Number(avgDailySales.toFixed(2)),
        suggestedRestockQty: Math.max(suggestedMinimum - product.quantity, 1),
      };
    })
    .filter(Boolean)
    .slice(0, 10);

  return {
    frequentlySoldProducts,
    restockSuggestions,
    insightWindowDays: windowDays,
  };
};
