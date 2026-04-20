import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorMessage from "../components/common/ErrorMessage";
import useAuth from "../hooks/useAuth";
import { validateEmail } from "../utils/validators";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [formState, setFormState] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    setFormState((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateEmail(formState.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formState.password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      await login(formState);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] lg:grid-cols-[1fr_1.2fr]">
        <aside className="hidden bg-slate-950 p-8 text-white lg:block">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Smart Inventory</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">Welcome back to your operations hub</h2>
          <p className="mt-3 text-sm text-slate-300">
            Monitor inventory, sales, alerts, and reporting in one real-time command center.
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-200">
            <p>• Live low-stock alerts</p>
            <p>• Instant sales visibility</p>
            <p>• Multi-branch team access</p>
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-600">Sign in</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Access your workspace</h1>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <ErrorMessage message={error} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-base"
                placeholder="owner@shop.com"
                value={formState.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input-base"
                placeholder="********"
                value={formState.password}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Need an account? <Link className="font-semibold text-brand-700" to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
