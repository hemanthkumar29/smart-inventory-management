import { body, param, query } from "express-validator";

export const listProductsValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page should be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit should be between 1 and 100"),
  query("search").optional().isString().trim(),
  query("category").optional().isString().trim(),
  query("sortBy").optional().isIn(["name", "price", "quantity", "createdAt"]).withMessage("Invalid sortBy field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Invalid sortOrder value"),
  query("lowStock").optional().isBoolean().withMessage("lowStock must be boolean"),
];

export const createProductValidation = [
  body("name").trim().isLength({ min: 2, max: 160 }).withMessage("Name must be between 2 and 160 characters"),
  body("sku").optional().trim().isLength({ min: 2, max: 40 }).withMessage("SKU must be between 2 and 40 characters"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity should be zero or more"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("supplier").optional({ values: "falsy" }).isMongoId().withMessage("Supplier should be a valid id"),
  body("lowStockThreshold").optional().isInt({ min: 1 }).withMessage("Low stock threshold should be at least 1"),
];

export const updateProductValidation = [
  param("id").isMongoId().withMessage("Invalid product id"),
  body("name").optional().trim().isLength({ min: 2, max: 160 }).withMessage("Name must be between 2 and 160 characters"),
  body("sku").optional().trim().isLength({ min: 2, max: 40 }).withMessage("SKU must be between 2 and 40 characters"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity should be zero or more"),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
  body("supplier").optional({ values: "falsy" }).isMongoId().withMessage("Supplier should be a valid id"),
  body("lowStockThreshold").optional().isInt({ min: 1 }).withMessage("Low stock threshold should be at least 1"),
];

export const productIdValidation = [
  param("id").isMongoId().withMessage("Invalid product id"),
];

export const updateStockValidation = [
  param("id").isMongoId().withMessage("Invalid product id"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity should be zero or more"),
];
