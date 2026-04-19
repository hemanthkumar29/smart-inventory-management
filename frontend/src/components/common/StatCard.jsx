import { formatCompactNumber, formatCurrency } from "../../utils/formatters";

const StatCard = ({ title, value, type = "number", subtitle }) => {
  const displayValue = type === "currency" ? formatCurrency(value) : formatCompactNumber(value);

  return (
    <div className="card-surface p-5">
      <p className="text-sm font-medium text-brand-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-brand-900">{displayValue}</p>
      {subtitle ? <p className="mt-1 text-xs text-brand-500">{subtitle}</p> : null}
    </div>
  );
};

export default StatCard;
