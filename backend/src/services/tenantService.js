import { v4 as uuidv4 } from "uuid";
import Tenant from "../models/Tenant.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

const sanitizeCodePrefix = (value) => String(value || "")
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "")
  .slice(0, 6);

const isDuplicateCodeError = (error) => {
  if (error?.code === 11000 && error?.keyPattern?.code) {
    return true;
  }

  const message = String(error?.message || "");
  return message.includes("code_1 dup key");
};

export const normalizeTenantCode = (value = "") => String(value).trim().toUpperCase();

export const generateTenantCode = (name = "") => {
  const prefix = sanitizeCodePrefix(name) || "ENT";
  const suffix = uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${suffix}`;
};

export const createTenantWithUniqueCode = async ({ name, createdBy = null, maxRetries = 8 }) => {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    throw new Error("Tenant name is required");
  }

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const code = generateTenantCode(normalizedName);
      return await Tenant.create({
        name: normalizedName,
        code,
        createdBy,
      });
    } catch (error) {
      if (!isDuplicateCodeError(error) || attempt === maxRetries - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unable to generate unique tenant code");
};

export const ensureUserHasTenant = async (userDoc) => {
  if (!userDoc) {
    return null;
  }

  if (userDoc.tenant) {
    return userDoc;
  }

  const fallbackTenantName = `${userDoc.name || "Enterprise"} Workspace`;
  const tenant = await createTenantWithUniqueCode({
    name: fallbackTenantName,
    createdBy: userDoc._id,
  });

  userDoc.tenant = tenant._id;
  await userDoc.save();

  const legacyTenantFilter = {
    $or: [{ tenant: { $exists: false } }, { tenant: null }],
  };

  await Promise.all([
    Product.updateMany(
      {
        ...legacyTenantFilter,
        createdBy: userDoc._id,
      },
      { $set: { tenant: tenant._id } },
    ),
    Supplier.updateMany(
      {
        ...legacyTenantFilter,
        createdBy: userDoc._id,
      },
      { $set: { tenant: tenant._id } },
    ),
    Order.updateMany(
      {
        ...legacyTenantFilter,
        soldBy: userDoc._id,
      },
      { $set: { tenant: tenant._id } },
    ),
    Notification.updateMany(
      {
        ...legacyTenantFilter,
        createdBy: userDoc._id,
      },
      { $set: { tenant: tenant._id } },
    ),
  ]);

  return userDoc;
};