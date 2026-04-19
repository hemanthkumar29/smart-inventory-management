const styles = {
  healthy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  low: "bg-amber-100 text-amber-800 border-amber-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  critical: "bg-rose-100 text-rose-700 border-rose-200",
  info: "bg-brand-100 text-brand-700 border-brand-200",
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
