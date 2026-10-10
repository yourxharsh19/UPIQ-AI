import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  getCategoryColor,
  getCategoryIcon,
  getCategoryDisplayProps,
} from '../src/utils/categoryUtils.js';

describe('categoryUtils', () => {
  test('CATEGORY_COLORS and CATEGORY_ICONS have defined palettes', () => {
    assert.ok(Array.isArray(CATEGORY_COLORS));
    assert.ok(CATEGORY_COLORS.length > 0);
    assert.ok(Array.isArray(CATEGORY_ICONS));
    assert.ok(CATEGORY_ICONS.length > 0);
  });

  test('getCategoryColor returns a valid color object with fallback', () => {
    const color = getCategoryColor('Food & Dining');
    assert.ok(color);
    assert.ok(typeof color.value === 'string');
    assert.ok(typeof color.bg === 'string');

    const custom = getCategoryColor('Custom', '#123456');
    assert.strictEqual(custom.value, '#123456');
  });

  test('getCategoryIcon resolves mapped or default icons', () => {
    const icon = getCategoryIcon('food');
    assert.ok(typeof icon === 'string');
    assert.ok(icon.length > 0);

    const customIcon = getCategoryIcon('unknown', '?');
    assert.strictEqual(customIcon, '?');
  });

  test('getCategoryDisplayProps formats category visual properties', () => {
    const props = getCategoryDisplayProps({ name: 'Groceries' });
    assert.ok(props.color);
    assert.ok(props.icon);
    assert.strictEqual(props.name, 'Groceries');
  });
});
