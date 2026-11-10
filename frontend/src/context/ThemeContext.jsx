import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  readStoredTheme,
  persistTheme,
  resolveEffectiveTheme,
  getNextThemeInCycle,
  THEME_TOKENS,
} from '../utils/themeTokens';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => readStoredTheme());

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemIsDark(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  const resolvedTheme = resolveEffectiveTheme(theme, systemIsDark);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }
    persistTheme(theme);
  }, [theme, isDark]);

  const cycleTheme = () => {
    setTheme((prev) => getNextThemeInCycle(prev));
  };

  const toggleTheme = () => {
    cycleTheme();
  };

  const tokens = THEME_TOKENS[resolvedTheme] || THEME_TOKENS.dark;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        isDark,
        toggleTheme,
        cycleTheme,
        tokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
