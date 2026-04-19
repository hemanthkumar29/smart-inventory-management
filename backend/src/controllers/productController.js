import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { uploadImage, deleteImage } from "../services/cloudinaryService.js";
import { createLowStockAlert } from "../services/alertService.js";
import { resolveTenantId } from "../utils/tenant.js";

const generateSku = (name) => {
  const prefix = String(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 10);

  return `${prefix || "ITEM"}-${uuidv4().slice(0, 6).toUpperCase()}`;
};

const applyProductBody = (product, body) => {
  const allowedFields = ["name", "sku", "price", "quantity", "category", "supplier", "lowStockThreshold", "isActive"];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      product[field] = body[field];
    }
  });
};

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { search, category, supplier, sortBy = "createdAt", sortOrder = "desc", lowStock } = req.query;
  const tenantId = resolveTenantId(req.user);

  const filter = {
    isActive: true,
    tenant: tenantId,
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (supplier) {
    filter.supplier = supplier;
  }

  if (lowStock === "true") {
    filter.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("supplier", "name email phone")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success({
      data: products,
      meta: buildPaginationMeta({ total, page, limit }),
    }),
  );
});

export const listProductCatalog = asyncHandler(async (req, res) => {
  const inStockOnly = req.query.inStockOnly === "true";
  const tenantId = resolveTenantId(req.user);
  const filter = {
    isActive: true,
    tenant: tenantId,
  };

  if (inStockOnly) {
    filter.quantity = { $gt: 0 };
  }

  const products = await Product.find(filter)
    .select("name sku price quantity category lowStockThreshold")
    .sort({ createdAt: -1 })
    .limit(2000);

  res.status(200).json(
    ApiResponse.success({
      data: products,
    }),
  );
});

export const getProductById = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const product = await Product.findOne({
    _id: req.params.id,
    tenant: tenantId,
  }).populate("supplier", "name email phone");

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json(
    ApiResponse.success({
      data: product,
    }),
  );
});

export const createProduct = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const payload = { ...req.body };
  payload.sku = payload.sku ? String(payload.sku).toUpperCase() : generateSku(payload.name);

  if (payload.supplier) {
    const supplier = await Supplier.findOne({
      _id: payload.supplier,
      tenant: tenantId,
    });

    if (!supplier) {
      throw new ApiError(404, "Supplier not found");
    }
  }

  const uploadedImage = req.file ? await uploadImage(req.file) : null;

  const product = await Product.create({
    ...payload,
    image: uploadedImage || undefined,
    tenant: tenantId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createLowStockAlert({ product, userId: req.user._id, tenantId });

  res.status(201).json(
    ApiResponse.success({
      message: "Product created successfully",
      data: product,
    }),
  );
});

export const updateProduct = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const product = await Product.findOne({
    _id: req.params.id,
    tenant: tenantId,
  });

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  if (req.body.supplier) {
    const supplier = await Supplier.findOne({
      _id: req.body.supplier,
      tenant: tenantId,
    });

    if (!supplier) {
      throw new ApiError(404, "Supplier not found");
    }
  }

  applyProductBody(product, {
    ...req.body,
    sku: req.body.sku ? String(req.body.sku).toUpperCase() : undefined,
  });

  if (req.file) {
    const uploadedImage = await uploadImage(req.file);

    if (product.image?.publicId) {
      await deleteImage(product.image.publicId);
    }

    product.image = uploadedImage;
  }

  product.updatedBy = req.user._id;
  await product.save();

  await createLowStockAlert({ product, userId: req.user._id, tenantId });

  res.status(200).json(
    ApiResponse.success({
      message: "Product updated successfully",
      data: product,
    }),
  );
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const product = await Product.findOne({
    _id: req.params.id,
    tenant: tenantId,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.image?.publicId) {
    await deleteImage(product.image.publicId);
  }

  await product.deleteOne();

  res.status(200).json(
    ApiResponse.success({
      message: "Product deleted successfully",
    }),
  );
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const tenantId = resolveTenantId(req.user);

  const product = await Product.findOne({
    _id: req.params.id,
    tenant: tenantId,
  });

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  product.quantity = quantity;
  product.updatedBy = req.user._id;
  await product.save();

  await createLowStockAlert({ product, userId: req.user._id, tenantId });

  res.status(200).json(
    ApiResponse.success({
      message: "Product stock updated",
      data: product,
    }),
  );
});
