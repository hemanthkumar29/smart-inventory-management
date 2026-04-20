const styles = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  low: "border-amber-200 bg-amber-50 text-amber-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-brand-200 bg-brand-50 text-brand-700",
};

const Badge = ({ value }) => (
  <span
    className={[
      "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
      styles[value] || styles.info,
    ].join(" ")}
  >
    {value}
  </span>
);

export default Badge;
