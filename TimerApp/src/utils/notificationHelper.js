import * as Notifications from 'expo-notifications';
import * as SecureStore from './storage';
import { Platform, Alert } from 'react-native';
import * as AlarmStateManager from './alarmStateManager';

let notifee = null;
let AndroidImportance = null;
let AndroidVisibility = null;
let AndroidCategory = null;
let TriggerType = null;
let AlarmType = null;
let AndroidNotificationSetting = null;
let AndroidLaunchActivityFlag = null;

try {
    const notifyKit = require('react-native-notify-kit');
    notifee = notifyKit.default || notifyKit;
    AndroidImportance = notifyKit.AndroidImportance;
    AndroidVisibility = notifyKit.AndroidVisibility;
    AndroidCategory = notifyKit.AndroidCategory;
    TriggerType = notifyKit.TriggerType;
    AlarmType = notifyKit.AlarmType;
    AndroidNotificationSetting = notifyKit.AndroidNotificationSetting;
    AndroidLaunchActivityFlag = notifyKit.AndroidLaunchActivityFlag;
} catch (_e) {
    // Falls back gracefully if running in standard Expo Go
}

/**
 * Checks whether Notifee's native TurboModule is actually available in the current runtime binary.
 * Returns false in Expo Go (preventing Invariant Violation crashes), and true in custom Dev/EAS builds.
 */
export function isNotifeeAvailable() {
    if (Platform.OS !== 'android') return false;
    try {
        const { TurboModuleRegistry, NativeModules } = require('react-native');
        if (TurboModuleRegistry && typeof TurboModuleRegistry.get === 'function') {
            return !!TurboModuleRegistry.get('NotifeeApiModule');
        }
        return !!(NativeModules && NativeModules.NotifeeApiModule);
    } catch (_e) {
        return false;
    }
}

// ─── ALARM RINGTONE PRESETS ───────────────────────────────────────────────────
export const ALARM_RINGTONES = [
    { id: 'alarm1', key: 'alarm1', name: 'Default Alarm', hindiName: 'डिफ़ॉल्ट अलार्म', isDefault: true, desc: 'Standard dual-tone alert (मानक दोहरी-टोन बीप)' },
    { id: 'alarm2', key: 'alarm2', name: 'Classic Bell', hindiName: 'क्लासिक बेल', isDefault: false, desc: 'Mechanical twin-bell ring (पारंपरिक घंटी)' },
    { id: 'alarm3', key: 'alarm3', name: 'Digital Chime', hindiName: 'डिजिटल चाइम', isDefault: false, desc: 'Electronic multi-beep chime (डिजिटल बीप)' },
    { id: 'alarm4', key: 'alarm4', name: 'Gentle Melodic', hindiName: 'धीमा मेलोडिक', isDefault: false, desc: 'Soft melodic arpeggio (शांत मधुर टोन)' },
    { id: 'alarm5', key: 'alarm5', name: 'Loud Siren', hindiName: 'तेज़ सायरन', isDefault: false, desc: 'High-intensity urgent siren (तेज़ चेतावनी)' },
    { id: 'alarm6', key: 'alarm6', name: 'Resonant Bell', hindiName: 'गूंजती घंटी', isDefault: false, desc: 'Clear temple bell chime (स्पष्ट मंदिर घंटी)' },
    { id: 'alarm7', key: 'alarm7', name: 'Radar Pulse', hindiName: 'राडार पल्स', isDefault: false, desc: 'Rapid repetitive beep (तेज़ पल्स बीप)' },
    { id: 'alarm8', key: 'alarm8', name: 'Emergency Alarm', hindiName: 'इमरजेंसी अलार्म', isDefault: false, desc: 'Fast emergency warble tone (त्वरित आपातकालीन)' },
];

/**
 * Returns the require() audio source for any of the 8 bundled alarm ringtones.
 */
export function getRingtoneAudioModule(soundKey) {
    switch (soundKey) {
        case 'alarm1': return require('../../assets/sounds/alarm1.wav');
        case 'alarm2': return require('../../assets/sounds/alarm2.wav');
        case 'alarm3': return require('../../assets/sounds/alarm3.wav');
        case 'alarm4': return require('../../assets/sounds/alarm4.wav');
        case 'alarm5': return require('../../assets/sounds/alarm5.wav');
        case 'alarm6': return require('../../assets/sounds/alarm6.wav');
        case 'alarm7': return require('../../assets/sounds/alarm7.wav');
        case 'alarm8': return require('../../assets/sounds/alarm8.wav');
        default: return require('../../assets/sounds/alarm1.wav');
    }
}

/**
 * Gets human-readable name of any alarm ringtone key.
 */
export function getRingtoneName(soundKey) {
    const found = ALARM_RINGTONES.find(r => r.key === soundKey);
    return found ? found.name : 'Default Alarm';
}

