import apiClient from './client';

export const batchesApi = {
  getBatches: async () => {
    const response = await apiClient.get('/user/batches');
    return response.data;
  },
};
