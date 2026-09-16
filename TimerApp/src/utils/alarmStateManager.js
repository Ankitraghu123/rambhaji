import { getItemAsync, setItemAsync, getMemoryItem, setMemoryItem } from './storage';

/**
 * Authoritative State machine for timer alarms:
 * IDLE -> RINGING -> ACKNOWLEDGED -> COMPLETED
 */
export const ALARM_STATE = {
    IDLE: 'IDLE',
    RINGING: 'RINGING',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    COMPLETED: 'COMPLETED',
};

// In-memory registry for synchronous single-source-of-truth
const alarmStates = new Map();
const acknowledgedKeys = new Set();
let isHydrated = false;

/**
 * Generates a globally unique alarm event ID.
 * Format: `alarm_${taskId}_${stage}_${startedAt}`
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @param {string} [startedAt]
 * @returns {string}
 */
export function generateAlarmId(taskOrId, stage = '', startedAt = '') {
    if (!taskOrId) return 'alarm_unknown';
    if (typeof taskOrId === 'object') {
        const taskId = taskOrId.id || '0';
        const st = taskOrId.stage || stage || 'STAGE';
        const start = taskOrId.started_at || taskOrId.created_at || startedAt || '0';
        return `alarm_${taskId}_${st}_${start}`;
    }
    const st = stage || 'STAGE';
    const start = startedAt || '0';
    return `alarm_${taskOrId}_${st}_${start}`;
}

/**
 * Generates all alias keys for an alarm event so checks are resilient
 * against minor timestamp/stage serialization differences.
 */
export function getTaskKeys(taskOrId, stage = '') {
    if (!taskOrId) return [];
    const keys = [];

    let taskId = null;
    let taskStage = stage;
    let startedAt = '';

    if (typeof taskOrId === 'object') {
        taskId = taskOrId.id;
        taskStage = taskOrId.stage || stage;
        startedAt = taskOrId.started_at || taskOrId.created_at || '';
    } else {
        taskId = taskOrId;
    }

    if (taskId) {
        // Most specific compound key
        if (taskStage && startedAt) {
            keys.push(`alarm_${taskId}_${taskStage}_${startedAt}`);
        }
        // Stage-level key (primary idempotency barrier)
        if (taskStage) {
            keys.push(`alarm_${taskId}_${taskStage}`);
            keys.push(`task_${taskId}_${taskStage}`);
        }
        // Task-level key
        keys.push(`alarm_${taskId}`);
        keys.push(`task_${taskId}`);
    }

    return keys;
}

/**
 * Hydrates acknowledged alarms from persistent storage on startup
 */
export async function hydrateAlarmStates() {
    if (isHydrated) return;
    try {
        const stored = await getItemAsync('app_acknowledged_alarms_v3');
        if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list)) {
                list.forEach(k => {
                    acknowledgedKeys.add(k);
                    alarmStates.set(k, ALARM_STATE.ACKNOWLEDGED);
                });
            }
        }
        isHydrated = true;
    } catch (e) {
        console.warn('Hydrate alarm states warning:', e);
    }
}

// Immediately trigger hydration on module load
hydrateAlarmStates();

/**
 * Checks synchronously whether an alarm has already been handled or acknowledged.
 * Once acknowledged, it will NEVER return true for canRing.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @returns {boolean}
 */
export function isAlarmAcknowledged(taskOrId, stage = '') {
    if (!taskOrId) return false;
    const keys = getTaskKeys(taskOrId, stage);
    for (const key of keys) {
        if (acknowledgedKeys.has(key)) return true;
        if (alarmStates.get(key) === ALARM_STATE.ACKNOWLEDGED) return true;
        if (alarmStates.get(key) === ALARM_STATE.COMPLETED) return true;
        if (getMemoryItem(`alarm_ack_${key}`) === 'true') return true;
    }
    return false;
}

/**
 * Determines whether this alarm is allowed to ring.
 * Returns false if already ringing, acknowledged, or completed.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @returns {boolean}
 */
export function canAlarmRing(taskOrId, stage = '') {
    if (!taskOrId) return false;
    if (isAlarmAcknowledged(taskOrId, stage)) return false;

    const keys = getTaskKeys(taskOrId, stage);
    for (const key of keys) {
        const state = alarmStates.get(key);
        if (state === ALARM_STATE.RINGING) return false;
        if (state === ALARM_STATE.ACKNOWLEDGED) return false;
        if (state === ALARM_STATE.COMPLETED) return false;
    }
    return true;
}

