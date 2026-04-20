const Loader = ({ label = "Loading..." }) => (
  <div className="card-surface flex items-center justify-center gap-3 p-6 text-brand-700">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
    <span className="text-sm font-semibold">{label}</span>
  </div>
);

export default Loader;
