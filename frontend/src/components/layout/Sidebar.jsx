import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", hint: "KPIs & insights" },
  { to: "/products", label: "Products", hint: "Catalog & stock" },
  { to: "/orders", label: "Sales & Orders", hint: "Billing workflow" },
  { to: "/reports", label: "Reports", hint: "Revenue analytics" },
];

const Sidebar = ({ user, onLogout }) => (
  <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 text-slate-100 lg:flex">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Smart Inventory</p>
      <h1 className="mt-2 text-2xl font-bold text-white">Operations Hub</h1>
      <p className="mt-1 text-xs text-slate-400">Live retail control center</p>
      <span className="metric-chip mt-4 border-slate-700 bg-slate-900/80 text-slate-300">
        <span className="status-dot" />
        Real-time sync active
      </span>
    </div>

    <nav className="mt-8 space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => [
            "block rounded-xl px-3 py-2.5 transition",
            isActive
              ? "bg-brand-700 text-white shadow-[0_8px_20px_rgba(24,153,173,0.35)]"
              : "text-slate-200 hover:bg-slate-900",
          ].join(" ")}
        >
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="text-xs text-slate-400">{item.hint}</p>
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-sm font-semibold text-white">{user?.name}</p>
      <p className="text-xs capitalize text-slate-400">{user?.role}</p>
      {user?.tenant?.name ? (
        <p className="mt-3 text-xs text-slate-300">Enterprise: {user.tenant.name}</p>
      ) : null}
      {user?.tenant?.code ? (
        <p className="text-xs font-semibold text-brand-300">Code: {user.tenant.code}</p>
      ) : null}
      <button type="button" className="btn-secondary mt-4 w-full border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800" onClick={onLogout}>
        Logout
      </button>
    </div>
  </aside>
);

export default Sidebar;
