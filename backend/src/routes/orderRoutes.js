import express from "express";
import {
  createOrder,
  listOrders,
  getOrderById,
  downloadInvoice,
} from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  createOrderValidation,
  listOrdersValidation,
  orderIdValidation,
} from "../validations/orderValidation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF));

router.get("/", listOrdersValidation, validateRequest, listOrders);
router.get("/:id/invoice", orderIdValidation, validateRequest, downloadInvoice);
router.get("/:id", orderIdValidation, validateRequest, getOrderById);
router.post("/", createOrderValidation, validateRequest, createOrder);

export default router;
