const Loader = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center gap-3 py-10 text-brand-700">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default Loader;
