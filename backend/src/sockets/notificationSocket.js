import User from "../models/User.js";
import { verifyJwt } from "../utils/jwt.js";
import { ensureUserHasTenant } from "../services/tenantService.js";

export const initializeNotificationSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization || "";

      if (!authToken) {
        return next(new Error("Unauthorized"));
      }

      const rawToken = authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;
      const decoded = verifyJwt(rawToken);
      let user = await User.findById(decoded.userId).select("_id role isActive name tenant");

      if (!user || !user.isActive) {
        return next(new Error("Unauthorized"));
      }

      await ensureUserHasTenant(user);

      user = await User.findById(user._id)
        .select("_id role isActive name tenant")
        .populate("tenant", "_id isActive");

      if (!user || !user.isActive || !user.tenant || !user.tenant.isActive) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = {
        id: String(user._id),
        role: user.role,
        name: user.name,
        tenantId: String(user.tenant._id),
      };

      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.join(`user:${user.id}`);
    socket.join(`tenant:${user.tenantId}`);
    socket.join(`tenant-role:${user.tenantId}:${user.role}`);

    socket.emit("notification:connected", {
      message: "Real-time notification channel connected",
    });
  });
};
