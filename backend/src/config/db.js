import mongoose from "mongoose";
import env from "./env.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

const syncModelIndexes = async () => {
  const models = [
    Tenant,
    User,
    Product,
    Supplier,
    Order,
    Notification,
  ];

  try {
    await Promise.all(models.map((model) => model.syncIndexes()));
    console.log("MongoDB indexes synchronized");
  } catch (error) {
    console.warn(`MongoDB index sync warning: ${error.message}`);
  }
};

export const connectDB = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  });

  await syncModelIndexes();

  console.log("MongoDB connected successfully");
};
