import express from "express";
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  listSuppliersValidation,
  createSupplierValidation,
  updateSupplierValidation,
  supplierIdValidation,
} from "../validations/supplierValidation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF));

router.get("/", listSuppliersValidation, validateRequest, listSuppliers);
router.post("/", createSupplierValidation, validateRequest, createSupplier);
router.put("/:id", updateSupplierValidation, validateRequest, updateSupplier);
router.delete("/:id", supplierIdValidation, validateRequest, deleteSupplier);

export default router;
