import api from './api';

export const TransactionService = {
  getAll: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },

  create: async (txData) => {
    const response = await api.post('/transactions', txData);
    return response.data;
  },

  getByCategory: async (category) => {
    const response = await api.get(`/transactions/category/${category}`);
    return response.data;
  },

  categorizeUncategorized: async () => {
    const response = await api.post('/transactions/categorize-uncategorized');
    return response.data;
  },

  update: async (id, txData) => {
    const response = await api.put(`/transactions/${id}`, txData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  deleteAll: async () => {
    const response = await api.delete('/transactions');
    return response.data;
  },
};

export default TransactionService;

