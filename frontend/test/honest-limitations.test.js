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

  await t.test('unavailable features (Google login, OCR, fraud, push, admin telemetry) are disabled or labeled "Coming soon"', () => {
    const loginContent = readFileSync(resolve(root, 'pages/Login.jsx'), 'utf8');
    const uploadModalContent = readFileSync(resolve(root, 'components/transactions/StatementUploadModal.jsx'), 'utf8');
    const uploadPdfContent = readFileSync(resolve(root, 'pages/UploadPDF.jsx'), 'utf8');
    const sidebarContent = readFileSync(resolve(root, 'components/layout/Sidebar.jsx'), 'utf8');
    const headerContent = readFileSync(resolve(root, 'components/layout/Header.jsx'), 'utf8');
    const bottomNavContent = readFileSync(resolve(root, 'components/layout/BottomNav.jsx'), 'utf8');
    const fraudDrawerContent = readFileSync(resolve(root, 'components/insights/FraudAlertDrawer.jsx'), 'utf8');
    const adminContent = readFileSync(resolve(root, 'pages/Admin.jsx'), 'utf8');

    // Google Login
    assert.ok(
      loginContent.includes('Continue with Google (Coming soon)'),
      'Google button should display "Continue with Google (Coming soon)"'
    );
    assert.ok(
      loginContent.includes('disabled'),
      'Google button should be disabled'
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

    // Fraud Detection
    assert.ok(
      sidebarContent.includes('Coming soon'),
      'Sidebar should show "Coming soon" badge for fraud/security'
    );
    assert.ok(
      bottomNavContent.includes('Coming soon'),
      'BottomNav should show "Coming soon" for fraud/security'
    );
    assert.ok(
      fraudDrawerContent.includes('Security and fraud monitoring — Coming soon'),
      'FraudAlertDrawer should show "Security and fraud monitoring — Coming soon"'
    );

    // Push Notifications / Alerts
    assert.ok(
      headerContent.includes('Alerts: Coming soon'),
      'Header bell indicator should show "Alerts: Coming soon"'
    );

    // Live Admin Telemetry
    assert.ok(
      adminContent.includes('Live admin telemetry — Coming soon'),
      'Admin page should state Live admin telemetry — Coming soon'
    );
    assert.ok(
      adminContent.includes('Badge variant="warning">Coming soon</Badge>'),
      'Admin page should include a Coming soon badge'
    );
  });
});
