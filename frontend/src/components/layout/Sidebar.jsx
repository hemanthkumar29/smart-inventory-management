import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/orders", label: "Sales & Orders" },
  { to: "/reports", label: "Reports" },
];

const Sidebar = ({ user, onLogout }) => (
  <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-brand-100 bg-white/80 px-4 py-6 backdrop-blur lg:flex">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Smart Inventory</p>
      <h1 className="mt-2 text-xl font-bold text-brand-900">Control Center</h1>
      <p className="mt-1 text-xs text-brand-500">Retail Operations Panel</p>
    </div>

    <nav className="mt-8 space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => [
            "block rounded-xl px-3 py-2 text-sm font-semibold transition",
            isActive ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-50",
          ].join(" ")}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>

    <div className="mt-auto rounded-xl bg-brand-50 p-3">
      <p className="text-sm font-semibold text-brand-900">{user?.name}</p>
      <p className="text-xs capitalize text-brand-600">{user?.role}</p>
      {user?.tenant?.name ? (
        <p className="mt-2 text-xs text-brand-700">Enterprise: {user.tenant.name}</p>
      ) : null}
      {user?.tenant?.code ? (
        <p className="text-xs font-semibold text-brand-700">Code: {user.tenant.code}</p>
      ) : null}
      <button type="button" className="btn-secondary mt-3 w-full" onClick={onLogout}>
        Logout
      </button>
    </div>
  </aside>
);

export default Sidebar;
