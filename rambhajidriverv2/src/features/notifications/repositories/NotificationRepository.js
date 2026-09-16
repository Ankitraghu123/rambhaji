// src/features/notifications/repositories/NotificationRepository.js
// Handles fetching and marking notifications as read via API

import apiClient from '../../../core/network/apiClient';

class NotificationRepository {
  /**
   * Fetch all notifications for the authenticated user.
   * GET /notifications
   */
  static async getNotifications() {
    const response = await apiClient.get('/notifications');
    return response.data;
  }

  /**
   * Mark a specific notification as read.
   * PATCH /notifications/:id/mark-read
   */
  static async markAsRead(id) {
    const response = await apiClient.patch(`/notifications/${id}/mark-read`);
    return response.data;
  }
}

export default NotificationRepository;
