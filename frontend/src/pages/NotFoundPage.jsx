import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center p-4">
    <div className="card-surface max-w-lg p-8 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The route you are looking for does not exist.</p>
      <Link to="/dashboard" className="btn-primary mt-5 inline-flex">
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
