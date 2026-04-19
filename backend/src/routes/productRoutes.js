import express from "express";
import {
  listProducts,
  listProductCatalog,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../controllers/productController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import { imageUpload } from "../middleware/uploadMiddleware.js";
import {
  listProductsValidation,
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  updateStockValidation,
} from "../validations/productValidation.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listProductsValidation, validateRequest, listProducts);
router.get("/catalog", listProductCatalog);
router.get("/:id", productIdValidation, validateRequest, getProductById);

router.post(
  "/",
  authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF),
  imageUpload.single("image"),
  createProductValidation,
  validateRequest,
  createProduct,
);

router.put(
  "/:id",
  authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF),
  imageUpload.single("image"),
  updateProductValidation,
  validateRequest,
  updateProduct,
);

router.patch(
  "/:id/stock",
  authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF),
  updateStockValidation,
  validateRequest,
  updateProductStock,
);

router.delete(
  "/:id",
  authorize(USER_ROLES.ADMIN),
  productIdValidation,
  validateRequest,
  deleteProduct,
);

export default router;
