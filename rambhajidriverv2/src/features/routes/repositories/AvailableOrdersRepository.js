// src/features/routes/repositories/AvailableOrdersRepository.js
// Fetches driver-claimable orders from GET /available-orders with MMKV offline cache fallback

import apiClient from '../../../core/network/apiClient';
import { secureStorage, getJSON, setJSON } from '../../../core/storage/mmkvInstances';

const AVAILABLE_CACHE_KEY = 'available_orders_cache';

class AvailableOrdersRepository {
  /**
   * Fetch all available (unclaimed) orders from API.
   * GET /available-orders → { success, orders: [...] }
   * Falls back to local MMKV cache when offline.
   */
  static async getAvailableOrders(force = false) {
    const config = {};
    if (force) {
      config.headers = { 'Cache-Control': 'no-cache' };
    }
    try {
      const response = await apiClient.get('/available-orders', config);
      const data = response.data;
      setJSON(secureStorage, AVAILABLE_CACHE_KEY, data);
      return data;
    } catch (err) {
      console.warn('[AvailableOrdersRepository] API fetch failed, trying cached available orders:', err?.message);
      const cached = getJSON(secureStorage, AVAILABLE_CACHE_KEY);
      if (cached) {
        return cached;
      }
      return { success: true, schedules: [], retailOrders: [] };
    }
  }

  /**
   * Claim/accept an available order.
   * PUT /accept-order -> { success: true }
   */
  static async claimOrder(orderId, type) {
    const mappedType = type === 'schedule' ? 'package' : 'retail';
    const response = await apiClient.put('/accept-order', {
      type: mappedType,
      id: orderId,
    });
    return response.data;
  }
}

export default AvailableOrdersRepository;
