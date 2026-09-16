import apiClient from './client';

export const referralApi = {
  getMyCode: async () => {
    const response = await apiClient.get('/referral/my-code');
    return response.data;
  },
};
