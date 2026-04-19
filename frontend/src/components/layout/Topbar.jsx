import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Badge from "../common/Badge";

const routeTitles = {
  "/dashboard": "Business Dashboard",
  "/products": "Products Management",
  "/orders": "Sales & Billing",
  "/reports": "Reports & Analytics",
};

const Topbar = ({ notifications = [], onMarkRead }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const title = useMemo(() => routeTitles[location.pathname] || "Smart Inventory", [location.pathname]);
  const unreadCount = useMemo(
    () => notifications.filter((entry) => !entry.isRead).length,
    [notifications],
  );

  return (
    <header className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white/80 px-4 py-3 backdrop-blur">
      <div>
        <h2 className="text-xl font-bold text-brand-900">{title}</h2>
        <p className="text-xs text-brand-500">Live inventory, sales, and alerts</p>
      </div>

      <div className="relative">
        <button
          type="button"
          className="btn-secondary relative"
          onClick={() => setOpen((prev) => !prev)}
        >
          Alerts
          {unreadCount > 0 ? (
            <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-brand-100 bg-white p-3 shadow-xl">
            <p className="text-sm font-semibold text-brand-900">Notifications</p>
            <div className="mt-2 max-h-72 space-y-2 overflow-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-brand-500">No notifications yet</p>
              ) : (
                notifications.map((entry) => (
                  <div key={entry._id} className="rounded-lg border border-brand-100 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-900">{entry.title}</p>
                      <Badge value={entry.severity} />
                    </div>
                    <p className="mt-1 text-xs text-brand-600">{entry.message}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-brand-700 underline"
                      onClick={() => onMarkRead(entry._id)}
                      disabled={entry.isRead}
                    >
                      {entry.isRead ? "Read" : "Mark as read"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Topbar;
