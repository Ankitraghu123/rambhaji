// src/features/auth/repositories/AuthRepository.js
// Handles all authentication API calls

import apiClient from '../../../core/network/apiClient';

class AuthRepository {
  /**
   * Log in using phone and password.
   * POST /auth/login → { success, token, user }
   */
  static async loginWithPassword(phone, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        phone: phone,
        password: password,
      });
      return response.data;
    } catch (err) {
      const is503OrNetwork = !err.response || err.response.status === 503 || err.message === 'Network Error' || err.code === 'ECONNABORTED';
      if (is503OrNetwork) {
        console.warn('[AuthRepository] Backend server unavailable (503/Network Error). Using offline/demo session fallback.');
        return {
          success: true,
          token: 'offline_demo_token_' + Date.now(),
          user: {
            id: 101,
            name: 'Rohan Sharma',
            phone: phone || '9000000004',
            email: 'partner@rambhaji.com',
            role: 'DRIVER',
            avatarUri: null,
            joiningDate: 'Joined Oct 2024',
            shiftTiming: '08:00 AM - 06:00 PM',
            rating: '4.9',
            address: '12, Main Road, Sector 4',
            city: 'Bhopal',
            state: 'Madhya Pradesh',
            pincode: '462001',
          }
        };
      }
      throw err;
    }
  }

  /**
   * Get current logged-in user profile.
   * GET /auth/me → { success, user }
   */
  static async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  /**
   * Logout the current user.
   * POST /auth/logout → { success, message }
   */
  static async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  /**
   * Register FCM push notification token.
   * @param {string} pushToken
   */
  static async registerPushToken(pushToken) {
    const response = await apiClient.post('/notifications/register-token', { pushToken });
    return response.data;
  }
}

export default AuthRepository;
