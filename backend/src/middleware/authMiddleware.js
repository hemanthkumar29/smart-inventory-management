import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { verifyJwt } from "../utils/jwt.js";
import { ensureUserHasTenant } from "../services/tenantService.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication token is missing");
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyJwt(token);

  let user = await User.findById(decoded.userId).select("-password");

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid token or inactive user");
  }

  await ensureUserHasTenant(user);

  user = await User.findById(user._id)
    .select("-password")
    .populate("tenant", "name code isActive");

  if (!user?.tenant || !user.tenant.isActive) {
    throw new ApiError(403, "Your enterprise workspace is inactive");
  }

  req.user = user;
  next();
});

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};
