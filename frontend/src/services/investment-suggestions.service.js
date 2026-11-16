import api from './api.js';

export const InvestmentSuggestionsService = {
  getSuggestions: async () => (await api.get('/investment-suggestions')).data,
};
