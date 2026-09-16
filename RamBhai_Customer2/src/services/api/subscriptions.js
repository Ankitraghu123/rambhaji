import apiClient from './client';

export const subscriptionsApi = {
  subscribe: async (data) => {
    const response = await apiClient.post('/subscribe', data);
    return response.data;
  },
  getAvailableDates: async (package_id) => {
    const response = await apiClient.get('/available-dates', { params: { package_id } });
    return response.data;
  },
  confirmStartDate: async (data) => {
    const response = await apiClient.post('/confirm-start-date', data);
    return response.data;
  },
  getMySubscriptions: async () => {
    const response = await apiClient.get('/my-subscriptions');
    return response.data;
  },
  pauseSubscription: async (id, data) => {
    const response = await apiClient.patch(`/subscriptions/${id}/pause`, data);
    return response.data;
  },
  restartSubscription: async (id, data) => {
    const response = await apiClient.patch(`/subscriptions/${id}/restart`, data);
    return response.data;
  },
  cancelSubscription: async (id) => {
    const response = await apiClient.patch(`/subscriptions/${id}/cancel`);
    return response.data;
  },
  getSeasonalOptions: async (subscription_id) => {
    const response = await apiClient.get(`/seasonal-options/${subscription_id}`);
    return response.data;
  },
  selectSeasonalItems: async (data) => {
    const response = await apiClient.post('/select-seasonal', data);
    return response.data;
  },
  getUpcomingSelections: async (id) => {
    const response = await apiClient.get(`/subscriptions/${id}/upcoming-selections`);
    return response.data;
  },
  saveSeasonalSelection: async (id, data) => {
    const response = await apiClient.post(`/subscriptions/${id}/schedule-seasonal`, data);
    return response.data;
  }
  // Note: Legacy updateSubscriptionVeggies (PUT /subscriptions/:id/veggies) removed.
  // Use selectSeasonalItems or saveSeasonalSelection instead.
};

