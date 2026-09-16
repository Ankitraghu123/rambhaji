import apiClient from './client';

export const paymentApi = {
  /**
   * Initiate a PhonePe payment.
   * @param {Object} data - Payment request body
   * 
   * For package payment:
   *   { type: 'package', package_id: 1, billing_type: 'monthly', address_id: 1 }
   * 
   * For retail payment:
   *   { type: 'retail', address_id: 1, items: [{ product_id: 1, quantity: 2 }] }
   *   (quantity in kg for gm/ml products)
   * 
   * @returns {{ success: boolean, redirectUrl: string }}
   */
  initiatePhonePe: async (data) => {
    const response = await apiClient.post('/payment/phonepe/initiate', data);
    return response.data;
  },

  /**
   * Check PhonePe payment status.
   * @param {string} txnId - Transaction ID from the redirect URL
   * @returns {{ success: boolean, status: 'success'|'failed'|'pending', message: string }}
   */
  checkPaymentStatus: async (txnId, simulated = true) => {
    const url = `/payment/phonepe/status/${txnId}${simulated ? '?simulated=true' : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  // Legacy Razorpay methods kept for backward compatibility during migration
  // TODO: Remove once PhonePe migration is confirmed complete
  createOrder: async (amount) => {
    const response = await apiClient.post('/payments/create-order', { amount });
    return response.data;
  },
  verifyPayment: async (data) => {
    const response = await apiClient.post('/payments/verify', data);
    return response.data;
  }
};

