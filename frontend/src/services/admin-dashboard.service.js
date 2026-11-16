import api from './api.js';

export const AdminDashboardService = { getSummary: async () => (await api.get('/admin/dashboard')).data };
