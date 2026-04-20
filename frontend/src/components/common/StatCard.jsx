import { formatCompactNumber, formatCurrency } from "../../utils/formatters";

const StatCard = ({ title, value, type = "number", subtitle }) => {
  const displayValue = type === "currency" ? formatCurrency(value) : formatCompactNumber(value);
  const accentClass = type === "currency" ? "bg-emerald-500" : "bg-brand-500";

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{displayValue}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
};

export default StatCard;
