import api from './api';

export const CategoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getByType: async (type) => {
    const response = await api.get(`/categories/type/${type}`);
    return response.data;
  },

  create: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default CategoryService;

