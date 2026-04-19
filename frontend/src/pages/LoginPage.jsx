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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card-surface w-full max-w-md p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-500">Smart Inventory</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-900">Sign in to your workspace</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <ErrorMessage message={error} />

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700" htmlFor="email">
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
            <label className="mb-1 block text-sm font-medium text-brand-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input-base"
              placeholder="••••••••"
              value={formState.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-sm text-brand-600">
          Need an account? <Link className="font-semibold text-brand-700" to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