/**
 * Gets the user's currently selected alarm ringtone key (e.g. 'alarm1' ... 'alarm8').
 * Survives app restarts via persistent storage.
 */
export async function getSelectedRingtoneKey() {
    try {
        const saved = await SecureStore.getItemAsync('selected_alarm_ringtone');
        if (saved && ALARM_RINGTONES.some(r => r.key === saved)) {
            return saved;
        }
        return 'alarm1';
    } catch {
        return 'alarm1';
    }
}

/**
 * Saves the selected alarm ringtone key to persistent storage.
 */
export async function setSelectedRingtoneKey(ringtoneKey) {
    try {
        await SecureStore.setItemAsync('selected_alarm_ringtone', ringtoneKey);
    } catch (e) {
        console.error('Failed to save selected ringtone:', e);
    }
}

// In-memory cache of active scheduled alarm targets to prevent duplicate schedule thrashing
const activeAlarmsCache = new Map();

/**
 * Gets the worker sound index (1-5).
 */
export async function getWorkerSoundIndex() {
    try {
        const userId = (await SecureStore.getItemAsync('user_id')) || '1';
        let numId = parseInt(userId, 10) || 1;
        let soundIdx = numId % 5;
        if (soundIdx === 0) soundIdx = 5;
        return soundIdx;
    } catch {
        return 1;
    }
}

/**
 * Checks and requests required Android alarm and notification permissions:
 * - POST_NOTIFICATIONS (Android 13+)
 * - SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM (Android 12+)
 * - USE_FULL_SCREEN_INTENT (Android 14+)
 */
export async function checkAndRequestAlarmPermissions() {
    try {
        // 1. Expo Notification permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // 2. Notifee Native permission & Exact Alarm check
        if (isNotifeeAvailable() && notifee && Platform.OS === 'android') {
            try {
                await notifee.requestPermission();
                const settings = await notifee.getNotificationSettings();

                // Check exact alarm permission on Android 12+ (API 31+)
                if (
                    AndroidNotificationSetting &&
                    settings.android &&
                    settings.android.alarm !== undefined &&
                    settings.android.alarm !== AndroidNotificationSetting.ENABLED
                ) {
                    Alert.alert(
                        'सटीक अलार्म अनुमति आवश्यक है',
                        'जब आपका फोन लॉक या स्लीप मोड में हो, तब टाइमर सही समय पर स्क्रीन जगाकर बजे, इसके लिए कृपया TimerApp के लिए "अलार्म और रिमाइंडर" की अनुमति सक्षम करें।',
                        [
                            { text: 'बाद में', style: 'cancel' },
                            {
                                text: 'अभी सक्षम करें',
                                onPress: async () => {
                                    try {
                                        await notifee.openAlarmPermissionSettings();
                                    } catch (err) {
                                        console.warn('Failed to open alarm settings:', err);
                                    }
                                },
                            },
                        ]
                    );
                }
            } catch (err) {
                console.warn('Notifee permission check error:', err);
            }
        }

        return finalStatus === 'granted';
    } catch (e) {
        console.error('Error requesting notification permissions:', e);
        return false;
    }
}

/**
 * Schedules an exact Android AlarmManager alarm clock that wakes up the device,
 * displays over the lock screen with full-screen intent, and plays the loud alarm sound at exactly 00:00.
 *
 * @param {Object} task - The task object containing id, stage, Product, batch_id
 * @param {number} remainingSeconds - Seconds until timer reaches 00:00
 */
