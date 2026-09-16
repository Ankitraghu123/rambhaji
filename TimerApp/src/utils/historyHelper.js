import * as SecureStore from './storage';

const HISTORY_STORAGE_KEY = 'timer_history_records_v1';
const listeners = new Set();

/**
 * Format a date object/ISO string into a readable string: "11 Sep 2026"
 */
export function formatHistoryDate(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format a date object/ISO string into 12-hour time: "12:30 PM"
 */
export function formatHistoryTime(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format duration in seconds into clean readable string: "15 min", "45 sec", "1h 20m"
 */
export function formatDuration(seconds) {
    const sec = Math.max(0, Math.round(Number(seconds) || 0));
    if (sec <= 0) return '0 min';
    if (sec < 60) return `${sec} sec`;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hr`;
    }
    if (remSec === 0) return `${mins} min`;
    return `${mins}m ${remSec}s`;
}

/**
 * Retrieves all stored timer history entries (newest first).
 * Excludes cancelled timers so only valid completed records are shown.
 */
export async function getTimerHistory() {
    try {
        const data = await SecureStore.getItemAsync(HISTORY_STORAGE_KEY);
        if (!data) return [];
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        // Filter out any cancelled records
        const clean = parsed.filter(item => item.status !== 'Cancelled');
        if (clean.length !== parsed.length) {
            await SecureStore.setItemAsync(HISTORY_STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
    } catch (e) {
        console.error('Failed to load timer history:', e);
        return [];
    }
}

/**
 * Adds a new timer record to persistent history.
 * Cancelled timers are ignored and never written to history.
 */
export async function addHistoryEntry({
    task,
    taskId,
    taskName,
    productName,
    stage,
    status = 'Completed',
    startedAt,
    finishedAt,
    durationSeconds,
}) {
    // If status is cancelled, do not write to history
    if (status === 'Cancelled') {
        return null;
    }

    try {
        const endIso = finishedAt || new Date().toISOString();
        const startIso = startedAt || task?.started_at || endIso;

        // Resolve clean product & task title
        const product = productName || task?.Product?.name || task?.Product?.hindi_name || 'Timer';
        const taskStage = stage || task?.stage || '';
        
        let resolvedTitle = taskName;
        if (!resolvedTitle) {
            if (taskStage) {
                const stageFormatted = taskStage.charAt(0).toUpperCase() + taskStage.slice(1).toLowerCase().replace(/_/g, ' ');
                resolvedTitle = `${product} ${stageFormatted}`;
            } else {
                resolvedTitle = product;
            }
        }

        // Calculate duration if not provided
        let calcDuration = durationSeconds;
        if (!calcDuration && startIso && endIso) {
            const s = new Date(startIso).getTime();
            const e = new Date(endIso).getTime();
            if (!isNaN(s) && !isNaN(e) && e >= s) {
                calcDuration = Math.round((e - s) / 1000);
            }
        }
        if (!calcDuration && task?.duration_seconds) {
            calcDuration = Number(task.duration_seconds);
        }
        if (!calcDuration) {
            calcDuration = 0;
        }

        const newEntry = {
            id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            taskId: taskId || task?.id || null,
            taskName: resolvedTitle,
            productName: product,
            stage: taskStage,
            status: status === 'Cancelled' ? 'Cancelled' : 'Completed',
            startedAt: startIso,
            finishedAt: endIso,
            date: formatHistoryDate(endIso),
            startTime: formatHistoryTime(startIso),
            endTime: formatHistoryTime(endIso),
            durationFormatted: formatDuration(calcDuration),
            durationSeconds: calcDuration,
            timestamp: new Date(endIso).getTime(),
        };

        const existing = await getTimerHistory();

        // Prevent immediate duplicate (within 3 seconds for same task and status)
        const isDuplicate = existing.some(item => 
            item.taskId && 
            item.taskId === newEntry.taskId && 
            item.status === newEntry.status &&
            Math.abs(item.timestamp - newEntry.timestamp) < 4000
        );

        if (isDuplicate) {
            return newEntry;
        }

        // Prepend and cap at 200 items
        const updated = [newEntry, ...existing].slice(0, 200);
        await SecureStore.setItemAsync(HISTORY_STORAGE_KEY, JSON.stringify(updated));

        // Notify in-memory listeners
        listeners.forEach(fn => {
            try { fn(updated); } catch (_err) {}
        });

        return newEntry;
    } catch (err) {
        console.error('Failed to add timer history entry:', err);
        return null;
    }
}

/**
 * Clears all timer history.
 */
export async function clearTimerHistory() {
    try {
        await SecureStore.deleteItemAsync(HISTORY_STORAGE_KEY);
        listeners.forEach(fn => {
            try { fn([]); } catch (_err) {}
        });
    } catch (e) {
        console.error('Failed to clear timer history:', e);
    }
}

/**
 * Subscribe to history changes.
 */
export function subscribeHistoryUpdates(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}
