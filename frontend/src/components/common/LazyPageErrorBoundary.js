import React from 'react';

export class LazyPageErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return React.createElement(
      'section',
      { role: 'alert', 'aria-labelledby': 'lazy-page-error-title', className: 'rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6' },
      React.createElement('h2', { id: 'lazy-page-error-title', className: 'font-semibold text-[var(--text-main)]' }, 'This page could not be loaded.'),
      React.createElement('p', { className: 'mt-2 text-sm text-[var(--text-muted)]' }, 'Reload the app to try loading it again.'),
      React.createElement('button', {
        type: 'button',
        className: 'mt-4 rounded-lg border border-[var(--border-base)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)]',
        onClick: () => window.location.reload(),
      }, 'Reload app'),
    );
  }
}
