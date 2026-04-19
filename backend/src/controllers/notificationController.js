import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { resolveTenantId } from "../utils/tenant.js";

const withReadState = (notification, userId) => {
  const serialized = notification.toObject ? notification.toObject() : notification;
  const readBy = Array.isArray(serialized.readBy) ? serialized.readBy : [];
  const isRead = readBy.some((entry) => String(entry.user) === String(userId));

  return {
    ...serialized,
    isRead,
  };
};

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const unreadOnly = req.query.unread === "true";
  const tenantId = resolveTenantId(req.user);

  const filter = {
    tenant: tenantId,
    recipientRoles: req.user.role,
  };

  if (unreadOnly) {
    filter.readBy = {
      $not: {
        $elemMatch: {
          user: req.user._id,
        },
      },
    };
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  const data = notifications.map((notification) => withReadState(notification, req.user._id));

  res.status(200).json(
    ApiResponse.success({
      data,
      meta: buildPaginationMeta({ total, page, limit }),
    }),
  );
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const tenantId = resolveTenantId(req.user);
  const notification = await Notification.findOne({
    _id: req.params.id,
    tenant: tenantId,
    recipientRoles: req.user.role,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  const alreadyRead = notification.readBy.some((entry) => String(entry.user) === String(req.user._id));

  if (!alreadyRead) {
    notification.readBy.push({ user: req.user._id, readAt: new Date() });
    await notification.save();
  }

  res.status(200).json(
    ApiResponse.success({
      message: "Notification marked as read",
      data: withReadState(notification, req.user._id),
    }),
  );
});
