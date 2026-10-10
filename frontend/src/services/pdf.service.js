import api from './api';

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
};

export default PDFService;

