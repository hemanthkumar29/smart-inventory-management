import express from "express";
import { getSalesReport, getInventoryReport } from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF));

router.get("/sales", getSalesReport);
router.get("/inventory", getInventoryReport);

export default router;
