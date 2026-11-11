import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  THEME_TOKENS,
  resolveEffectiveTheme,
  readStoredTheme,
  persistTheme,
  getNextThemeInCycle,
  THEME_STORAGE_KEY,
} from '../src/utils/themeTokens.js';

// Helper: relative luminance per WCAG 2.1 specs
function getLuminance(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const [rl, gl, bl] = [r, g, b].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test('Task 7: Theme System (Light + Dark + System)', async (t) => {
  await t.test('design tokens define all required palette properties', () => {
    const requiredKeys = [
      'background',
      'surface',
      'border',
      'textPrimary',
      'textMuted',
      'primary',
      'primaryHover',
      'accent',
      'success',
      'warning',
      'danger',
    ];

    for (const mode of ['light', 'dark']) {
      const tokens = THEME_TOKENS[mode];
      assert.ok(tokens, `tokens must exist for ${mode}`);
      for (const key of requiredKeys) {
        assert.ok(tokens[key], `${mode} tokens must include ${key}`);
        assert.match(tokens[key], /^#|^rgba/, `${mode}.${key} must be a valid hex or rgba color`);
      }
    }

    // Light background must be crisp pure white per user specifications
    assert.equal(THEME_TOKENS.light.background.toUpperCase(), '#FFFFFF');
  });

  await t.test('theme resolution handles explicit modes and system preferences', () => {
    assert.equal(resolveEffectiveTheme('light', true), 'light');
    assert.equal(resolveEffectiveTheme('light', false), 'light');
    assert.equal(resolveEffectiveTheme('dark', true), 'dark');
    assert.equal(resolveEffectiveTheme('dark', false), 'dark');
    assert.equal(resolveEffectiveTheme('system', true), 'dark');
    assert.equal(resolveEffectiveTheme('system', false), 'light');
    assert.equal(resolveEffectiveTheme('invalid', true), 'dark');
    assert.equal(resolveEffectiveTheme('invalid', false), 'light');
  });

  await t.test('theme cycle rotates sequentially through light -> dark -> system -> light', () => {
    assert.equal(getNextThemeInCycle('light'), 'dark');
    assert.equal(getNextThemeInCycle('dark'), 'system');
    assert.equal(getNextThemeInCycle('system'), 'light');
  });

  await t.test('storage read and persist functions handle missing, corrupt, and valid keys', () => {
    const memory = new Map();
    const mockStorage = {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, String(v)),
    };

    assert.equal(readStoredTheme(mockStorage), 'system');

    persistTheme('light', mockStorage);
    assert.equal(readStoredTheme(mockStorage), 'light');

    persistTheme('dark', mockStorage);
    assert.equal(readStoredTheme(mockStorage), 'dark');

    persistTheme('system', mockStorage);
    assert.equal(readStoredTheme(mockStorage), 'system');

    mockStorage.setItem(THEME_STORAGE_KEY, 'corrupted_value');
    assert.equal(readStoredTheme(mockStorage), 'system');
  });

  await t.test('contrast ratio satisfies WCAG AA (>= 4.5:1 for body text, >= 3.0:1 for large text/buttons)', () => {
    // Light mode text against white background
    const lightTextPrimaryRatio = getContrastRatio(
      THEME_TOKENS.light.textPrimary,
      THEME_TOKENS.light.background
    );
    assert.ok(
      lightTextPrimaryRatio >= 7.0,
      `Light textPrimary contrast (${lightTextPrimaryRatio.toFixed(2)}) must exceed 7.0:1 (AAA standard)`
    );

    const lightTextMutedRatio = getContrastRatio(
      THEME_TOKENS.light.textMuted,
      THEME_TOKENS.light.background
    );
    assert.ok(
      lightTextMutedRatio >= 4.5,
      `Light textMuted contrast (${lightTextMutedRatio.toFixed(2)}) must exceed 4.5:1 (AA standard)`
    );

    // Light mode primary button text (white text on primary background #1E40AF)
    const lightButtonRatio = getContrastRatio('#FFFFFF', THEME_TOKENS.light.primary);
    assert.ok(
      lightButtonRatio >= 4.5,
      `Primary button contrast (${lightButtonRatio.toFixed(2)}) must exceed 4.5:1`
    );

    // Dark mode text against dark background
    const darkTextPrimaryRatio = getContrastRatio(
      THEME_TOKENS.dark.textPrimary,
      THEME_TOKENS.dark.background
    );
    assert.ok(
      darkTextPrimaryRatio >= 7.0,
      `Dark textPrimary contrast (${darkTextPrimaryRatio.toFixed(2)}) must exceed 7.0:1`
    );

    const darkTextMutedRatio = getContrastRatio(
      THEME_TOKENS.dark.textMuted,
      THEME_TOKENS.dark.background
    );
    assert.ok(
      darkTextMutedRatio >= 4.5,
      `Dark textMuted contrast (${darkTextMutedRatio.toFixed(2)}) must exceed 4.5:1`
    );
  });

  await t.test('index.html contains the inline anti-flash script in <head>', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    assert.ok(html.includes('upiq_theme'), 'index.html must check upiq_theme in head');
    assert.ok(html.includes('prefers-color-scheme'), 'index.html must check system preference');
    assert.ok(html.includes('classList.add'), 'index.html must set light or dark class before render');
  });

  await t.test('index.css contains required CSS variables and low-saturation tokens', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    assert.ok(css.includes('--background: #ffffff;'), 'index.css must set white background in light mode');
    assert.ok(css.includes('--primary: #1e40af;'), 'index.css must set academic navy in light mode');
    assert.ok(css.includes('--text-primary: #0f172a;'), 'index.css must set high contrast primary text in light mode');
    assert.ok(css.includes('--background: #0b1329;'), 'index.css must set deep slate navy in dark mode');
    assert.ok(css.includes('--primary: #3b82f6;'), 'index.css must set subtle blue in dark mode');
  });
});
