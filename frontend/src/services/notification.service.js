import api from './api.js';

export const NotificationService = {
  getNotifications: async () => (await api.get('/notifications')).data,
  getUnreadCount: async () => (await api.get('/notifications/unread-count')).data,
  markRead: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
  dismiss: async (id) => (await api.patch(`/notifications/${id}/dismiss`)).data,
};
