import api from './api.js';

// Allows two bounded 60-second Ollama attempts plus the retry backoff and API overhead.
export const FINANCIAL_CHAT_TIMEOUT_MS = 125000;

export const FinancialChatService = {
  ask: async (question, client = api) => {
    const response = await client.post('/financial-chat', { question }, { timeout: FINANCIAL_CHAT_TIMEOUT_MS });
    return response.data;
  },
};

export default FinancialChatService;