/**
 * Atomic check-and-lock: claims the right to trigger acknowledgement for an alarm.
 * If already handled/ringing/acknowledged, logs DUPLICATE EVENT IGNORED and returns false.
 * If eligible, atomically transitions state to RINGING, outputs debug logs, and returns true.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 * @returns {boolean} true if lock successfully claimed, false if duplicate
 */
export function claimAlarmTrigger(taskOrId, stage = '') {
    const eventId = generateAlarmId(taskOrId, stage);
    const keys = getTaskKeys(taskOrId, stage);

    // 1. Check if already acknowledged or completed
    if (isAlarmAcknowledged(taskOrId, stage)) {
        console.log(`[ALARM] ACK ALREADY HANDLED id=${eventId}`);
        console.log(`[ALARM] DUPLICATE EVENT IGNORED id=${eventId}`);
        return false;
    }

    // 2. Check if already actively ringing
    for (const key of keys) {
        const state = alarmStates.get(key);
        if (state === ALARM_STATE.RINGING) {
            console.log(`[ALARM] DUPLICATE EVENT IGNORED (already ringing) id=${eventId}`);
            return false;
        }
    }

    // 3. Atomically claim lock and log lifecycle
    console.log(`[ALARM] COMPLETED id=${eventId}`);
    console.log(`[ALARM] EVENT ID: ${eventId}`);
    console.log(`[ALARM] ACK TRIGGER id=${eventId}`);
    console.log(`[ALARM] RINGING id=${eventId}`);

    keys.forEach(k => {
        alarmStates.set(k, ALARM_STATE.RINGING);
        setMemoryItem(`alarm_state_${k}`, ALARM_STATE.RINGING);
    });

    return true;
}

/**
 * Marks the alarm as currently RINGING.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 */
export function markAlarmRinging(taskOrId, stage = '') {
    const keys = getTaskKeys(taskOrId, stage);
    keys.forEach(k => {
        alarmStates.set(k, ALARM_STATE.RINGING);
        setMemoryItem(`alarm_state_${k}`, ALARM_STATE.RINGING);
    });
}

/**
 * Marks the alarm as ACKNOWLEDGED.
 * Transitions state from RINGING -> ACKNOWLEDGED.
 * Stored in persistent storage (SecureStore) and memory.
 * Will NEVER trigger again for this task + stage.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 */
export async function markAlarmAcknowledged(taskOrId, stage = '') {
    const eventId = generateAlarmId(taskOrId, stage);
    const keys = getTaskKeys(taskOrId, stage);

    console.log(`[ALARM] STOP PRESSED id=${eventId}`);
    console.log(`[ALARM] ACKNOWLEDGED id=${eventId}`);

    keys.forEach(k => {
        alarmStates.set(k, ALARM_STATE.ACKNOWLEDGED);
        acknowledgedKeys.add(k);
        setMemoryItem(`alarm_ack_${k}`, 'true');
        setMemoryItem(`alarm_state_${k}`, ALARM_STATE.ACKNOWLEDGED);
    });

    try {
        const keysArr = Array.from(acknowledgedKeys).slice(-200);
        await setItemAsync('app_acknowledged_alarms_v3', JSON.stringify(keysArr));
    } catch (e) {
        console.warn('Error saving acknowledged alarms to SecureStore:', e);
    }
}

/**
 * Marks the alarm as COMPLETED.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 */
export async function markAlarmCompleted(taskOrId, stage = '') {
    await markAlarmAcknowledged(taskOrId, stage);
    const keys = getTaskKeys(taskOrId, stage);
    keys.forEach(k => {
        alarmStates.set(k, ALARM_STATE.COMPLETED);
    });
}

/**
 * Resets a ringing state only if cancelled without acknowledging.
 * @param {Object|number|string} taskOrId
 * @param {string} [stage]
 */
export function resetAlarmRinging(taskOrId, stage = '') {
    const keys = getTaskKeys(taskOrId, stage);
    keys.forEach(k => {
        if (alarmStates.get(k) === ALARM_STATE.RINGING) {
            alarmStates.set(k, ALARM_STATE.IDLE);
        }
    });
}

/**
 * Clears state for a task when starting a completely new stage.
 * @param {number|string} taskId
 * @param {string} newStage
 */
export async function clearAlarmForNewStage(taskId, newStage = '') {
    if (!taskId) return;
    const keysToClear = [
        `alarm_${taskId}_${newStage}`,
        `task_${taskId}_${newStage}`,
    ];
    keysToClear.forEach(k => {
        alarmStates.delete(k);
        acknowledgedKeys.delete(k);
        setMemoryItem(`alarm_ack_${k}`, null);
        setMemoryItem(`alarm_state_${k}`, null);
    });
}
