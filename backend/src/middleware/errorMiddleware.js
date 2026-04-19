import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const normalizeError = (err) => {
  if (err.name === "CastError") {
    return new ApiError(400, "Invalid resource identifier");
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return new ApiError(409, `Duplicate value for ${field}`);
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((entry) => ({
      field: entry.path,
      message: entry.message,
    }));
    return new ApiError(422, "Validation failed", details);
  }

  if (err.name === "JsonWebTokenError") {
    return new ApiError(401, "Invalid authentication token");
  }

  if (err.name === "TokenExpiredError") {
    return new ApiError(401, "Authentication token expired");
  }

  return err;
};

const errorHandler = (err, _req, res, _next) => {
  const normalizedError = normalizeError(err);
  const statusCode = normalizedError.statusCode || 500;

  const message = statusCode === 500 && env.isProduction
    ? "Internal server error"
    : normalizedError.message || "Internal server error";

  const errors = normalizedError.details || (env.isProduction ? null : normalizedError.stack);

  res.status(statusCode).json(
    ApiResponse.error({
      message,
      errors,
    }),
  );
};

export default errorHandler;
