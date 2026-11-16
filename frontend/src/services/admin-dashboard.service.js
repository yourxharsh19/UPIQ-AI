import api from './api.js';

export const AdminDashboardService = {
  getSummary: async (client = api) => (await client.get('/admin/dashboard')).data,
  getUsers: async (client = api) => (await client.get('/v1/users')).data,
};
