import mongoose from "mongoose";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { signJwt } from "../utils/jwt.js";
import { USER_ROLES } from "../utils/constants.js";
import {
  normalizeTenantCode,
  createTenantWithUniqueCode,
  ensureUserHasTenant,
} from "../services/tenantService.js";
import { resolveTenantId } from "../utils/tenant.js";

const isDuplicateEmailError = (error) => {
  if (error?.code !== 11000) {
    return false;
  }

  if (error?.keyPattern?.email || error?.keyValue?.email) {
    return true;
  }

  return String(error?.message || "").includes("email_1 dup key");
};

const sendAuthResponseForExistingUser = async ({ res, user, message }) => {
  if (!user.isActive) {
    throw new ApiError(403, "This account is inactive");
  }

  await ensureUserHasTenant(user);

  const existingTenant = await Tenant.findById(user.tenant).select("isActive");
  if (!existingTenant || !existingTenant.isActive) {
    throw new ApiError(403, "Your enterprise workspace is inactive");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const safeUser = await User.findById(user._id)
    .select("-password")
    .populate("tenant", "name code isActive");
  const token = signJwt({ userId: user._id, role: user.role });

  res.status(200).json(
    ApiResponse.success({
      message,
      data: {
        token,
        user: safeUser,
      },
    }),
  );
};

export const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    companyName,
    companyCode,
  } = req.body;
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail }).select("+password");
  if (existingUser) {
    const passwordMatches = await existingUser.comparePassword(password);
    if (!passwordMatches) {
      throw new ApiError(409, "User with this email already exists");
    }
    await sendAuthResponseForExistingUser({
      res,
      user: existingUser,
      message: "Account already exists. Signed you in successfully",
    });
    return;
  }

  const normalizedCompanyCode = normalizeTenantCode(companyCode);
  const isJoinFlow = Boolean(normalizedCompanyCode);
  const userId = new mongoose.Types.ObjectId();

  let tenant = null;
  if (isJoinFlow) {
    tenant = await Tenant.findOne({
      code: normalizedCompanyCode,
      isActive: true,
    });

    if (!tenant) {
      throw new ApiError(404, "Enterprise code is invalid or inactive");
    }
  } else {
    const normalizedCompanyName = String(companyName || "").trim();
    if (!normalizedCompanyName) {
      throw new ApiError(400, "Enterprise name is required when no enterprise code is provided");
    }

    tenant = await createTenantWithUniqueCode({
      name: normalizedCompanyName,
      createdBy: userId,
    });
  }

  let user;
  try {
    user = await User.create({
      _id: userId,
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: isJoinFlow ? USER_ROLES.STAFF : USER_ROLES.ADMIN,
      tenant: tenant._id,
    });
  } catch (error) {
    if (!isJoinFlow) {
      await Tenant.deleteOne({ _id: tenant._id });
    }

    if (isDuplicateEmailError(error)) {
      const concurrentUser = await User.findOne({ email: normalizedEmail }).select("+password");
      if (concurrentUser) {
        const passwordMatches = await concurrentUser.comparePassword(password);
        if (passwordMatches) {
          await sendAuthResponseForExistingUser({
            res,
            user: concurrentUser,
            message: "Registration retried successfully. Signed you in",
          });
          return;
        }
      }

      throw new ApiError(409, "User with this email already exists");
    }

    throw error;
  }

  const safeUser = await User.findById(user._id)
    .select("-password")
    .populate("tenant", "name code isActive");

  const token = signJwt({ userId: user._id, role: user.role });

  res.status(201).json(
    ApiResponse.success({
      message: isJoinFlow ? "Joined enterprise workspace successfully" : "Enterprise workspace created successfully",
      data: {
        token,
        user: safeUser,
      },
    }),
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  await ensureUserHasTenant(user);

  const userTenant = await Tenant.findById(user.tenant).select("isActive");
  if (!userTenant || !userTenant.isActive) {
    throw new ApiError(403, "Your enterprise workspace is inactive");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const safeUser = await User.findById(user._id)
    .select("-password")
    .populate("tenant", "name code isActive");
  const token = signJwt({ userId: user._id, role: user.role });

  res.status(200).json(
    ApiResponse.success({
      message: "Login successful",
      data: {
        token,
        user: safeUser,
      },
    }),
  );
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(
    ApiResponse.success({
      data: req.user,
    }),
  );
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const tenantId = resolveTenantId(req.user);

  const [users, total] = await Promise.all([
    User.find({ tenant: tenantId })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("tenant", "name code isActive"),
    User.countDocuments({ tenant: tenantId }),
  ]);

  res.status(200).json(
    ApiResponse.success({
      data: users,
      meta: buildPaginationMeta({ total, page, limit }),
    }),
  );
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const tenantId = resolveTenantId(req.user);

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findOne({
    _id: id,
    tenant: tenantId,
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.role = role;
  await user.save();

  res.status(200).json(
    ApiResponse.success({
      message: "User role updated",
      data: user,
    }),
  );
});
