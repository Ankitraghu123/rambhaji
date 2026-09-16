import apiClient from './client';

export const notificationsApi = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },
  markRead: async (id) => {
    const response = await apiClient.patch(`/notifications/${id}/mark-read`);
    return response.data;
  }
};
