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
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const Profile = () => {
  const { profile, updateProfile, supportedCurrencies, currentCurrency } = useFinancial();

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
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner Header with Rim Lighting & Anti-Gravity Aura */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800/80 p-6 md:p-8 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        {/* Glow ambient background aura */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Avatar Container with Pulsing Status Indicator */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-indigo-500/30 shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="flex h-full w-full items-center justify-center bg-indigo-600 text-3xl font-bold text-white" aria-hidden="true">{(formData.name || '?').trim().charAt(0).toUpperCase()}</span>
              </div>
            </div>

            {/* Profile Info Summary */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100">
                  {formData.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {formData.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  {formData.country}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  {currentCurrency.code} ({currentCurrency.symbol})
                </span>
              </div>
            </div>
          </div>

          {/* Save Action Status Pill */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleSubmit}
              variant="ai"
              size="lg"
              icon={isSaved ? Check : Save}
              className="shadow-lg shadow-indigo-600/30"
            >
              {isSaved ? 'Changes Saved!' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Navigation Tabs & Form Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Anti-Gravity Pill Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-3 bg-slate-900/80 backdrop-blur-xl border-slate-800">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs md:text-sm transition-all ${
                  activeTab === 'personal'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <User className="w-4 h-4 text-indigo-300" />
                <span>Personal Information</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('currency')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs md:text-sm transition-all ${
                  activeTab === 'currency'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Currency & Regional</span>
              </button>

            </div>
          </Card>

          {/* Account Identity Card Preview */}
          <Card className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Account Profile</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white" aria-hidden="true">{(formData.name || '?').trim().charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-100 truncate">{formData.name}</p>
                <p className="text-xs text-slate-400 truncate">{formData.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <span className="block text-[10px] text-slate-500">Region:</span>
                <span className="font-semibold text-slate-200">{formData.country}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Active Currency:</span>
                <span className="font-semibold text-amber-400">{formData.currency} ({currentCurrency.symbol})</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Settings Forms */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit}>
            {/* Personal Details Tab */}
            {activeTab === 'personal' && (
              <Card className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Personal Information</h3>
                  <p className="text-xs text-slate-400">These display details are saved in this browser and do not change your login credentials.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country / Location</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {supportedCurrencies.map((c) => (
                          <option key={c.country} value={c.country}>
                            {c.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bio / Professional Role</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button type="submit" variant="ai" icon={Save}>
                    Save Changes
                  </Button>
                </div>
              </Card>
            )}

            {/* Currency & Regional Preferences Tab */}
            {activeTab === 'currency' && (
              <Card className="p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Currency & Regional Preferences</h3>
                  <p className="text-xs text-slate-400">
                    UPIQ transaction amounts are stored and displayed in Indian rupees (INR). Currency conversion is unavailable.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {supportedCurrencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, currency: c.code, country: c.country }))}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        formData.currency === c.code
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-2 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-extrabold text-indigo-400">{c.symbol} {c.code}</span>
                        {formData.currency === c.code && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-200">{c.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Country: {c.country}</p>
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">Selected Display Currency</p>
                      <p className="text-[11px] text-slate-400">Current preference set to {formData.currency}</p>
                    </div>
                  </div>
                  <Button type="submit" variant="emerald" size="sm" icon={Save}>
                    Apply Currency
                  </Button>
                </div>
              </Card>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};