export async function scheduleTaskAlarm(task, remainingSeconds) {
    // Guard 1: Must be a valid task with ID
    if (!task || !task.id) return null;

    // Guard 2: Must be in RUNNING state with started_at timestamp
    if (task.status !== 'RUNNING' || !task.started_at) {
        return null;
    }

    // Guard 3: Must have a strictly positive, valid remaining duration
    const secs = Math.round(Number(remainingSeconds) || 0);
    if (isNaN(secs) || secs <= 0) {
        return null;
    }

    try {
        const targetTimestamp = Date.now() + secs * 1000;
        const targetDate = new Date(targetTimestamp);
        const taskIdentifier = `task-${task.id}`;

        // Guard 4: Target must be strictly in the future (minimum 1 second)
        if (targetTimestamp <= Date.now() + 500) {
            return null;
        }

        // Deduplication Guard: Check if an active alarm is already scheduled for this task
        // with the same target timestamp (within 2000ms drift tolerance).
        // This prevents re-scheduling thrash from repeated background polling.
        const existingTarget = activeAlarmsCache.get(task.id);
        if (existingTarget && Math.abs(existingTarget - targetTimestamp) < 2000) {
            return taskIdentifier;
        }

        // Cancel any previous scheduled notification for this task first
        await cancelTaskAlarm(task.id);

        // Update deduplication cache
        activeAlarmsCache.set(task.id, targetTimestamp);

        // Persist target end timestamp for recovery/verification across app kills
        try {
            await SecureStore.setItemAsync(`alarm_target_${task.id}`, targetTimestamp.toString());
        } catch {}

        // Use selected ringtone
        const soundKey = await getSelectedRingtoneKey();
        const channelId = `timer-alarm-channel-${soundKey}`;
        const ringtoneObj = ALARM_RINGTONES.find(r => r.key === soundKey) || ALARM_RINGTONES[0];

        const vegName = task.Product?.name || 'सब्जी';
        const bodyText = task.Product?.hindi_name
            ? `${task.Product.hindi_name} (${vegName}) - ${task.stage} स्टेज पूरा हो चुका है!`
            : `${vegName} - ${task.stage} स्टेज पूरा हो चुका है!`;

        let nativeScheduled = false;

        // 1. Android Native AlarmManager via react-native-notify-kit (Real Alarm Clock experience)
        if (isNotifeeAvailable() && notifee && AndroidImportance) {
            try {
                // Ensure the high-priority alarm channel exists with the chosen ringtone sound
                await notifee.createChannel({
                    id: channelId,
                    name: `Timer Alarm (${ringtoneObj.name})`,
                    sound: soundKey,
                    importance: AndroidImportance.HIGH,
                    visibility: AndroidVisibility ? AndroidVisibility.PUBLIC : 1,
                    bypassDnd: true,
                    vibration: true,
                    vibrationPattern: [0, 500, 250, 500, 250, 500],
                    lights: true,
                    lightColor: '#273AF8',
                });

                // Use AlarmType.SET_ALARM_CLOCK (Highest Android priority, bypasses Doze, wakes CPU and screen)
                const trigger = {
                    type: TriggerType.TIMESTAMP,
                    timestamp: targetTimestamp,
                    alarmManager: {
                        type: AlarmType ? AlarmType.SET_ALARM_CLOCK : undefined,
                        allowWhileIdle: true,
                    },
                };

                // Full-screen launch flags: NEW_TASK (2) | CLEAR_TOP (4) | SINGLE_TOP (1)
                const launchFlags = [
                    AndroidLaunchActivityFlag ? AndroidLaunchActivityFlag.NEW_TASK : 2,
                    AndroidLaunchActivityFlag ? AndroidLaunchActivityFlag.CLEAR_TOP : 4,
                    AndroidLaunchActivityFlag ? AndroidLaunchActivityFlag.SINGLE_TOP : 1,
                ];

                await notifee.createTriggerNotification(
                    {
                        id: taskIdentifier,
                        title: 'स्टेज पूरा हो गया!',
                        body: bodyText,
                        data: {
                            taskId: String(task.id),
                            batchId: String(task.batch_id || ''),
                            stage: String(task.stage || ''),
                            soundKey: String(soundKey),
                        },
                        android: {
                            channelId: channelId,
                            importance: AndroidImportance.HIGH,
                            category: AndroidCategory ? AndroidCategory.ALARM : 'alarm',
                            visibility: AndroidVisibility ? AndroidVisibility.PUBLIC : 1,
                            sound: soundKey,
                            loopSound: true, // Insistent alarm audio looping until user stops
                            lightUpScreen: true, // Acquires FULL_WAKE_LOCK + ACQUIRE_CAUSES_WAKEUP to turn on display
                            autoCancel: false,
                            ongoing: true,
                            color: '#273AF8',
                            pressAction: {
                                id: 'default',
                                launchActivity: 'default',
                                launchActivityFlags: launchFlags,
                            },
                            fullScreenAction: {
                                id: 'default',
                                launchActivity: 'default',
                                launchActivityFlags: launchFlags,
                            },
                            actions: [
                                {
                                    title: 'अलार्म बंद करें',
                                    pressAction: {
                                        id: 'stop-alarm',
                                        launchActivity: true,
                                        launchActivityFlags: launchFlags,
                                    },
                                },
                            ],
                        },
                    },
                    trigger
                );
                nativeScheduled = true;
            } catch (notifyKitErr) {
                console.warn('Native notify-kit scheduling error, falling back to Expo notifications:', notifyKitErr);
            }
        }

        // 2. Expo Notifications (Fallback / Expo Go compatible)
        try {
            await Notifications.scheduleNotificationAsync({
                identifier: taskIdentifier,
                content: {
                    title: 'स्टेज पूरा हो गया!',
                    body: bodyText,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    vibrate: [0, 500, 250, 500, 250, 500],
                    color: '#273AF8',
                    autoDismiss: false,
                    sticky: true,
                    channelId: channelId,
                    data: {
                        taskId: task.id,
                        batchId: task.batch_id,
                        stage: task.stage,
                    },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: targetDate,
                    channelId: channelId,
                },
            });
        } catch (expoErr) {
            if (!nativeScheduled) {
                console.error('Failed to schedule alarm notification via Expo:', expoErr);
            }
        }

        return taskIdentifier;
    } catch (e) {
        console.error('Failed to schedule OS task alarm notification:', e);
        return null;
    }
}

