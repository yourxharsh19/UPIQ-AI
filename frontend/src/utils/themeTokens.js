export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const THEME_STORAGE_KEY = 'upiq_theme';

export const THEME_TOKENS = {
  light: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    primary: '#1E40AF',
    primaryHover: '#1E3A8A',
    accent: '#0284C7',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    chartGrid: '#E2E8F0',
    chartTooltipBg: '#FFFFFF',
    chartTooltipBorder: '#CBD5E1',
  },
  dark: {
    background: '#0B1329',
    surface: '#111C38',
    card: 'rgba(17, 28, 56, 0.78)',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    accent: '#38BDF8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#F87171',
    chartGrid: 'rgba(255, 255, 255, 0.08)',
    chartTooltipBg: '#0F172A',
    chartTooltipBorder: '#1E293B',
  },
};

/**
 * Resolves effective theme mode given preference and system status.
 * @param {'light'|'dark'|'system'} preference
 * @param {boolean} systemIsDark
 * @returns {'light'|'dark'}
 */
export const resolveEffectiveTheme = (preference, systemIsDark = true) => {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemIsDark ? 'dark' : 'light';
};

/**
 * Reads stored theme safely from storage.
 * @param {Storage} [storage]
 * @returns {'light'|'dark'|'system'}
 */
export const readStoredTheme = (storage = (typeof localStorage !== 'undefined' ? localStorage : null)) => {
  try {
    const saved = storage?.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {}
  return 'system';
};

/**
 * Persists theme preference safely to storage.
 * @param {'light'|'dark'|'system'} theme
 * @param {Storage} [storage]
 */
export const persistTheme = (theme, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) => {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
};

/**
 * Computes next theme in the 3-state cycle: light -> dark -> system.
 * @param {'light'|'dark'|'system'} current
 * @returns {'light'|'dark'|'system'}
 */
export const getNextThemeInCycle = (current) => {
  if (current === 'light') return 'dark';
  if (current === 'dark') return 'system';
  return 'light';
};
