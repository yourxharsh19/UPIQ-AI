import api from './api.js';

export const NotificationService = { getNotifications: async () => (await api.get('/notifications')).data };