/**
 * Cancels a scheduled task alarm (called on Pause, Complete, Restart, or Reset)
 * @param {number|string} taskId
 */
export async function cancelTaskAlarm(taskId) {
    if (!taskId) return;
    const taskIdentifier = `task-${taskId}`;

    // Clear deduplication cache entry
    activeAlarmsCache.delete(Number(taskId));
    activeAlarmsCache.delete(String(taskId));

    try {
        await SecureStore.deleteItemAsync(`alarm_target_${taskId}`);
    } catch {}

    // Cancel in react-native-notify-kit
    if (isNotifeeAvailable() && notifee) {
        try {
            await notifee.cancelNotification(taskIdentifier);
            await notifee.cancelTriggerNotification(taskIdentifier);
        } catch {}
    }

    // Cancel in Expo Notifications
    try {
        await Notifications.cancelScheduledNotificationAsync(taskIdentifier);
    } catch {}
}

/**
 * Dismisses all active alarm notifications currently visible in the notification shade
 */
export async function dismissAllAlarms() {
    if (isNotifeeAvailable() && notifee) {
        try {
            await notifee.cancelAllNotifications();
        } catch {}
    }
    try {
        await Notifications.dismissAllNotificationsAsync();
    } catch {}
}

/**
 * Cancels all scheduled notifications across the app (called on Logout)
 */
export async function cancelAllTaskAlarms() {
    activeAlarmsCache.clear();
    if (isNotifeeAvailable() && notifee) {
        try {
            await notifee.cancelAllNotifications();
            await notifee.cancelTriggerNotifications();
        } catch {}
    }
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
}

/**
 * Completely stops an active ringing alarm:
 * Cancels notification, trigger, and clears persisted alarm key.
 * @param {number|string} taskId
 */
export async function stopAlarm(taskId) {
    await cancelTaskAlarm(taskId);
    await dismissAllAlarms();
}

// ─── ALARM ACKNOWLEDGEMENT DEDUPLICATION TRACKER ────────────────────────────
export { AlarmStateManager };

/**
 * Normalizes task or taskId + stage into an object for AlarmStateManager
 */
function normalizeTaskObj(taskOrId, stage = '') {
    if (!taskOrId) return null;
    if (typeof taskOrId === 'object') return taskOrId;
    return { id: taskOrId, stage };
}

/**
 * Marks an alarm as acknowledged so it cannot trigger duplicate popups.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 */
export async function markAlarmAcknowledged(taskOrId, stage = '') {
    const taskObj = normalizeTaskObj(taskOrId, stage);
    if (!taskObj) return;
    await AlarmStateManager.markAlarmAcknowledged(taskObj);
}

/**
 * Checks synchronously whether an alarm has already been acknowledged.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @returns {boolean}
 */
export function isAlarmAcknowledged(taskOrId, stage = '') {
    const taskObj = normalizeTaskObj(taskOrId, stage);
    if (!taskObj) return false;
    return AlarmStateManager.isAlarmAcknowledged(taskObj);
}

/**
 * Checks whether an alarm is allowed to ring (not already ringing, acknowledged, or completed)
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @returns {boolean}
 */
export function canAlarmRing(taskOrId, stage = '') {
    const taskObj = normalizeTaskObj(taskOrId, stage);
    if (!taskObj) return false;
    return AlarmStateManager.canAlarmRing(taskObj);
}

/**
 * Marks an alarm as currently ringing
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 */
export function markAlarmRinging(taskOrId, stage = '') {
    const taskObj = normalizeTaskObj(taskOrId, stage);
    if (!taskObj) return;
    AlarmStateManager.markAlarmRinging(taskObj);
}

/**
 * Atomically checks eligibility and claims the alarm trigger lock.
 * Returns true if claimed, false if already handled/ringing/acknowledged.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @returns {boolean}
 */
export function claimAlarmTrigger(taskOrId, stage = '') {
    const taskObj = normalizeTaskObj(taskOrId, stage);
    if (!taskObj) return false;
    return AlarmStateManager.claimAlarmTrigger(taskObj);
}

export function generateAlarmId(taskOrId, stage = '') {
    const taskObj = normalizeTaskObj(taskOrId, stage);
    return AlarmStateManager.generateAlarmId(taskObj);
}

/**
 * Clears acknowledged state for a task when starting a new stage or reset.
 * @param {number|string} taskId
 * @param {string} [stage]
 */
export async function clearAlarmAcknowledged(taskId, stage = '') {
    if (!taskId) return;
    await AlarmStateManager.clearAlarmForNewStage(taskId, stage);
}
