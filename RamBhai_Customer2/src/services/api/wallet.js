import apiClient from './client';

export const walletApi = {
  getWalletBalance: async () => {
    const response = await apiClient.get('/wallet');
    return response.data;
  },
  addFunds: async (amount, payment_method = 'razorpay') => {
    const response = await apiClient.post('/add-funds', { amount, payment_method });
    return response.data;
  },
  getTransactionHistory: async () => {
    const response = await apiClient.get('/wallet/transactions');
    return response.data;
  }
};
