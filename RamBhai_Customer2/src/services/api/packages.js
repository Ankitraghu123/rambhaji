import apiClient from './client';

export const packagesApi = {
  getPackages: async () => {
    const response = await apiClient.get('/packages');
    return response.data;
  },
  getPackageById: async (id) => {
    const response = await apiClient.get(`/packages/${id}`);
    return response.data;
  }
};
