import apiClient from './client';

export const retailApi = {
  createOrder: async (data) => {
    const response = await apiClient.post('/retail', data);
    return response.data;
  },
  getOrders: async () => {
    const response = await apiClient.get('/retail');
    return response.data;
  }
};
