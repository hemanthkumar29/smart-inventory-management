import express from "express";
import { param } from "express-validator";
import {
  listNotifications,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF));

router.get("/", listNotifications);
router.patch(
  "/:id/read",
  param("id").isMongoId().withMessage("Invalid notification id"),
  validateRequest,
  markNotificationRead,
);

export default router;
