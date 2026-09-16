import apiClient from './client';

export const waterApi = {
  subscribe: async (data) => {
    const response = await apiClient.post('/water/subscribe', data);
    return response.data;
  },
  getSubscriptions: async () => {
    const response = await apiClient.get('/water/subscriptions');
    return response.data;
  },
  getAvailableDates: async () => {
    const response = await apiClient.get('/water/available-dates');
    return response.data;
  },
  confirmStartDate: async (data) => {
    const response = await apiClient.post('/water/confirm-start-date', data);
    return response.data;
  },
  pauseSubscription: async (id, data) => {
    const response = await apiClient.patch(`/water/${id}/pause`, data);
    return response.data;
  },
  restartSubscription: async (id, data) => {
    const response = await apiClient.patch(`/water/${id}/restart`, data);
    return response.data;
  },
  cancelSubscription: async (id) => {
    const response = await apiClient.patch(`/water/${id}/cancel`);
    return response.data;
  }
  // Note: Legacy getProducts (GET /water/products) removed — not in spec.
};

