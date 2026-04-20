import { useEffect, useMemo, useState } from "react";
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
  const [now, setNow] = useState(() => new Date());

  const title = useMemo(() => routeTitles[location.pathname] || "Smart Inventory", [location.pathname]);
  const unreadCount = useMemo(
    () => notifications.filter((entry) => !entry.isRead).length,
    [notifications],
  );
  const timeLabel = useMemo(
    () => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [now],
  );
  const dateLabel = useMemo(
    () => now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
    [now],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
          <span className="status-dot" />
          Real-time operations
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">Live inventory, sales, and alert intelligence</p>
      </div>

      <div className="relative flex items-center gap-3 self-end md:self-auto">
        <div className="hidden rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-right md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Local time</p>
          <p className="text-base font-semibold text-slate-900">{timeLabel}</p>
          <p className="text-xs text-slate-500">{dateLabel}</p>
        </div>

        <button
          type="button"
          className="btn-secondary relative border-slate-200"
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
          <div className="absolute right-0 top-full z-40 mt-2 w-[22rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <span className="text-xs text-slate-500">{notifications.length} total</span>
            </div>

            <div className="max-h-72 space-y-2 overflow-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">No notifications yet</p>
              ) : (
                notifications.map((entry) => (
                  <div key={entry._id} className="rounded-lg border border-slate-200 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                      <Badge value={entry.severity} />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{entry.message}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-brand-700 underline underline-offset-2"
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
