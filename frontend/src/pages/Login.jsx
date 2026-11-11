import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  User,
  HelpCircle,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const Login = () => {
  const { login, navigateToHome, navigateToRegister, postLoginRedirect } = useFinancial();

  const [vpa, setVpa] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerLoginProcess = async (emailVal, passVal, isDemoVal = false, nameVal = '', roleVal = 'user') => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const res = await login(emailVal, passVal, 'INR', nameVal, roleVal, isDemoVal);
      if (!res?.success) {
        setErrorMessage(res?.error || 'Login failed. Invalid credentials.');
      } else {
        setErrorMessage('');
      }
    } catch (err) {
      setErrorMessage(err?.userFriendlyMessage || err?.message || 'Login failed. Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerLoginProcess(vpa, password);
  };

  const handleUserDemo = () => {
    triggerLoginProcess('user@upiq.ai', 'user123', true, 'User Account', 'user');
  };

  const handleAdminDemo = () => {
    triggerLoginProcess('admin@upiq.ai', 'admin123', true, 'System Administrator', 'admin');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header Navigation */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between py-3 mb-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={navigateToHome}>
          <img
            src="/upiq-logo.jpg"
            alt="UPIQ AI Logo"
            className="w-7 h-7 rounded-lg object-cover border border-[var(--border-base)]"
          />
          <span className="font-bold text-base tracking-tight text-[var(--text-main)]">
            UPIQ
          </span>
        </div>

        <button
          onClick={navigateToHome}
          className="px-3 py-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* CENTERED LOGIN FORM CONTAINER */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <AnimatePresence mode="wait">
          {!isSubmitting && (
            <motion.div
              key="centered-login-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl border border-[var(--border-base)] p-6 sm:p-8 space-y-5 bg-[var(--bg-card)] shadow-xs"
            >
              {/* Special AI Assistant Redirect Notice */}
              {postLoginRedirect === 'ai-assistant' && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Sign in to launch your <strong>Financial Assistant</strong> session directly.</span>
                </div>
              )}

              {errorMessage && (
                <div
                  id="login-error"
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-500 dark:text-rose-400"
                >
                  {errorMessage}
                </div>
              )}

              {/* Form Title */}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">Sign in to your account</h1>
                <p className="text-xs text-[var(--text-muted)]">Personal financial ledger for your accounts</p>
              </div>

              {/* DIRECT GOOGLE / GMAIL LOGIN BUTTON */}
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-muted)] flex items-center justify-center gap-2.5 cursor-not-allowed opacity-60"
                title="Google sign-in is coming soon"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (Coming soon)</span>
              </button>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-[var(--border-base)]" />
                <span className="bg-[var(--bg-card)] px-3 text-[10px] font-medium text-[var(--text-muted)] tracking-wider uppercase shrink-0">
                  or email sign in
                </span>
              </div>

              {/* FORM FIELDS */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Email Address */}
                <div>
                  <label htmlFor="vpa-field" className="block text-xs font-medium text-[var(--text-main)] mb-1">
                    Email Address
                  </label>
                  <input
                    id="vpa-field"
                    type="email"
                    required
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password-field" className="block text-xs font-medium text-[var(--text-main)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="password-field"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {/* Submit Login Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* 1-Click Demo Logins */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleUserDemo}
                    className="py-2 px-2.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-main)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Login as Standard User"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>User Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminDemo}
                    className="py-2 px-2.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-main)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Login as System Admin"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Admin Demo</span>
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-[var(--text-muted)] pt-1">
                New to UPIQ?{' '}
                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  Create an account
                </button>
              </p>

              {/* Bottom Security Footer */}
              <div className="pt-2 border-t border-[var(--border-base)] text-center flex items-center justify-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                <span>Google OAuth (Coming soon)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-xl mx-auto pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-2">
        <button onClick={navigateToHome} className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
          © 2026 UPIQ — Return to Home Page
        </button>
        <a href="mailto:support@upiq.ai" className="hover:text-[var(--text-main)] transition-colors">
          Support &rarr;
        </a>
      </footer>
    </div>
  );
};

export default Login;
