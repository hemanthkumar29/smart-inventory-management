import dayjs from "dayjs";
import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";

const emitNotification = (notificationDoc) => {
  const io = getIO();
  if (!io) {
    return;
  }

  const payload = {
    _id: notificationDoc._id,
    type: notificationDoc.type,
    title: notificationDoc.title,
    message: notificationDoc.message,
    severity: notificationDoc.severity,
    entityType: notificationDoc.entityType,
    entityId: notificationDoc.entityId,
    recipientRoles: notificationDoc.recipientRoles,
    createdAt: notificationDoc.createdAt,
    isRead: false,
  };

  const tenantId = String(notificationDoc.tenant || "");
  if (tenantId) {
    const roles = Array.isArray(notificationDoc.recipientRoles)
      ? notificationDoc.recipientRoles
      : [];

    if (!roles.length) {
      io.to(`tenant:${tenantId}`).emit("notification:new", payload);
      return;
    }

    roles.forEach((role) => {
      io.to(`tenant-role:${tenantId}:${role}`).emit("notification:new", payload);
    });

    return;
  }

  notificationDoc.recipientRoles.forEach((role) => {
    io.to(`role:${role}`).emit("notification:new", payload);
  });
};

export const createLowStockAlert = async ({ product, userId = null, tenantId = null }) => {
  if (!product || product.quantity > product.lowStockThreshold) {
    return null;
  }

  const resolvedTenantId = tenantId || product.tenant;
  if (!resolvedTenantId) {
    return null;
  }

  const duplicateWindowStart = dayjs().subtract(12, "hour").toDate();

  const duplicateQuery = {
    type: "low_stock",
    entityType: "product",
    entityId: product._id,
    tenant: resolvedTenantId,
    createdAt: { $gte: duplicateWindowStart },
  };

  const existing = await Notification.findOne(duplicateQuery);

  if (existing) {
    return existing;
  }

  const severity = product.quantity === 0 ? "critical" : "warning";
  const notification = await Notification.create({
    type: "low_stock",
    title: "Low Stock Alert",
    message: `${product.name} stock is low (${product.quantity} left)` ,
    severity,
    entityType: "product",
    entityId: product._id,
    tenant: resolvedTenantId,
    recipientRoles: ["admin", "staff"],
    createdBy: userId,
  });

  emitNotification(notification);
  return notification;
};

export const emitSystemNotification = async ({ title, message, severity = "info", roles = ["admin", "staff"], createdBy = null, tenantId = null }) => {
  if (!tenantId) {
    return null;
  }

  const notification = await Notification.create({
    type: "system",
    title,
    message,
    severity,
    tenant: tenantId,
    recipientRoles: roles,
    createdBy,
  });

  emitNotification(notification);
  return notification;
};
