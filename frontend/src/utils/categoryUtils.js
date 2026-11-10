/**
 * Utility functions for category colors and icons
 * Provides consistent color/icon assignment and retrieval
 */

// Predefined color palette for categories
export const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-800/50' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-200 dark:border-red-800/50' },
  { name: 'Green', value: '#10b981', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-200 dark:border-green-800/50' },
  { name: 'Yellow', value: '#f59e0b', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-200 dark:border-yellow-800/50' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-200 dark:border-purple-800/50' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-200 dark:border-pink-800/50' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-200 dark:border-cyan-800/50' },
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-200 dark:border-indigo-800/50' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-200 dark:border-orange-800/50' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-200 dark:border-teal-800/50' },
];

// Predefined emoji choices for the category editor.
export const CATEGORY_ICONS = [
  '💰', '💸', '🍔', '🚗', '🏠', '👕', '💊', '🎓', '🎮', '📱',
  '✈️', '🍕', '☕', '🎬', '🏋️', '💼', '🎁', '💳', '📚', '🎨',
  '🏥', '🎵', '🌮', '🍺', '🚌', '🏖️', '🛒', '💻', '📺', '🎯'
];

// Stable defaults used throughout the app. A user-selected stored icon still takes precedence.
export const CATEGORY_ICON_BY_NAME = Object.freeze({
  food: '🍔',
  groceries: '🛒',
  shopping: '🛍️',
  transport: '🚗',
  'bills & utilities': '💡',
  entertainment: '🎬',
  health: '❤️',
  rent: '🏠',
  education: '🎓',
  travel: '✈️',
  fuel: '⛽',
  insurance: '🛡️',
  'cash withdrawal': '💵',
  other: '📦',
});

/**
 * Get a consistent color for a category name
 */
export const getCategoryColor = (categoryName, customColor = null) => {
  if (customColor) {
    const foundColor = CATEGORY_COLORS.find(c => c.value === customColor);
    if (foundColor) return foundColor;
    // If custom color not in list, return a default object with that value
    return { name: 'Custom', value: customColor, bg: '', text: '', border: '' };
  }

  // Hash function for consistent color assignment
  if (!categoryName) return CATEGORY_COLORS[0];
  const index = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

/**
 * Get a consistent icon/emoji for a category
 */
export const getCategoryIcon = (categoryName, customIcon = null) => {
  const normalizedName = categoryName?.trim().toLowerCase() || '';
  return customIcon || CATEGORY_ICON_BY_NAME[normalizedName] || CATEGORY_ICON_BY_NAME.other;
};

/**
 * Get category display props (color, icon, etc.)
 */
export const getCategoryDisplayProps = (category) => {
  const name = category?.name || 'Uncategorized';
  const color = getCategoryColor(name, category?.color);
  const icon = getCategoryIcon(name, category?.icon);

  return {
    name,
    color,
    icon,
    colorValue: color.value,
    colorClasses: {
      bg: color.bg,
      text: color.text,
      border: color.border
    }
  };
};

