import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import { USER_ROLES } from "../utils/constants.js";
import {
  createTenantWithUniqueCode,
  normalizeTenantCode,
} from "../services/tenantService.js";

const seedAdmin = async () => {
  await connectDB();

  const adminName = process.env.ADMIN_NAME || "System Admin";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@smartinventory.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminTenantName = process.env.ADMIN_TENANT_NAME || "Default Enterprise";
  const adminTenantCode = normalizeTenantCode(process.env.ADMIN_TENANT_CODE || "");

  let admin = await User.findOne({ email: adminEmail }).select("+password");

  let tenant = null;

  if (admin?.tenant) {
    tenant = await Tenant.findById(admin.tenant);
  }

  if (!tenant && adminTenantCode) {
    tenant = await Tenant.findOne({ code: adminTenantCode });

    if (!tenant) {
      tenant = await Tenant.create({
        name: adminTenantName,
        code: adminTenantCode,
      });
    }
  }

  if (!tenant) {
    tenant = await Tenant.findOne({ name: adminTenantName });
  }

  if (!tenant) {
    tenant = await createTenantWithUniqueCode({ name: adminTenantName });
  }

  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      tenant: tenant._id,
    });

    console.log(`Admin user created: ${adminEmail}`);
  } else {
    admin.role = USER_ROLES.ADMIN;
    admin.password = adminPassword;
    admin.tenant = tenant._id;
    await admin.save();

    console.log(`Admin user updated: ${adminEmail}`);
  }

  if (!tenant.createdBy) {
    tenant.createdBy = admin._id;
    await tenant.save();
  }

  await mongoose.connection.close();
  process.exit(0);
};

seedAdmin().catch(async (error) => {
  console.error("Failed to seed admin user", error);
  await mongoose.connection.close();
  process.exit(1);
});
