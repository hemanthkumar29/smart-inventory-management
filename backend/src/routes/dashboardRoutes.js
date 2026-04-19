import express from "express";
import {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getInsights,
} from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF));

router.get("/summary", getSummary);
router.get("/sales-trend", getSalesTrend);
router.get("/top-products", getTopProducts);
router.get("/insights", getInsights);

export default router;
