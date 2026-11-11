import { useState } from "react";
import { useFinancial } from "../context/FinancialContext";
import { AuthService } from "../services/auth.service";
import { submitRegistration } from "../utils/registrationFlow.js";
import Button from "../components/ui/Button";
import { Wallet } from "lucide-react";
import logo from "../assets/logo.png";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { navigateToLogin } = useFinancial();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await submitRegistration({ authService: AuthService, form, navigateToLogin });
      if (!result.success) setError(result.error);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 relative transition-colors">
      {/* Brand Header */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2.5">
        <img src={logo} alt="UPIQ" className="w-8 h-8 rounded-lg object-cover border border-[var(--border-base)]" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[var(--text-main)] leading-none">UPIQ</span>
          <span className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Finance Ledger</span>
        </div>
      </div>

      <div className="w-full max-w-sm my-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20 mb-3">
            <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight">Create your account</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Start tracking transactions with UPIQ</p>
        </div>

        <div className="bg-[var(--bg-card)] p-6 sm:p-7 rounded-xl shadow-xs border border-[var(--border-base)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
                Full Name
              </label>
              <input
                name="name"
                minLength={3}
                maxLength={50}
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs transition-colors text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs transition-colors text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-main)] mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                minLength={12}
                maxLength={72}
                placeholder="At least 12 characters"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs transition-colors text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-2.5 text-xs font-medium"
            >
              Create Account
            </Button>
          </form>

          {error && (
            <div role="alert" className="mt-4 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
              {error}
            </div>
          )}
        </div>

        <p className="text-center mt-5 text-xs text-[var(--text-muted)]">
          Already have an account?{" "}
          <button
            onClick={() => navigateToLogin()}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
