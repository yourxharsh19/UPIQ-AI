import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Plus,
  Search,
  Moon,
  Sun,
  Laptop,
  Globe,
  LogOut,
  Command,
  Server,
  Menu,
  X,
  User,
  LayoutDashboard,
  Receipt,
  Tags,
  Bot,
  BrainCircuit,
  FileText,
  ShieldCheck,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { BackendFeatureRoadmapModal } from '../common/BackendFeatureRoadmapModal';
import { NotificationService } from '../../services/notification.service.js';
import { getAuthSessionMode } from '../../utils/authFlow.js';
import {
  getFeatureSessionKey,
  isCurrentFeatureRequest,
} from '../../utils/featureSession.js';

export const Header = ({ onOpenAddTxModal }) => {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsSessionKey, setNotificationsSessionKey] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationActionId, setNotificationActionId] = useState(null);
  const [notificationActionError, setNotificationActionError] = useState('');
  const userMenuRef = useRef(null);
  const notificationRequestRef = useRef({ id: 0, sessionKey: '' });

  const {
    profile,
    triggerAiQuery,
    currentCurrency,
    activeTab,
    setActiveTab,
    logout,
  } = useFinancial();

  const { theme, isDark: _isDark, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const sessionMode = getAuthSessionMode();
  const notificationSessionKey = getFeatureSessionKey(profile, sessionMode);
  if (notificationRequestRef.current.sessionKey !== notificationSessionKey) {
    notificationRequestRef.current = {
      id: notificationRequestRef.current.id + 1,
      sessionKey: notificationSessionKey,
    };
  }
  const sessionNotifications = notificationsSessionKey === notificationSessionKey ? notifications : [];
  const activeNotifications = sessionNotifications;

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setNotifications([]);
    setNotificationsSessionKey('');
    setNotificationMessage('');
    setNotificationsLoading(false);
    setUnreadNotificationCount(0);
    setNotificationActionId(null);
    setNotificationActionError('');
    setIsNotificationsOpen(false);
  }, [profile?.id, profile?.email, profile?.role, sessionMode]);

  const loadNotifications = async () => {
    setIsNotificationsOpen((open) => !open);
    if (isNotificationsOpen) return;
    if (sessionMode !== 'authenticated') {
      setNotificationMessage(sessionMode === 'inconsistent'
        ? 'Your session state needs to be resolved. Sign in again to view notifications.'
        : 'Sign in with a backend account to view ledger notifications.');
      return;
    }
    const request = {
      id: notificationRequestRef.current.id + 1,
      sessionKey: notificationSessionKey,
    };
    notificationRequestRef.current = request;
    setNotificationsLoading(true);
    setNotificationMessage('');
    try {
      const response = await NotificationService.getNotifications();
      const unreadResponse = await NotificationService.getUnreadCount();
      if (!response?.success || !Array.isArray(response.data)
        || !unreadResponse?.success || !Number.isInteger(unreadResponse.data) || unreadResponse.data < 0) {
        throw new Error('Invalid notifications response');
      }
      if (!isCurrentFeatureRequest(request, notificationRequestRef.current)) return;
      setNotifications(response.data);
      setUnreadNotificationCount(unreadResponse.data);
      setNotificationsSessionKey(request.sessionKey);
    } catch {
      if (!isCurrentFeatureRequest(request, notificationRequestRef.current)) return;
      setNotificationMessage('Notifications could not be loaded.');
    } finally {
      if (isCurrentFeatureRequest(request, notificationRequestRef.current)) setNotificationsLoading(false);
    }
  };

  const updateNotification = async (notification, action) => {
    if (!notification?.id || notificationActionId != null) return;
    setNotificationActionError('');
    setNotificationActionId(notification.id);
    const request = { id: notificationRequestRef.current.id, sessionKey: notificationSessionKey };
    try {
      const response = action === 'read'
        ? await NotificationService.markRead(notification.id)
        : await NotificationService.dismiss(notification.id);
      if (!response?.success || !response.data || !isCurrentFeatureRequest(request, notificationRequestRef.current)) {
        throw new Error('Notification action failed');
      }
      if (action === 'dismiss') {
        setNotifications((current) => current.filter((item) => item.id !== notification.id));
      } else {
        setNotifications((current) => current.map((item) => item.id === notification.id ? response.data : item));
      }
      if (!notification.read) setUnreadNotificationCount((count) => Math.max(0, count - 1));
    } catch {
      if (isCurrentFeatureRequest(request, notificationRequestRef.current)) {
        setNotificationActionError('That notification could not be updated. Please retry.');
      }
    } finally {
      setNotificationActionId(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      triggerAiQuery(searchValue);
      setSearchValue('');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'insights', label: 'Financial Insights', icon: BrainCircuit },
    { id: 'reports', label: 'Monthly Reports', icon: FileText },
    { id: 'profile', label: 'User Profile', icon: User },
    ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Admin View', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-20 h-14 bg-[var(--bg-card)] border-b border-[var(--border-base)] px-4 md:px-6 flex items-center justify-between transition-colors">
        {/* Left Side: Mobile Menu Button & Brand (Mobile only) */}
        <div className="flex items-center gap-2.5 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/upiq-logo.jpg"
              alt="UPIQ Logo"
              className="w-6 h-6 rounded object-cover border border-[var(--border-base)]"
            />
            <span className="font-bold text-sm tracking-tight text-[var(--text-main)]">UPIQ</span>
          </div>
        </div>

        {/* Quick Search Bar (Tablet/Desktop) */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm hidden sm:flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search ledger or ask assistant..."
            className="w-full pl-9 pr-10 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] font-mono border border-[var(--border-base)] rounded px-1 py-0.5">
            <Command className="w-2.5 h-2.5" />K
          </div>
        </form>

        {/* Header Actions */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Backend Status & Roadmap Trigger */}
          <button
            onClick={() => setIsRoadmapOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--border-base)] rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            title="Backend Capabilities & Roadmap"
          >
            <Server className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Roadmap</span>
          </button>

          {/* Global Currency Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs font-semibold text-[var(--text-main)]">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span aria-label="Financial display currency">{currentCurrency.symbol} {currentCurrency.code}</span>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center gap-1.5 cursor-pointer"
            title={
              theme === 'light'
                ? 'Theme: Light (click for Dark)'
                : theme === 'dark'
                  ? 'Theme: Dark (click for System)'
                  : 'Theme: System (click for Light)'
            }
            aria-label={`Theme mode: ${theme}. Click to switch theme.`}
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Laptop className="w-4 h-4 text-slate-400" />
            )}
            <span className="hidden xl:inline text-[11px] font-medium text-[var(--text-muted)] capitalize">
              {theme}
            </span>
          </button>

          <div className="relative">
            <button type="button" onClick={loadNotifications} aria-expanded={isNotificationsOpen} aria-label="Open spending notifications"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-base)] text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]">
              <Bell className="w-3.5 h-3.5" /><span className="hidden sm:inline">Alerts</span>
              {unreadNotificationCount > 0 && <span className="rounded-full bg-blue-600 px-1.5 text-[10px] text-white">{unreadNotificationCount}</span>}
            </button>
            {isNotificationsOpen && <div className="absolute right-0 top-10 z-40 w-80 max-w-[90vw] rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-3 shadow-xl">
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Spending notifications</h2>
              <p className="mb-2 text-[11px] text-[var(--text-muted)]">Stored spending alerts are generated from your ledger when opened. Push alerts are not enabled.</p>
              {notificationsLoading && <p role="status" className="text-xs text-[var(--text-muted)]">Checking your ledger…</p>}
              {notificationMessage && <p role="status" className="text-xs text-[var(--text-muted)]">{notificationMessage}</p>}
              {notificationActionError && <p role="alert" className="text-xs text-rose-600">{notificationActionError}</p>}
              {!notificationsLoading && !notificationMessage && activeNotifications.length === 0 && <p className="text-xs text-[var(--text-muted)]">No active spending or budget alerts right now.</p>}
              <ul className="max-h-64 space-y-2 overflow-auto">{activeNotifications.map((item) => <li key={item.id} className={`rounded-lg bg-[var(--bg-surface)] p-2 ${item.read ? 'opacity-75' : 'border-l-2 border-blue-500'}`}>
                <p className="text-xs font-medium text-[var(--text-main)]">{item.title}{!item.read && <span className="ml-1 text-[10px] text-blue-600">Unread</span>}</p><p className="mt-1 text-[11px] text-[var(--text-muted)]">{item.message}</p>
                <div className="mt-1 flex gap-3">{!item.read && <button type="button" disabled={notificationActionId === item.id} onClick={() => updateNotification(item, 'read')} className="text-[11px] text-blue-600 underline disabled:opacity-50">Mark read</button>}<button type="button" disabled={notificationActionId === item.id} onClick={() => updateNotification(item, 'dismiss')} className="text-[11px] text-blue-600 underline disabled:opacity-50">Dismiss</button></div>
              </li>)}</ul>
            </div>}
          </div>

          {/* Quick Add Transaction Trigger */}
          <Button onClick={onOpenAddTxModal} variant="primary" size="sm" icon={Plus}>
            <span className="hidden sm:inline">Transaction</span>
          </Button>

          {/* User Menu Dropdown Trigger */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-lg border border-[var(--border-base)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              title="User Account Menu"
              aria-label={`User menu for ${profile.name}`}
              aria-expanded={isUserMenuOpen}
            >
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white shrink-0">
                {(profile.name || '?').trim().charAt(0).toUpperCase()}
              </span>
              <ChevronDown size={13} className={`text-[var(--text-muted)] transition-transform duration-150 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu Card */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-[var(--bg-card)] rounded-xl shadow-xl border border-[var(--border-base)] py-1.5 z-50 animate-fade-in">
                {/* User Info Header */}
                <div className="px-3.5 py-2.5 border-b border-[var(--border-base)]">
                  <p className="text-xs font-semibold text-[var(--text-main)] truncate">{profile.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{profile.email || 'user@upiq.ai'}</p>
                  <span className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {profile.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-xs text-left text-[var(--text-main)] hover:bg-[var(--bg-surface)] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <User size={14} className="text-blue-500" />
                    <span>Profile & Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reports');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-xs text-left text-[var(--text-main)] hover:bg-[var(--bg-surface)] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText size={14} className="text-emerald-500" />
                    <span>Monthly Statements</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsRoadmapOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-xs text-left text-[var(--text-main)] hover:bg-[var(--bg-surface)] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Server size={14} className="text-purple-500" />
                    <span>Platform Roadmap</span>
                  </button>
                </div>

                {/* Divider & Logout */}
                <div className="pt-1 border-t border-[var(--border-base)]">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-1.5 text-xs text-left text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <BackendFeatureRoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[var(--bg-card)] border-r border-[var(--border-base)] h-full p-4 flex flex-col justify-between z-10 shadow-2xl">
            {/* Drawer Top */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-base)]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/upiq-logo.jpg"
                    alt="UPIQ Logo"
                    className="w-7 h-7 rounded-lg object-cover border border-[var(--border-base)]"
                  />
                  <div>
                    <span className="font-bold text-sm tracking-tight text-[var(--text-main)] block">UPIQ</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium block">Finance Workspace</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-3 border-t border-[var(--border-base)] space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[var(--text-muted)]">Theme:</span>
                <button
                  onClick={toggleTheme}
                  className="px-2.5 py-1 rounded-md border border-[var(--border-base)] text-xs text-[var(--text-main)] flex items-center gap-1.5 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                >
                  {theme === 'light' ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-blue-400" />}
                  <span className="capitalize">{theme}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
