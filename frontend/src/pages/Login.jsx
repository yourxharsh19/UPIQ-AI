import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Fingerprint,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const Login = () => {
  const { login, loginWithGoogle, supportedCurrencies, navigateToHome, postLoginRedirect } = useFinancial();

  const [name, setName] = useState('');
  const [vpa, setVpa] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [showPassword, setShowPassword] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerLoginProcess = (emailVal, passVal, currVal, nameVal, roleVal) => {
    setIsSubmitting(true);
    setTimeout(() => {
      login(emailVal, passVal, currVal, nameVal, roleVal);
    }, 550);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isAdm = vpa.toLowerCase().includes('admin');
    triggerLoginProcess(vpa, password, selectedCurrency, name, isAdm ? 'admin' : 'user');
  };

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      loginWithGoogle({
        email: 'google.user@gmail.com',
        name: 'Google User',
        currencyCode: selectedCurrency,
        googleId: 'g_auth_10928374',
        credential: 'google_identity_credential_token_verified',
      });
    }, 550);
  };

  const handleUserDemo = () => {
    triggerLoginProcess('user@upiq.ai', 'user123', selectedCurrency, 'User Account', 'user');
  };

  const handleAdminDemo = () => {
    triggerLoginProcess('admin@upiq.ai', 'admin123', selectedCurrency, 'System Administrator', 'admin');
  };

  const handleCurrencySelect = (code, country) => {
    setSelectedCurrency(code);
    if (country) {
      setSelectedCountry(country);
    } else {
      const match = supportedCurrencies.find((item) => item.code === code);
      if (match) setSelectedCountry(match.country);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    const match = supportedCurrencies.find((item) => item.country === country);
    if (match) setSelectedCurrency(match.code);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glowing radial blobs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl mx-auto flex items-center justify-between py-3.5 px-6 rounded-2xl glass-panel border border-slate-800/80 mb-6 z-20 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 cursor-pointer" onClick={navigateToHome}>
          <img
            src="/upiq-logo.jpg"
            alt="UPIQ AI Logo"
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-600/30 hover:scale-105 transition-transform"
          />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            UPIQ AI<span className="text-indigo-400">.</span>
          </span>
        </div>

        <button
          onClick={navigateToHome}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>Back to Home Page</span>
        </button>
      </motion.header>

      {/* CENTERED LOGIN FORM CONTAINER */}
      <div className="w-full max-w-md mx-auto z-10 flex-1 my-auto flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!isSubmitting && (
            <motion.div
              key="centered-login-card"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl glass-panel-glow border border-slate-800/80 p-6 md:p-8 space-y-5 bg-slate-900/90 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
            >
              {/* Top Rim Lighting */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

              {/* Special AI Assistant Redirect Notice */}
              {postLoginRedirect === 'ai-assistant' && (
                <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2.5 animate-pulse">
                  <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>Sign in to launch your <strong>AI Assistant</strong> session directly!</span>
                </div>
              )}

              {/* Form Title & Logo Header */}
              <div className="text-center space-y-2">
                <img
                  src="/upiq-logo.jpg"
                  alt="UPIQ AI Logo"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 mx-auto shadow-xl shadow-indigo-600/40 hover:scale-105 transition-transform"
                />
                <h1 className="text-2xl font-bold text-slate-100">Sign In to UPIQ AI</h1>
                <p className="text-xs text-slate-400">Select your country & currency preference</p>
              </div>

              {/* DIRECT GOOGLE / GMAIL LOGIN BUTTON */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800/90 text-xs font-bold text-slate-100 flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer group"
              >
                {/* Official Google Logo SVG */}
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
                <span>Continue with Google / Gmail</span>
              </motion.button>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center my-1">
                <div className="w-full border-t border-slate-800" />
                <span className="bg-slate-900 px-3 text-[10px] font-semibold text-slate-500 tracking-wider uppercase shrink-0">
                  or continue with email / upi
                </span>
              </div>

              {/* FORM FIELDS */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label htmlFor="full-name-field" className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    id="full-name-field"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Email / UPI ID */}
                <div>
                  <label htmlFor="vpa-field" className="block text-xs font-semibold text-slate-300 mb-1">
                    UPI ID or Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-500 font-mono">@</span>
                    <input
                      id="vpa-field"
                      type="text"
                      required
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="name@upiq.ai or mobile"
                    />
                  </div>
                </div>

                {/* Password / Passkey Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password-field" className="block text-xs font-semibold text-slate-300">
                      Password / Authentication
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseBiometric(!useBiometric)}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      {useBiometric ? 'Use Password' : 'Use Passkey'}
                    </button>
                  </div>

                  {useBiometric ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPassword('passkey-demo')}
                      className="w-full py-3 px-4 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-xs font-semibold text-indigo-300 flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-emerald-400" />
                        Authenticate with Device Passkey
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <div className="relative">
                      <input
                        id="password-field"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-12 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Country & Currency Selector Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="country-select-box" className="block text-xs font-semibold text-slate-300 mb-1">
                      Country / Region
                    </label>
                    <select
                      id="country-select-box"
                      value={selectedCountry}
                      onChange={(e) => handleCountrySelect(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      {supportedCurrencies.map((c) => (
                        <option key={c.country} value={c.country}>
                          {c.country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="currency-select-box" className="block text-xs font-semibold text-slate-300 mb-1">
                      Display Currency
                    </label>
                    <select
                      id="currency-select-box"
                      value={selectedCurrency}
                      onChange={(e) => handleCurrencySelect(e.target.value, null)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      {supportedCurrencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit Login Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Launching UPIQ AI...
                    </span>
                  ) : (
                    <>
                      <span>Login with UPI PIN / Biometrics</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* 1-Click Demo Logins */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleUserDemo}
                    className="py-2.5 px-3 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 text-xs font-semibold text-indigo-300 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Login as Standard User"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>User Login</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAdminDemo}
                    className="py-2.5 px-3 rounded-xl border border-purple-500/30 bg-purple-600/10 hover:bg-purple-600/20 text-xs font-semibold text-purple-300 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Login as System Admin"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Admin Login</span>
                  </motion.button>
                </div>
              </form>

              {/* Bottom Security Footer */}
              <div className="pt-2 border-t border-slate-800/80 text-center flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> 256-Bit SSL
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Google OAuth Ready
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 z-10">
        <button onClick={navigateToHome} className="hover:text-slate-300 transition-colors">
          © 2026 UPIQ Financial OS — Return to Home Page
        </button>
        <a href="mailto:support@upiq.ai" className="hover:text-indigo-400 transition-colors">
          Need help? &rarr;
        </a>
      </footer>
    </div>
  );
};
