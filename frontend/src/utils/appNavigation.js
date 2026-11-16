const APP_TABS = new Set([
  'dashboard', 'transactions', 'categories', 'ai-assistant',
  'insights', 'insights-tab', 'security', 'reports', 'admin', 'profile',
]);

export const resolveAppTab = (tab) => APP_TABS.has(tab) ? tab : 'dashboard';
