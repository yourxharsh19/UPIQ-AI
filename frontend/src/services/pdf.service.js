import api from './api.js';

export const PDFService = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/pdf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  importStatement: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/pdf/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default PDFService;

