import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { checkAndRequestAlarmPermissions, isNotifeeAvailable, markAlarmAcknowledged, stopAlarm } from '../src/utils/notificationHelper';
import { acknowledgeAlarm } from '../src/api/workerTask.api';

let notifee = null;
try {
  const notifyKit = require('react-native-notify-kit');
  notifee = notifyKit.default || notifyKit;
} catch (_e) {}

// Background handler for Android lock screen / notification actions
if (isNotifeeAvailable() && notifee && typeof notifee.onBackgroundEvent === 'function') {
  try {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { notification, pressAction } = detail;
      if (pressAction?.id === 'stop-alarm') {
        const taskId = notification?.data?.taskId;
        const stage = notification?.data?.stage;
        if (taskId) {
          markAlarmAcknowledged(taskId, stage);
          await stopAlarm(taskId);
          try {
            await acknowledgeAlarm(taskId);
          } catch (e) {
            console.warn('Background acknowledgeAlarm error:', e);
          }
        } else if (notification?.id) {
          await notifee.cancelNotification(notification.id);
        }
      }
    });
  } catch (_e) {}
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Configure audio mode so alarm sound plays loudly even if device is in silent mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    }).catch((err) => console.warn('Audio.setAudioModeAsync error:', err));

    // Set up high-priority alarm notification channels for Android
    if (Platform.OS === 'android') {
      const setupChannels = async () => {
        // Default timer-alarm channel
        await Notifications.setNotificationChannelAsync('timer-alarm-channel', {
          name: 'Timer Finished Alarm',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'alarm1',
          vibrationPattern: [0, 500, 250, 500, 250, 500],
          lightColor: '#273AF8',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
            flags: { enforceAudibility: true },
          },
        });

        // Worker personalized & preset alarm channels 1-8
        for (let i = 1; i <= 8; i++) {
          await Notifications.setNotificationChannelAsync(`worker-channel-${i}`, {
            name: `Worker ${i} Alarm`,
            importance: Notifications.AndroidImportance.MAX,
            sound: `alarm${i}`,
            vibrationPattern: [0, 500, 250, 500, 250, 500],
            lightColor: '#273AF8',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage.ALARM,
              contentType: Notifications.AndroidAudioContentType.SONIFICATION,
              flags: { enforceAudibility: true },
            },
          });

          await Notifications.setNotificationChannelAsync(`timer-alarm-channel-alarm${i}`, {
            name: `Timer Alarm ${i}`,
            importance: Notifications.AndroidImportance.MAX,
            sound: `alarm${i}`,
            vibrationPattern: [0, 500, 250, 500, 250, 500],
            lightColor: '#273AF8',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage.ALARM,
              contentType: Notifications.AndroidAudioContentType.SONIFICATION,
              flags: { enforceAudibility: true },
            },
          });
        }
      };
      setupChannels();
    }

    // Request permissions (POST_NOTIFICATIONS, exact alarms, full screen intent)
    checkAndRequestAlarmPermissions();

    // Listen for Expo notification responses
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response?.notification?.request?.content?.data;
        if (data?.batchId) {
          router.replace({ pathname: '/activetask', params: { batchId: data.batchId } });
        } else {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Notification navigation error:', err);
      }
    });

    // Listen for notifee foreground events (e.g. tapping STOP ALARM or notification press)
    let unsubscribeNotifee = null;
    if (isNotifeeAvailable() && notifee && typeof notifee.onForegroundEvent === 'function') {
      try {
        unsubscribeNotifee = notifee.onForegroundEvent(async ({ type, detail }) => {
          const { notification, pressAction } = detail;
          if (pressAction?.id === 'stop-alarm') {
            const taskId = notification?.data?.taskId;
            const stage = notification?.data?.stage;
            if (taskId) {
              markAlarmAcknowledged(taskId, stage);
              await stopAlarm(taskId);
              try {
                await acknowledgeAlarm(taskId);
              } catch (e) {
                console.warn('Foreground acknowledgeAlarm error:', e);
              }
            } else if (notification?.id) {
              await notifee.cancelNotification(notification.id);
            }
            // Acknowledge completes -> navigate directly to Dashboard, avoiding duplicate screen stack
            router.replace('/dashboard');
          }
        });
      } catch (_e) {}
    }

    return () => {
      responseSubscription.remove();
      if (unsubscribeNotifee) {
        unsubscribeNotifee();
      }
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Login' }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false, title: 'Dashboard', gestureEnabled: false }} />
      <Stack.Screen name="activetask" options={{ headerShown: false, title: 'Active Task', gestureEnabled: false }} />
    </Stack>
  );
}
