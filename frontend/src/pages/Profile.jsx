import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Save,
  CheckCircle2,
  Check,
  Sun,
  Moon,
  Laptop,
  Palette,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const Profile = () => {
  const { profile, updateProfile, supportedCurrencies, currentCurrency } = useFinancial();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Local form state initialized from global profile
  const [formData, setFormData] = useState({
    name: profile.name || 'User Account',
    email: profile.email || 'user@upiq.ai',
    phone: profile.phone || '',
    bio: profile.bio || '',
    country: profile.country || 'India',
    currency: 'INR',
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      name: profile.name || 'User Account',
      email: profile.email || '',
    }));
  }, [profile.name, profile.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      country: formData.country,
      currency: formData.currency,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header Card */}
      <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {/* Avatar Container */}
            <div className="w-16 h-16 rounded-xl border border-[var(--border-base)] bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400" aria-hidden="true">
                {(formData.name || '?').trim().charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Profile Info Summary */}
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
                {formData.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  {formData.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  {formData.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  {currentCurrency.code} ({currentCurrency.symbol})
                </span>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleSubmit}
              variant="primary"
              size="md"
              icon={isSaved ? Check : Save}
            >
              {isSaved ? 'Changes Saved' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Navigation Tabs & Form Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="p-2 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('currency')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === 'currency'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Currency & Regional</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Appearance & Theme</span>
            </button>
          </Card>

          {/* Account Profile Card */}
          <Card className="p-4 space-y-3">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Account Overview</span>

            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] text-sm font-bold text-[var(--text-main)]" aria-hidden="true">
                {(formData.name || '?').trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text-main)] truncate">{formData.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">{formData.email}</p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[var(--border-base)] grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
              <div>
                <span className="block text-[10px]">Location:</span>
                <span className="font-medium text-[var(--text-main)]">{formData.country}</span>
              </div>
              <div>
                <span className="block text-[10px]">Currency:</span>
                <span className="font-medium text-[var(--text-main)]">{formData.currency} ({currentCurrency.symbol})</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Settings Forms */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit}>
            {/* Personal Details Tab */}
            {activeTab === 'personal' && (
              <Card className="p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-main)]">Personal Details</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">These display details are saved in this browser and do not change your login credentials.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Country / Region</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        const matchedCurrency = supportedCurrencies.find((c) => c.country === newCountry);
                        setFormData((prev) => ({
                          ...prev,
                          country: newCountry,
                          currency: matchedCurrency ? matchedCurrency.code : prev.currency,
                        }));
                      }}
                      className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    >
                      {supportedCurrencies.map((c) => (
                        <option key={c.country} value={c.country}>
                          {c.country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Bio / Notes</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Brief notes about this ledger account..."
                    className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--border-base)]">
                  <Button type="submit" variant="primary" size="md" icon={Save}>
                    Save Changes
                  </Button>
                </div>
              </Card>
            )}

            {/* Currency & Regional Preferences Tab */}
            {activeTab === 'currency' && (
              <Card className="p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-main)]">Currency & Regional Preferences</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    UPIQ transaction amounts are stored and displayed in Indian rupees (INR). Currency conversion is unavailable.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {supportedCurrencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, currency: c.code, country: c.country }))}
                      className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        formData.currency === c.code
                          ? 'bg-blue-600/10 border-blue-500 text-[var(--text-main)] shadow-xs'
                          : 'bg-[var(--bg-surface)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{c.symbol} {c.code}</span>
                        {formData.currency === c.code && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-main)]">{c.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{c.country}</p>
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-main)]">Selected Display Currency</p>
                      <p className="text-[11px] text-[var(--text-muted)]">Current preference set to {formData.currency}</p>
                    </div>
                  </div>
                  <Button type="submit" variant="emerald" size="sm" icon={Save}>
                    Apply Currency
                  </Button>
                </div>
              </Card>
            )}

            {/* Appearance & Theme Preferences Tab */}
            {activeTab === 'appearance' && (
              <Card className="p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-main)]">Appearance & Theme</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Choose your preferred interface theme. Settings are saved locally on this device with zero flash on load.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light Mode', desc: 'Crisp white canvas with academic navy accents', icon: Sun },
                    { id: 'dark', label: 'Dark Mode', desc: 'Subtle slate navy for comfortable low-light focus', icon: Moon },
                    { id: 'system', label: 'System Default', desc: 'Automatically matches your device or OS appearance', icon: Laptop },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        className={`p-4 rounded-lg border text-left transition-colors flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500 text-[var(--text-main)] shadow-xs'
                            : 'bg-[var(--bg-surface)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-base)]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-main)]">{item.label}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[var(--text-muted)]">
                  <span>Currently active: <strong className="text-[var(--text-main)] capitalize">{resolvedTheme}</strong> ({theme} preference)</span>
                  <span className="text-[11px]">Zero flash on load · WCAG AA compliant</span>
                </div>
              </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
