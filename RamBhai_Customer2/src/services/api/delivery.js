import apiClient from './client';

export const deliveryApi = {
  requestReturn: async (formData) => {
    const { useAppStore } = require('../../store/UseAppStore');
    const token = useAppStore.getState().token;
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://rambhaji.backend.shreenari.com/api';
    
    const response = await fetch(`${baseUrl}/return-item`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  },
  getDeliveryHistory: async () => {
    const response = await apiClient.get('/delivery-history');
    return response.data;
  }
  // Note: Legacy getDeliveries (GET /deliveries), pauseDelivery, resumeDelivery removed.
  // These endpoints don't exist in the spec.
  // For pausing/restarting, use subscriptionsApi.pauseSubscription / restartSubscription instead.
};

