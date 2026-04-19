import { body, param, query } from "express-validator";
import { USER_ROLES } from "../utils/constants.js";

export const registerValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("companyName")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 140 })
    .withMessage("Enterprise name must be between 2 and 140 characters"),
  body("companyCode")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 4, max: 24 })
    .withMessage("Enterprise code must be between 4 and 24 characters")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage("Enterprise code can contain only letters, numbers, and hyphen"),
];

export const loginValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const updateRoleValidation = [
  param("id").isMongoId().withMessage("Invalid user id"),
  body("role").isIn(Object.values(USER_ROLES)).withMessage("Invalid role"),
];

export const listUsersValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page should be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit should be between 1 and 100"),
];
