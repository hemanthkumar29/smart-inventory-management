import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ErrorMessage from "../components/common/ErrorMessage";
import useAuth from "../hooks/useAuth";
import { validateEmail, validatePassword } from "../utils/validators";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyCode: "",
  });
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

    if (formState.name.trim().length < 2) {
      setError("Name should be at least 2 characters");
      return;
    }

    if (!validateEmail(formState.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(formState.password)) {
      setError("Password must be 8+ chars with uppercase, lowercase, and number");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const normalizedCompanyCode = formState.companyCode.trim().toUpperCase();
    if (normalizedCompanyCode && !/^[A-Z0-9-]{4,24}$/.test(normalizedCompanyCode)) {
      setError("Enterprise code must be 4-24 chars and use letters, numbers, or hyphen");
      return;
    }

    if (!normalizedCompanyCode && formState.companyName.trim().length < 2) {
      setError("Enterprise name should be at least 2 characters when no code is provided");
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        name: formState.name,
        email: formState.email,
        password: formState.password,
        companyName: formState.companyName.trim() || undefined,
        companyCode: normalizedCompanyCode || undefined,
      });

      if (normalizedCompanyCode) {
        toast.success("Joined enterprise workspace successfully");
      } else {
        const tenantCode = user?.tenant?.code;
        toast.success(tenantCode ? `Workspace created. Your enterprise code: ${tenantCode}` : "Workspace created successfully");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] lg:grid-cols-[1fr_1.3fr]">
        <aside className="hidden bg-slate-950 p-8 text-white lg:block">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Smart Inventory</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">Launch your inventory workspace</h2>
          <p className="mt-3 text-sm text-slate-300">
            Create a new enterprise setup or join an existing team with secure access controls.
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-200">
            <p>• Role-based user onboarding</p>
            <p>• Shared product and order data</p>
            <p>• Instant notification support</p>
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-600">Create account</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Set up your workspace access</h1>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <ErrorMessage message={error} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                className="input-base"
                placeholder="Alex Retail"
                value={formState.name}
                onChange={handleChange}
              />
            </div>

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
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="companyName">
                Enterprise Name
              </label>
              <input
                id="companyName"
                name="companyName"
                className="input-base"
                placeholder="Acme Retail Pvt Ltd"
                value={formState.companyName}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-slate-500">Required when creating a new enterprise workspace</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="companyCode">
                Enterprise Code (Optional)
              </label>
              <input
                id="companyCode"
                name="companyCode"
                className="input-base uppercase"
                placeholder="ACME-12AB34"
                value={formState.companyCode}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-slate-500">Enter this to join an existing enterprise. If provided, you will join as staff.</p>
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
                value={formState.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="input-base"
                value={formState.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account? <Link className="font-semibold text-brand-700" to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
