import api from './api.js';

export const FraudDetectionService = {
  getAlerts: async () => (await api.get('/fraud-alerts')).data,
};
