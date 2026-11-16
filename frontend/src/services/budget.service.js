import api from './api.js';

export const BudgetService = {
  getBudgets: async (month) => (await api.get('/budgets', { params: { month } })).data,
  create: async (budget) => (await api.post('/budgets', budget)).data,
  update: async (id, budget) => (await api.put(`/budgets/${id}`, budget)).data,
  delete: async (id) => (await api.delete(`/budgets/${id}`)).data,
};
