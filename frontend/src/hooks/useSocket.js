import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const useSocket = ({ token, enabled, onNotification }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled || !token) {
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on("notification:new", (payload) => {
      if (typeof onNotification === "function") {
        onNotification(payload);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, token, onNotification]);

  return socketRef;
};

export default useSocket;
