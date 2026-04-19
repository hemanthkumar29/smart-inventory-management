import Supplier from "../models/Supplier.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { resolveTenantId } from "../utils/tenant.js";

export const listSuppliers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = req.query.search || "";
  const tenantId = resolveTenantId(req.user);

  const filter = search
    ? {
      tenant: tenantId,
      name: { $regex: search, $options: "i" },
    }
    : { tenant: tenantId };

  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Supplier.countDocuments(filter),
  ]);

  res.status(200).json(
    ApiResponse.success({
      data: suppliers,
      meta: buildPaginationMeta({ total, page, limit }),
    }),
  );
});

export const createSupplier = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const supplier = await Supplier.create({
    ...req.body,
    tenant: tenantId,
    createdBy: req.user._id,
  });

  res.status(201).json(
    ApiResponse.success({
      message: "Supplier created successfully",
      data: supplier,
    }),
  );
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const supplier = await Supplier.findOneAndUpdate(
    {
      _id: req.params.id,
      tenant: tenantId,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  res.status(200).json(
    ApiResponse.success({
      message: "Supplier updated",
      data: supplier,
    }),
  );
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const supplier = await Supplier.findOneAndDelete({
    _id: req.params.id,
    tenant: tenantId,
  });

  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  res.status(200).json(
    ApiResponse.success({
      message: "Supplier deleted",
    }),
  );
});
