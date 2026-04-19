import { body, param, query } from "express-validator";
import { PAYMENT_METHODS } from "../utils/constants.js";

export const createOrderValidation = [
  body("items").isArray({ min: 1 }).withMessage("Order should include at least one item"),
  body("items.*.product").isMongoId().withMessage("Each item must have a valid product id"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Each item quantity must be at least 1"),
  body("tax").optional().isFloat({ min: 0 }).withMessage("Tax should be 0 or positive"),
  body("discount").optional().isFloat({ min: 0 }).withMessage("Discount should be 0 or positive"),
  body("paymentMethod").optional().isIn(PAYMENT_METHODS).withMessage("Invalid payment method"),
  body("customerName").optional().trim().isLength({ min: 2, max: 120 }).withMessage("Customer name should be between 2 and 120 characters"),
  body("customerPhone").optional().trim().isLength({ min: 7, max: 20 }).withMessage("Customer phone should be between 7 and 20 characters"),
];

export const listOrdersValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page should be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit should be between 1 and 100"),
  query("from").optional().isISO8601().withMessage("from should be valid date"),
  query("to").optional().isISO8601().withMessage("to should be valid date"),
];

export const orderIdValidation = [
  param("id").isMongoId().withMessage("Invalid order id"),
];
