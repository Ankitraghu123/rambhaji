import apiClient from './client';

export const addressesApi = {
  createAddress: async (data) => {
    const response = await apiClient.post('/addresses', data);
    return response.data;
  },
  getAddresses: async () => {
    const response = await apiClient.get('/addresses');
    return response.data;
  },
  updateAddress: async (id, data) => {
    const response = await apiClient.put(`/addresses/${id}`, data);
    return response.data;
  },
  deleteAddress: async (id) => {
    const response = await apiClient.delete(`/addresses/${id}`);
    return response.data;
  },
  setDefaultAddress: async (id) => {
    const response = await apiClient.patch(`/addresses/${id}/default`);
    return response.data;
  }
};
