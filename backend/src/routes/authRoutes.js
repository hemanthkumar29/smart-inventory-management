import express from "express";
import {
  register,
  login,
  getMe,
  listUsers,
  updateUserRole,
} from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  registerValidation,
  loginValidation,
  listUsersValidation,
  updateRoleValidation,
} from "../validations/authValidation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.post("/register", registerValidation, validateRequest, register);
router.post("/login", loginValidation, validateRequest, login);

router.get("/me", authenticate, getMe);
router.get(
  "/users",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  listUsersValidation,
  validateRequest,
  listUsers,
);
router.patch(
  "/users/:id/role",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  updateRoleValidation,
  validateRequest,
  updateUserRole,
);

export default router;
