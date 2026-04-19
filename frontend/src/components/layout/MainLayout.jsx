import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import { fetchNotifications, markNotificationAsRead } from "../../services/notificationService";

const MainLayout = () => {
  const { user, logout, token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetchNotifications({ limit: 20 });
      setNotifications(response.data || []);
    } catch (_error) {
      toast.error("Failed to fetch notifications");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useSocket({
    token,
    enabled: Boolean(token),
    onNotification: (payload) => {
      setNotifications((prev) => [{ ...payload, isRead: false }, ...prev.slice(0, 19)]);
      toast.success(payload.message || "New notification received");
    },
  });

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((entry) => {
        if (entry._id !== id) {
          return entry;
        }

        return {
          ...entry,
          isRead: true,
        };
      }));
    } catch (_error) {
      toast.error("Could not mark notification as read");
    }
  };

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar user={user} onLogout={logout} />

      <main className="w-full flex-1 px-4 py-4 md:px-6 lg:px-8">
        <nav className="mb-3 flex gap-2 overflow-auto lg:hidden">
          {[
            { to: "/dashboard", label: "Dashboard" },
            { to: "/products", label: "Products" },
            { to: "/orders", label: "Orders" },
            { to: "/reports", label: "Reports" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => [
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold",
                isActive ? "bg-brand-700 text-white" : "bg-white text-brand-700 border border-brand-200",
              ].join(" ")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Topbar notifications={notifications} onMarkRead={handleMarkRead} />
        <div className="animate-stagger">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
