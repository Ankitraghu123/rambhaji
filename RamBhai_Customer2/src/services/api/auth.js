import apiClient from './client';

export const authApi = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  verifyRegistrationOtp: async (data) => {
    const response = await apiClient.post('/auth/verify-registration-otp', data);
    return response.data;
  },
  resendOtp: async (data) => {
    const response = await apiClient.post('/auth/resend-otp', data);
    return response.data;
  },
  forgotPassword: async (data) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },
  verifyForgotPasswordOtp: async (data) => {
    const response = await apiClient.post('/auth/verify-forgot-password-otp', data);
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },
  updateDislikes: async (data) => {
    const response = await apiClient.put('/auth/me/dislikes', data);
    return response.data;
  }
};
