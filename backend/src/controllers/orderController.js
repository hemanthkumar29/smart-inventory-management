import mongoose from "mongoose";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { createLowStockAlert } from "../services/alertService.js";
import { generateInvoicePdfBuffer } from "../services/invoiceService.js";
import { resolveTenantId } from "../utils/tenant.js";

const createOrderNumber = () => `ORD-${dayjs().format("YYYYMMDD-HHmmss")}-${uuidv4().slice(0, 6).toUpperCase()}`;

const isTransactionNotSupportedError = (error) => {
  const errorMessage = String(error?.message || "");
  return errorMessage.includes("Transaction numbers are only allowed on a replica set member or mongos");
};

const createOrderInContext = async ({ req, session = null }) => {
  const tenantId = resolveTenantId(req.user);
  const {
    items,
    tax = 0,
    discount = 0,
    paymentMethod = "cash",
    customerName = "Walk-in Customer",
    customerPhone = "",
  } = req.body;

  const productIds = items.map((entry) => String(entry.product));
  const uniqueProductIds = [...new Set(productIds)];

  const productsQuery = Product.find({
    _id: { $in: uniqueProductIds },
    isActive: true,
    tenant: tenantId,
  });
  if (session) {
    productsQuery.session(session);
  }

  const products = await productsQuery;

  if (products.length !== uniqueProductIds.length) {
    throw new ApiError(404, "One or more selected products do not exist");
  }

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const originalQuantities = new Map();

  const orderItems = items.map((item) => {
    const product = productMap.get(String(item.product));

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.quantity < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    if (!originalQuantities.has(String(product._id))) {
      originalQuantities.set(String(product._id), product.quantity);
    }

    const lineTotal = Number((product.price * item.quantity).toFixed(2));
    product.quantity -= item.quantity;

    return {
      product: product._id,
      nameSnapshot: product.name,
      skuSnapshot: product.sku,
      priceSnapshot: product.price,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const updatedProducts = Array.from(productMap.values());
  try {
    await Promise.all(updatedProducts.map((product) => (session ? product.save({ session }) : product.save())));

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
    const parsedTax = Number(tax) || 0;
    const parsedDiscount = Number(discount) || 0;
    const total = Number((subtotal + parsedTax - parsedDiscount).toFixed(2));

    if (total < 0) {
      throw new ApiError(400, "Total cannot be negative");
    }

    const orderPayload = {
      orderNumber: createOrderNumber(),
      items: orderItems,
      subtotal,
      tax: parsedTax,
      discount: parsedDiscount,
      total,
      paymentMethod,
      customerName,
      customerPhone,
      tenant: tenantId,
      soldBy: req.user._id,
    };

    let order;
    if (session) {
      [order] = await Order.create([orderPayload], { session });
    } else {
      order = await Order.create(orderPayload);
    }

    return {
      order,
      updatedProducts,
    };
  } catch (error) {
    if (!session) {
      await Promise.all(updatedProducts.map(async (product) => {
        const originalQty = originalQuantities.get(String(product._id));

        if (originalQty !== undefined && product.quantity !== originalQty) {
          product.quantity = originalQty;
          await product.save();
        }
      }));
    }

    throw error;
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  let session = null;
  let order = null;
  let updatedProducts = [];

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const transactionalResult = await createOrderInContext({ req, session });
    order = transactionalResult.order;
    updatedProducts = transactionalResult.updatedProducts;

    await session.commitTransaction();
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    if (!isTransactionNotSupportedError(error)) {
      throw error;
    }

    const nonTransactionalResult = await createOrderInContext({ req, session: null });
    order = nonTransactionalResult.order;
    updatedProducts = nonTransactionalResult.updatedProducts;
  } finally {
    session?.endSession();
  }

  await Promise.all(
    updatedProducts.map((product) => createLowStockAlert({
      product,
      userId: req.user._id,
      tenantId: resolveTenantId(req.user),
    })),
  );

  const populatedOrder = await Order.findOne({
    _id: order._id,
    tenant: tenantId,
  })
    .populate("soldBy", "name email role")
    .populate("items.product", "name sku");

  res.status(201).json(
    ApiResponse.success({
      message: "Order created successfully",
      data: populatedOrder,
    }),
  );
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { from, to } = req.query;
  const tenantId = resolveTenantId(req.user);

  const filter = {
    tenant: tenantId,
  };

  if (from || to) {
    filter.createdAt = {};

    if (from) {
      filter.createdAt.$gte = new Date(from);
    }

    if (to) {
      filter.createdAt.$lte = new Date(to);
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("soldBy", "name email role"),
    Order.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success({
      data: orders,
      meta: buildPaginationMeta({ total, page, limit }),
    }),
  );
});

export const getOrderById = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const order = await Order.findOne({
    _id: req.params.id,
    tenant: tenantId,
  })
    .populate("soldBy", "name email role")
    .populate("items.product", "name sku");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json(
    ApiResponse.success({
      data: order,
    }),
  );
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const order = await Order.findOne({
    _id: req.params.id,
    tenant: tenantId,
  })
    .populate("soldBy", "name email role")
    .populate("items.product", "name sku");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const pdfBuffer = await generateInvoicePdfBuffer(order);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderNumber}.pdf`);

  res.status(200).send(pdfBuffer);
});
