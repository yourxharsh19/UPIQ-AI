import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { LazyPageErrorBoundary } from '../src/components/common/LazyPageErrorBoundary.js';

test('lazy page errors render an accessible failure message and reload action', () => {
  const boundary = new LazyPageErrorBoundary({ children: React.createElement('div') });
  boundary.state = LazyPageErrorBoundary.getDerivedStateFromError(new Error('chunk failed'));

  const output = boundary.render();
  assert.equal(output.type, 'section');
  assert.equal(output.props.role, 'alert');
  assert.equal(output.props['aria-labelledby'], 'lazy-page-error-title');
  assert.equal(output.props.children[0].props.children, 'This page could not be loaded.');

  let reloadCount = 0;
  const priorWindow = globalThis.window;
  globalThis.window = { location: { reload: () => { reloadCount += 1; } } };
  try {
    output.props.children[2].props.onClick();
    assert.equal(reloadCount, 1);
  } finally {
    globalThis.window = priorWindow;
  }
});
