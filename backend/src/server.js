import http from "http";
import net from "net";
import mongoose from "mongoose";
import { Server } from "socket.io";
import app from "./app.js";
import env from "./config/env.js";
import { connectDB } from "./config/db.js";
import { setIO } from "./config/socket.js";
import { initializeNotificationSocket } from "./sockets/notificationSocket.js";

const isPortAvailable = (port) => new Promise((resolve, reject) => {
  const tester = net.createServer();

  tester.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      resolve(false);
      return;
    }

    reject(error);
  });

  tester.once("listening", () => {
    tester.close(() => resolve(true));
  });

  tester.listen(port);
});

const findAvailablePort = async (startPort, maxAttempts = 25) => {
  for (let offset = 0; offset <= maxAttempts; offset += 1) {
    const candidatePort = startPort + offset;
    const available = await isPortAvailable(candidatePort);

    if (available) {
      return candidatePort;
    }
  }

  throw new Error(`No available port found from ${startPort} to ${startPort + maxAttempts}`);
};

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true,
    },
  });

  setIO(io);
  initializeNotificationSocket(io);

  const desiredPort = env.port;
  const activePort = await findAvailablePort(desiredPort);

  if (activePort !== desiredPort) {
    console.warn(
      `Port ${desiredPort} is in use. Server is automatically using port ${activePort} instead.`,
    );
  }

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);

    httpServer.listen(activePort, () => {
      console.log(`Server listening on port ${activePort}`);
      resolve();
    });
  });

  const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Closing server gracefully...`);

    httpServer.close(async () => {
      await mongoose.connection.close();
      console.log("Server shut down completed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Server startup failed", error);
  process.exit(1);
});
