// src/features/notifications/services/NotificationService.js
// Handles push notification permissions and FCM registration token submissions
// Uses dynamic requires to bypass expo-notifications import warnings when running in Expo Go

import { Platform } from 'react-native';
import AuthRepository from '../../auth/repositories/AuthRepository';
import { store } from '../../../store';
import { addNotification, markRead } from '../state/notificationSlice';

class NotificationService {
  /**
   * Initialize push notification listeners for foreground and taps.
   */
  static initialize() {
    if (Platform.OS === 'web') return;
    try {
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';
      if (isExpoGo) return;

      const Notifications = require('expo-notifications');

      // Set how notifications are handled when app is in the foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Listen for incoming notifications when the app is foregrounded
      const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const { request } = notification;
        const { identifier, content } = request;
        
        store.dispatch(
          addNotification({
            id: identifier,
            type: content.data?.type || 'info',
            title: content.title || 'Notification',
            body: content.body || '',
            data: content.data || {},
          })
        );
      });

      // Listen for notification interactions (taps)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const { notification } = response;
        const { request } = notification;
        const { identifier } = request;
        
        store.dispatch(markRead(identifier));
      });

      return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      };
    } catch (e) {
      console.warn('[NotificationService] Failed to initialize listeners:', e.message);
      return () => {};
    }
  }
  /**
   * Request push notification permissions and register token with backend.
   */
  static async registerForPushNotifications() {
    try {
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';

      if (isExpoGo) {
        console.log('[NotificationService] Bypassing expo-notifications warning under Expo Go client.');
        
        // Log push token registration with a sandbox token for testing
        try {
          await AuthRepository.registerPushToken('sandbox_expo_go_push_token_mock_123');
        } catch (err) {
          console.warn('[NotificationService] Mock registration fallback failed:', err.message);
        }
        return 'sandbox_expo_go_push_token_mock_123';
      }

      // Dynamically load expo-notifications only for development build / production
      const Notifications = require('expo-notifications');

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Permission not granted for push notifications.');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenResult = await Notifications.getDevicePushTokenAsync({ projectId });
      const token = tokenResult?.data;

      if (token) {
        console.log('[NotificationService] Device Push Token retrieved:', token);
        await AuthRepository.registerPushToken(token);
      }

      return token;
    } catch (e) {
      console.warn('[NotificationService] Registration failed or bypassed:', e.message);
      
      // Fallback/Mock register for testing in sandboxes
      try {
        await AuthRepository.registerPushToken('sandbox_device_push_token_mock_123');
      } catch (err) {
        console.warn('[NotificationService] Mock registration fallback also failed:', err.message);
      }
      return null;
    }
  }
}

export default NotificationService;
