import api from './api';

export const FinancialChatService = {
  ask: async (question) => {
    const response = await api.post('/financial-chat', { question });
    return response.data;
  },
};

export default FinancialChatService;

