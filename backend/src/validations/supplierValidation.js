import { body, param, query } from "express-validator";

export const listSuppliersValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page should be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit should be between 1 and 100"),
  query("search").optional().isString().trim(),
];

export const createSupplierValidation = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Email should be valid"),
  body("phone").optional({ values: "falsy" }).isLength({ min: 7, max: 20 }).withMessage("Phone should be between 7 and 20 characters"),
  body("address").optional().trim().isLength({ max: 240 }).withMessage("Address should be less than 240 characters"),
  body("notes").optional().trim().isLength({ max: 400 }).withMessage("Notes should be less than 400 characters"),
];

export const updateSupplierValidation = [
  param("id").isMongoId().withMessage("Invalid supplier id"),
  body("name").optional().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Email should be valid"),
  body("phone").optional({ values: "falsy" }).isLength({ min: 7, max: 20 }).withMessage("Phone should be between 7 and 20 characters"),
  body("address").optional().trim().isLength({ max: 240 }).withMessage("Address should be less than 240 characters"),
  body("notes").optional().trim().isLength({ max: 400 }).withMessage("Notes should be less than 400 characters"),
];

export const supplierIdValidation = [
  param("id").isMongoId().withMessage("Invalid supplier id"),
];
