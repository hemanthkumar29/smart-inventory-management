import mongoose from "mongoose";
import { USER_ROLES } from "../utils/constants.js";

const readBySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["low_stock", "system"],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    entityType: {
      type: String,
      enum: ["product", "order", "system"],
      default: "system",
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    recipientRoles: {
      type: [String],
      enum: Object.values(USER_ROLES),
      default: Object.values(USER_ROLES),
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    readBy: {
      type: [readBySchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ tenant: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
