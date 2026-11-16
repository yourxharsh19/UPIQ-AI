import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('Task 6: Honest Labels for Limitations & Unavailable Features', async (t) => {
  const root = resolve(process.cwd(), 'src');

  await t.test('client-side estimates are explicitly labeled "Estimate (not AI prediction)"', () => {
    const insightsContent = readFileSync(resolve(root, 'pages/Insights.jsx'), 'utf8');
    const forecastCardContent = readFileSync(resolve(root, 'components/insights/BudgetForecastCard.jsx'), 'utf8');

    assert.ok(
      insightsContent.includes('Estimate (not AI prediction)'),
      'Insights page should include "Estimate (not AI prediction)" label'
    );
    assert.ok(
      forecastCardContent.includes('Estimate (not AI prediction)'),
      'BudgetForecastCard should include "Estimate (not AI prediction)"'
    );
  });

  await t.test('financial assistant communicates supported intents and Ollama backend requirements', () => {
    const aiAssistantContent = readFileSync(resolve(root, 'pages/AIAssistant.jsx'), 'utf8');
    const financialAssistantContent = readFileSync(resolve(root, 'pages/FinancialAssistant.jsx'), 'utf8');

    assert.ok(
      aiAssistantContent.includes('Financial Assistant Limits & Supported Intents'),
      'AIAssistant should show limitations and supported intents banner'
    );
    assert.ok(
      aiAssistantContent.includes('Ollama'),
      'AIAssistant should mention Ollama requirement for AI answers'
    );

    assert.ok(
      financialAssistantContent.includes('Financial Assistant Limits & Supported Intents'),
      'FinancialAssistant should show limitations banner'
    );
    assert.ok(
      financialAssistantContent.includes('Ollama'),
      'FinancialAssistant should mention Ollama requirement'
    );
  });

  await t.test('unavailable features remain labeled while implemented ledger alerts and admin aggregates are surfaced', () => {
    const loginContent = readFileSync(resolve(root, 'pages/Login.jsx'), 'utf8');
    const uploadModalContent = readFileSync(resolve(root, 'components/transactions/StatementUploadModal.jsx'), 'utf8');
    const uploadPdfContent = readFileSync(resolve(root, 'pages/UploadPDF.jsx'), 'utf8');
    const sidebarContent = readFileSync(resolve(root, 'components/layout/Sidebar.jsx'), 'utf8');
    const headerContent = readFileSync(resolve(root, 'components/layout/Header.jsx'), 'utf8');
    const bottomNavContent = readFileSync(resolve(root, 'components/layout/BottomNav.jsx'), 'utf8');
    const fraudDrawerContent = readFileSync(resolve(root, 'components/insights/FraudAlertDrawer.jsx'), 'utf8');
    const adminContent = readFileSync(resolve(root, 'pages/Admin.jsx'), 'utf8');
    const appContent = readFileSync(resolve(root, 'App.jsx'), 'utf8');
    const financialContextContent = readFileSync(resolve(root, 'context/FinancialContext.jsx'), 'utf8');

    // Google Login
    assert.ok(
      loginContent.includes("googleEnabled ? 'Continue with Google' : 'Google sign-in unavailable'"),
      'Google button should reflect deployment configuration'
    );
    assert.ok(
      loginContent.includes('disabled={!googleEnabled || isGoogleSigningIn || isSubmitting}'),
      'Google button should be disabled while unavailable or signing in'
    );

    // OCR / Scanned PDFs
    assert.ok(
      uploadModalContent.includes('Scanned / image-only PDFs (OCR) are Coming soon'),
      'StatementUploadModal should note scanned OCR PDFs are Coming soon'
    );
    assert.ok(
      uploadPdfContent.includes('Scanned / image-only PDFs (OCR) are Coming soon'),
      'UploadPDF should note scanned OCR PDFs are Coming soon'
    );

    // Fraud review signals
    assert.ok(sidebarContent.includes("id: 'security', label: 'Security & Fraud'"));
    assert.ok(bottomNavContent.includes("id: 'security', label: 'Security'"));
    assert.ok(fraudDrawerContent.includes('A flag is not proof of fraud'));
    assert.ok(fraudDrawerContent.includes('normalizeFraudAlerts'));

    assert.ok(headerContent.includes('NotificationService.getNotifications') || headerContent.includes('Open spending notifications'));
    assert.ok(headerContent.includes('Push alerts are not enabled'), 'Header should distinguish on-demand alerts from push notifications');
    assert.ok(adminContent.includes('AdminDashboardService.getSummary'));
    assert.ok(adminContent.includes('Platform aggregates and a read-only account directory'));
    assert.ok(appContent.includes("profile?.role === 'admin' ? <Admin /> : <Dashboard />"), 'direct admin-tab rendering falls back for normal profiles');
    assert.ok(sidebarContent.includes("profile?.role === 'admin' ? [{ id: 'admin'"), 'normal profiles do not receive admin navigation');
    assert.ok(financialContextContent.includes("tab === 'admin' && profile?.role !== 'admin'"), 'tab selection independently blocks normal profiles');
  });
});
