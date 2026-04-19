import { validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";

const validateRequest = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((entry) => ({
    field: entry.path,
    message: entry.msg,
  }));

  return next(new ApiError(422, "Validation failed", errors));
};

export default validateRequest;
