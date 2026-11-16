import api from './api.js';

export const FinancialInsightsService = { getInsights: async () => (await api.get('/financial-insights')).data };
