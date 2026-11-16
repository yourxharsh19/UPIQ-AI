const amountPattern = /^\d+(?:\.\d{1,2})?$/;
const levels = new Set(['LOW', 'MEDIUM', 'HIGH']);

export function normalizeFraudAlerts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || typeof value.analysisStartDate !== 'string' || typeof value.analysisEndDate !== 'string'
    || !Number.isInteger(value.alertCount) || value.alertCount < 0
    || !Array.isArray(value.alerts) || value.alertCount !== value.alerts.length
    || typeof value.disclaimer !== 'string') return null;
  const alerts = value.alerts.filter((alert) => alert && typeof alert.transactionId === 'string'
    && typeof alert.date === 'string' && typeof alert.amount === 'string' && amountPattern.test(alert.amount)
    && typeof alert.type === 'string' && typeof alert.riskLevel === 'string' && levels.has(alert.riskLevel)
    && Array.isArray(alert.reasons) && alert.reasons.length > 0
    && alert.reasons.every((reason) => typeof reason?.code === 'string' && typeof reason?.description === 'string'));
  if (alerts.length !== value.alerts.length) return null;
  return { ...value, alerts };
}
