import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from '../src/utils/storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkAlarms, startTaskStage, pauseTask, resumeTask, completeTask, acknowledgeAlarm, syncTask, getTaskBuckets, triggerAlarm } from '../src/api/workerTask.api';
import { calculateRemainingSeconds, formatTime, calculateElapsedSeconds, getTimeOffset, formatProductName } from '../src/utils/timeHelper';
import { scheduleTaskAlarm, cancelTaskAlarm, dismissAllAlarms, stopAlarm, getSelectedRingtoneKey, getRingtoneAudioModule, isAlarmAcknowledged, markAlarmAcknowledged, clearAlarmAcknowledged, canAlarmRing, markAlarmRinging, claimAlarmTrigger, generateAlarmId } from '../src/utils/notificationHelper';
import { addHistoryEntry } from '../src/utils/historyHelper';
import AlarmSettingsModal from '../components/AlarmSettingsModal';
import { useResponsive } from '../src/utils/responsive';

export default function TaskScreen() {
    const router = useRouter();
    const { insets, isLandscape, isTablet, isSmallPhone, scaleFont, contentMaxWidth, modalMaxWidth } = useResponsive();
    const params = useLocalSearchParams();
    const batchId = params.batchId;

    // Load from memory cache synchronously
    const cachedTaskStr = SecureStore.getMemoryItem('current_task');
    const initialTask = cachedTaskStr ? JSON.parse(cachedTaskStr) : null;

    const [currentTask, setCurrentTask] = useState(initialTask);
    const [taskBuckets, setTaskBuckets] = useState([]);
    const [timeLeft, setTimeLeft] = useState(() => calculateRemainingSeconds(initialTask));
    const [loading, setLoading] = useState(false);

    // Alarm Modal State
    const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
    const [alarmTask, setAlarmTask] = useState(null);
    const [wasPausedByAlarm, setWasPausedByAlarm] = useState(false);

    // Settings Modal State
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // DRYING Mode Selection Modal State
    const [isDryingModalOpen, setIsDryingModalOpen] = useState(false);

    const timerRef = useRef(null);
    const syncTimerRef = useRef(null);
    const soundRef = useRef(null);
    const alarmCheckTimerRef = useRef(null);
    const currentTaskRef = useRef(null);
    const timeLeftRef = useRef(0);
    const alarmTriggeredRef = useRef(false);
    const isPlayingAlarmRef = useRef(false);
    const scheduledTaskKeyRef = useRef(null);
    const justStartedAtRef = useRef(0);
    const isAcknowledgingRef = useRef(false);

    useEffect(() => {
        currentTaskRef.current = currentTask;
    }, [currentTask]);

    // Reset alarm trigger state and scheduled task key when task or stage changes
    useEffect(() => {
        alarmTriggeredRef.current = false;
        scheduledTaskKeyRef.current = null;
    }, [currentTask?.id, currentTask?.stage]);

    // Global background alarm check
    useEffect(() => {
        if (!batchId) return;
        const fetchAlarms = async () => {
            if (isAlarmModalOpen) return;
            try {
                const res = await checkAlarms(batchId);
                const alarm = res?.task || (res?.tasks && res.tasks[0]);
                if (alarm && canAlarmRing(alarm)) {
                    const cTask = currentTaskRef.current;
                    
                    // If this alarm is for the current task:
                    if (cTask && cTask.id === alarm.id) {
                        // CRITICAL: If the current task timer is STILL COUNTING DOWN locally (timeLeft > 0),
                        // or was just started within last 3 seconds, DO NOT trigger the alarm early!
                        if (timeLeftRef.current > 0 || (justStartedAtRef.current > 0 && Date.now() - justStartedAtRef.current < 3000)) {
                            return;
                        }
                    }

                    if (cTask && cTask.status === 'RUNNING' && cTask.id !== alarm.id) {
                        try {
                            const pauseRes = await pauseTask(cTask.id);
                            if (pauseRes.success) {
                                setCurrentTask(pauseRes.task);
                                setWasPausedByAlarm(true);
                            }
                        } catch (e) { console.error("Error pausing:", e); }
                    }

                    if (!alarmTriggeredRef.current && !isAlarmModalOpen) {
                        triggerAlarmAcknowledgement(alarm);
                    }
                }
            } catch (e) {}
        };
        alarmCheckTimerRef.current = setInterval(fetchAlarms, 10000);
        return () => {
            if (alarmCheckTimerRef.current) clearInterval(alarmCheckTimerRef.current);
        };
    }, [batchId, isAlarmModalOpen]);

    // Initial check for BUCKET_ARRANGE
    useEffect(() => {
        if (currentTask && currentTask.stage === 'BUCKET_ARRANGE') {
            getTaskBuckets(currentTask.id).then(res => {
                if (res.success) setTaskBuckets(res.buckets || []);
            }).catch(e => console.error(e));
        }
    }, [currentTask?.id, currentTask?.stage]);

    // Timer sync logic - fully frontend-driven, timezone safe, triggers ONLY at 00:00
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
        }

        if (!currentTask) {
            setTimeLeft(0);
            timeLeftRef.current = 0;
            return;
        }

        // If task is not running, just display remaining time without counting down
        if (currentTask.status !== 'RUNNING' || !currentTask.started_at) {
            const staticRemaining = calculateRemainingSeconds(currentTask);
            setTimeLeft(staticRemaining);
            timeLeftRef.current = staticRemaining;
            return;
        }

        // Task is RUNNING: Update countdown and trigger alarm ONLY when remaining reaches 00:00
        const updateCountdown = () => {
            const remaining = calculateRemainingSeconds(currentTask);
            setTimeLeft(remaining);
            timeLeftRef.current = remaining;

            // Trigger ONLY when countdown reaches exactly 00:00 (<= 0)
            const baseSecs = Number(currentTask.remaining_seconds) || Number(currentTask.duration_seconds) || 0;
            const isJustStarted = justStartedAtRef.current > 0 && (Date.now() - justStartedAtRef.current < 2500);
            if (remaining <= 0 && baseSecs > 0 && !isJustStarted && !alarmTriggeredRef.current) {
                const elapsed = calculateElapsedSeconds(currentTask.started_at, getTimeOffset());
                if (elapsed >= baseSecs) {
                    triggerAlarmAcknowledgement(currentTask);
                }
            }
        };

        // Run immediately to set initial timeLeft accurately
        const initialRem = calculateRemainingSeconds(currentTask);
        setTimeLeft(initialRem);
        timeLeftRef.current = initialRem;

        // If task was already expired when loaded into view:
        if (initialRem <= 0) {
            const baseSecs = Number(currentTask.remaining_seconds) || Number(currentTask.duration_seconds) || 0;
            const isJustStarted = justStartedAtRef.current > 0 && (Date.now() - justStartedAtRef.current < 2500);
            // Only fire if it genuinely had a duration, was running, has completed, wasn't just started, and can ring
            if (baseSecs > 0 && !isJustStarted && !alarmTriggeredRef.current && currentTask.status === 'RUNNING' && currentTask.started_at) {
                const elapsed = calculateElapsedSeconds(currentTask.started_at, getTimeOffset());
                if (elapsed >= baseSecs) {
                    triggerAlarmAcknowledgement(currentTask);
                }
            }
            return;
        }

        // Schedule OS Local Push Notification for background/killed state once for the exact completion time
        const scheduleKey = `${currentTask.id}-${currentTask.stage}-${currentTask.started_at}`;
        if (initialRem > 0 && scheduledTaskKeyRef.current !== scheduleKey) {
            scheduledTaskKeyRef.current = scheduleKey;
            scheduleTaskAlarm(currentTask, initialRem);
        }

        // Start 1-second countdown interval
        timerRef.current = setInterval(updateCountdown, 1000);

        // Sync from server every 5 seconds - only update state if drift is significant (>3s) to prevent flicker
        syncTimerRef.current = setInterval(async () => {
            try {
                const res = await syncTask(currentTask.id);
                if (res?.success && res.task) {
                    if (res.task.status === 'DONE') {
                        router.replace('/dashboard');
                    } else if (res.task.status === 'ALARM') {
                        const isJustStarted = justStartedAtRef.current > 0 && (Date.now() - justStartedAtRef.current < 3000);
                        if (timeLeftRef.current <= 2 && !isJustStarted && !alarmTriggeredRef.current) {
                            triggerAlarmAcknowledgement(res.task);
                        }
                    }
 else if (res.task.status === 'RUNNING') {
                        const serverRemaining = calculateRemainingSeconds(res.task);
                        if (Math.abs(serverRemaining - timeLeftRef.current) > 3) {
                            setCurrentTask(prev => ({
                                ...prev,
                                remaining_seconds: res.task.remaining_seconds,
                                started_at: res.task.started_at
                            }));
                        }
                    }
                }
            } catch (e) {
                console.error("Sync error:", e);
            }
        }, 5000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (syncTimerRef.current) {
                clearInterval(syncTimerRef.current);
                syncTimerRef.current = null;
            }
        };
    }, [currentTask?.id, currentTask?.status, currentTask?.started_at, currentTask?.remaining_seconds, currentTask?.duration_seconds]);

    // Play foreground alarm sound (with duplicate protection)
    const playForegroundAlarm = async () => {
        if (isPlayingAlarmRef.current) return;
        isPlayingAlarmRef.current = true;
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            }).catch(() => {});

            if (soundRef.current) {
                try {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                } catch (e) {}
                soundRef.current = null;
            }

            const soundKey = await getSelectedRingtoneKey();
            const soundModule = getRingtoneAudioModule(soundKey);

            const { sound } = await Audio.Sound.createAsync(soundModule);
            soundRef.current = sound;
            await sound.setIsLoopingAsync(true);
            await sound.playAsync();
        } catch (e) {
            console.error("Audio play error", e);
            isPlayingAlarmRef.current = false;
        }
    };

    const stopForegroundAlarm = async () => {
        isPlayingAlarmRef.current = false;
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (e) {}
            soundRef.current = null;
        }
        await dismissAllAlarms();
    };

    // Cleanup audio on component unmount
    useEffect(() => {
        return () => {
            stopForegroundAlarm();
        };
    }, []);

    // ─── Single Authoritative Alarm Trigger Function ────────────────────────
    const triggerAlarmAcknowledgement = (taskToAlarm) => {
        if (!taskToAlarm || !taskToAlarm.id) return;
        const baseSecs = Number(taskToAlarm.remaining_seconds) || Number(taskToAlarm.duration_seconds) || 0;
        if (baseSecs <= 0) return;
        if (justStartedAtRef.current > 0 && (Date.now() - justStartedAtRef.current < 2500)) return;

        // ATOMIC CLAIM LOCK: if already ringing, acknowledged, or completed, returns false
        const claimed = claimAlarmTrigger(taskToAlarm);
        if (!claimed) {
            return;
        }

        // Stop running timers immediately so countdown never fires again
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
        }

        setTimeLeft(0);
        timeLeftRef.current = 0;
        alarmTriggeredRef.current = true;
        setAlarmTask(taskToAlarm);
        setIsAlarmModalOpen(true);
        playForegroundAlarm();
        if (taskToAlarm.id) {
            triggerAlarm(taskToAlarm.id).catch(() => {});
        }
    };

    const handleTimerEnd = (task) => {
        triggerAlarmAcknowledgement(task);
    };

    // Navigate to next task or go back to dashboard
    const handleNextTaskOrBack = (nextTask, batchIdForAssign) => {
        alarmTriggeredRef.current = false;
        scheduledTaskKeyRef.current = null;
        if (nextTask) {
            // Directly show the next task on this same screen
            SecureStore.setMemoryItem('current_task', JSON.stringify(nextTask));
            setCurrentTask(nextTask);
            setIsAlarmModalOpen(false);
            setAlarmTask(null);
            const rem = calculateRemainingSeconds(nextTask);
            setTimeLeft(rem);
            timeLeftRef.current = rem;
        } else {
            // No next task - go to dashboard
            router.replace('/dashboard');
        }
    };

    // ─── DRYING Mode Selection ────────────────────────────────────────────
    const handleStartStageDrying = () => {
        // Show drying mode selection modal first
        setIsDryingModalOpen(true);
    };

    const handleDryingModeSelected = async (mode) => {
        setIsDryingModalOpen(false);
        setLoading(true);
        alarmTriggeredRef.current = false;
        justStartedAtRef.current = Date.now();
        if (currentTask?.id) {
            clearAlarmAcknowledged(currentTask.id, currentTask.stage);
        }
        try {
            const res = await startTaskStage(currentTask.id, { drying_mode: mode });
            if (res?.success && res.task) {
                setCurrentTask(res.task);
                const rem = calculateRemainingSeconds(res.task);
                setTimeLeft(rem);
                timeLeftRef.current = rem;
            }
        } catch (e) {
            Alert.alert('त्रुटि', e.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── Start Stage (non-DRYING) ─────────────────────────────────────────
    const handleStartStage = async () => {
        // DRYING gets its own flow
        if (currentTask.stage === 'DRYING') {
            handleStartStageDrying();
            return;
        }

        setLoading(true);
        alarmTriggeredRef.current = false;
        justStartedAtRef.current = Date.now();
        if (currentTask?.id) {
            clearAlarmAcknowledged(currentTask.id, currentTask.stage);
        }
        try {
            const res = await startTaskStage(currentTask.id, {});
            if (res?.success && res.task) {
                setCurrentTask(res.task);
                const rem = calculateRemainingSeconds(res.task);
                setTimeLeft(rem);
                timeLeftRef.current = rem;
            }
        } catch (e) {
            Alert.alert('त्रुटि', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePauseStage = async () => {
        setLoading(true);
        try {
            const res = await pauseTask(currentTask.id);
            if (res?.success && res.task) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setCurrentTask(res.task);
                const rem = calculateRemainingSeconds(res.task);
                setTimeLeft(rem);
                timeLeftRef.current = rem;
                await cancelTaskAlarm(currentTask.id);
                scheduledTaskKeyRef.current = null;
            }
        } catch (e) {
            Alert.alert('त्रुटि', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeStage = async () => {
        setLoading(true);
        alarmTriggeredRef.current = false;
        justStartedAtRef.current = Date.now();
        if (currentTask?.id) {
            clearAlarmAcknowledged(currentTask.id, currentTask.stage);
        }
        try {
            const res = await resumeTask(currentTask.id);
            if (res?.success && res.task) {
                setCurrentTask(res.task);
                const rem = calculateRemainingSeconds(res.task);
                setTimeLeft(rem);
                timeLeftRef.current = rem;
            }
        } catch (e) {
            Alert.alert('त्रुटि', e.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── Complete Task (for manual/hands-on stages) ───────────────────────
    const handleCompleteTask = async () => {
        setLoading(true);
        alarmTriggeredRef.current = false;
        scheduledTaskKeyRef.current = null;
        try {
            if (currentTask) {
                await addHistoryEntry({
                    task: currentTask,
                    status: 'Completed',
                    finishedAt: new Date().toISOString(),
                });
            }
            const res = await completeTask(currentTask.id);
            if (res?.success) {
                await cancelTaskAlarm(currentTask.id);
                if (res.nextTask) {
                    // Next task returned directly - show it
                    SecureStore.setMemoryItem('current_task', JSON.stringify(res.nextTask));
                    setCurrentTask(res.nextTask);
                    const rem = calculateRemainingSeconds(res.nextTask);
                    setTimeLeft(rem);
                    timeLeftRef.current = rem;
                    Alert.alert('स्टेज पूरा हुआ!', `अगला: ${res.nextTask.stage} स्टेज शुरू करने के लिए तैयार है।`);
                } else {
                    Alert.alert('पूरा हुआ!', 'स्टेज सफलतापूर्वक पूर्ण चिह्नित किया गया!');
                    router.replace('/dashboard');
                }
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── Acknowledge Alarm (Idempotent: Once clicked, works exactly once) ──────
    const handleAcknowledgeAlarm = async () => {
        if (isAcknowledgingRef.current) {
            console.log('[ALARM] DUPLICATE STOP IGNORED - already processing acknowledgement');
            return;
        }
        isAcknowledgingRef.current = true;
        setLoading(true);

        const currentAlarm = alarmTask || currentTask;
        try {
            // 1. Immediately stop audio ringtone
            await stopForegroundAlarm();

            // Log completed timer to history
            if (currentAlarm) {
                await addHistoryEntry({
                    task: currentAlarm,
                    status: 'Completed',
                    finishedAt: new Date().toISOString(),
                });
            }

            // 2. Mark alarm acknowledged in singleton state manager & persist to SecureStore
            if (currentAlarm?.id) {
                await markAlarmAcknowledged(currentAlarm);
                await stopAlarm(currentAlarm.id);
            } else {
                await dismissAllAlarms();
            }

            // 3. Clear running intervals and close modal
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (syncTimerRef.current) {
                clearInterval(syncTimerRef.current);
                syncTimerRef.current = null;
            }
            scheduledTaskKeyRef.current = null;
            setIsAlarmModalOpen(false);
            setAlarmTask(null);

            if (currentAlarm?.id) {
                const res = await acknowledgeAlarm(currentAlarm.id);
                if (res?.success) {
                    if (wasPausedByAlarm && currentTask) {
                        setWasPausedByAlarm(false);
                        const resumeRes = await resumeTask(currentTask.id);
                        if (resumeRes?.success && resumeRes.task) {
                            setCurrentTask(resumeRes.task);
                            const rem = calculateRemainingSeconds(resumeRes.task);
                            setTimeLeft(rem);
                            timeLeftRef.current = rem;
                        }
                    } else if (!currentTask || currentTask.id === currentAlarm.id) {
                        if (res.nextTask) {
                            clearAlarmAcknowledged(res.nextTask.id, res.nextTask.stage);
                            alarmTriggeredRef.current = false;
                            SecureStore.setMemoryItem('current_task', JSON.stringify(res.nextTask));
                            setCurrentTask(res.nextTask);
                            const rem = calculateRemainingSeconds(res.nextTask);
                            setTimeLeft(rem);
                            timeLeftRef.current = rem;
                            Alert.alert('अलार्म स्वीकार किया गया', `अगला: ${formatProductName(res.nextTask)} के लिए ${res.nextTask.stage} स्टेज तैयार है। शुरू करने के लिए "स्टेज शुरू करें" दबाएं।`);
                        } else {
                            Alert.alert('पूरा हुआ', 'अलार्म स्वीकार कर लिया गया और स्टेज पूरा हुआ।');
                            router.replace('/dashboard');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Acknowledgement error:", e?.message || e);
        } finally {
            setLoading(false);
            isAcknowledgingRef.current = false;
        }
    };



    // ─── Android Back Button Navigation Fix ──────────────────────────────────
    useEffect(() => {
        const onBackPress = () => {
            stopForegroundAlarm();
            if (isAlarmModalOpen) {
                const target = alarmTask || currentTask;
                if (target) {
                    markAlarmAcknowledged(target);
                    if (target?.id) stopAlarm(target.id);
                }
                setIsAlarmModalOpen(false);
                setAlarmTask(null);
            }
            setIsSettingsModalOpen(false);
            setIsDryingModalOpen(false);

            // Always return cleanly directly to Dashboard
            router.replace('/dashboard');
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [isAlarmModalOpen, alarmTask]);


    // Determine if this stage can run in background
    const canRunInBackground = currentTask && (
        currentTask.stage === 'SOAKING' ||
        (currentTask.stage === 'DRYING' && (!currentTask.drying_mode || currentTask.drying_mode === 'machine'))
    );

    if (!currentTask) return <View style={styles.center}><Text>No task assigned.</Text></View>;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <View style={[styles.headerInner, { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
                    <TouchableOpacity
                        onPress={() => {
                            stopForegroundAlarm();
                            if (isAlarmModalOpen) {
                                const target = alarmTask || currentTask;
                                if (target) {
                                    markAlarmAcknowledged(target);
                                    if (target?.id) stopAlarm(target.id);
                                }
                                setIsAlarmModalOpen(false);
                                setAlarmTask(null);
                            }
                            router.replace('/dashboard');
                        }}
                        style={styles.backBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Task Details</Text>
                    <TouchableOpacity
                        onPress={() => setIsSettingsModalOpen(true)}
                        style={styles.settingsBtn}
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="volume-medium-outline" size={16} color="#166534" style={{ marginRight: 4 }} />
                        <Text style={styles.settingsBtnText}>{isSmallPhone ? 'Sound' : 'Sound Settings'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={[
                    styles.scrollContentContainer,
                    { 
                        paddingHorizontal: isSmallPhone ? 10 : (isTablet ? 24 : 14),
                        paddingBottom: 130 + Math.max(insets.bottom, 14) 
                    }
                ]}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                bounces={true}
                alwaysBounceVertical={true}
            >
                <View style={[styles.mainContentWrapper, { maxWidth: isTablet ? 720 : '100%', width: '100%', alignSelf: 'center' }]}>
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.stageText}>{currentTask.stage}</Text>
                            <Text style={styles.statusBadge}>{currentTask.status}</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Product</Text>
                                <Text style={styles.value}>
                                    {formatProductName(currentTask)}
                                </Text>
                            </View>
                            <View style={styles.colRight}>
                                <Text style={styles.labelRight}>Quantity</Text>
                                <Text style={styles.valueRight}>{currentTask.quantity_grams}g</Text>
                            </View>
                        </View>

                        {currentTask.stage === 'DRYING' && currentTask.drying_mode && (
                            <View style={styles.dryingModeBadge}>
                                <Text style={styles.dryingModeText}>
                                    Mode: {currentTask.drying_mode === 'machine' ? 'Machine' : currentTask.drying_mode === 'piece' ? 'Per Piece' : 'Per 25g'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Timer - for all timed stages including BUCKET_ARRANGE */}
                    {['SOAKING', 'DRYING', 'WEIGHING', 'CUTTING', 'BUCKET_ARRANGE'].includes(currentTask.stage) && (
                        <View style={styles.timerSection}>
                            <Text style={styles.timerLabel}>Time Remaining</Text>
                            <Text style={[
                                styles.timerText, 
                                { fontSize: Math.min(42, Math.max(30, scaleFont(38))) },
                                timeLeft <= 30 && currentTask.status === 'RUNNING' && styles.timerTextWarning
                            ]}>
                                {formatTime(timeLeft)}
                            </Text>
                            {currentTask.status === 'RUNNING' && timeLeft <= 60 && timeLeft > 0 && (
                                <Text style={styles.almostDoneText}>लगभग पूरा हो गया!</Text>
                            )}
                        </View>
                    )}

                    {/* BUCKET_ARRANGE - show user list */}
                    {currentTask.stage === 'BUCKET_ARRANGE' && (
                        <View style={styles.bucketSection}>
                            <Text style={styles.sectionTitle}>User Bucket List (Demands)</Text>
                            {taskBuckets && taskBuckets.length > 0 ? (
                                taskBuckets.map((item, index) => (
                                    <View key={index.toString()} style={[styles.bucketRow, index === taskBuckets.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={styles.bucketNumber}><Text style={styles.bucketNumberText}>#{item.sortId}</Text></View>
                                        <Text style={styles.bucketUser} numberOfLines={1} ellipsizeMode="tail">{item.userName}</Text>
                                        <Text style={styles.bucketQty}>{item.quantity}g</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.bucketEmptyText}>Loading buckets...</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
                <View style={[styles.footerInner, { maxWidth: isTablet ? 560 : '100%', width: '100%', alignSelf: 'center' }]}>
                    {currentTask.status === 'NOT_STARTED' && (
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleStartStage} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>
                                {currentTask.stage === 'DRYING' ? 'Select Drying Mode & Start' : 'Start Stage'}
                            </Text>}
                        </TouchableOpacity>
                    )}

                    {currentTask.status === 'RUNNING' && (
                        <>
                            <TouchableOpacity style={styles.warningBtn} onPress={handlePauseStage} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Pause</Text>}
                            </TouchableOpacity>

                            {/* Background button ONLY for machine drying and soaking */}
                            {canRunInBackground ? (
                                <TouchableOpacity
                                    style={styles.secondaryBtn}
                                    onPress={() => {
                                        stopForegroundAlarm();
                                        router.replace('/dashboard');
                                    }}
                                >
                                    <Text style={styles.btnText}>Run in Background & Next Task</Text>
                                </TouchableOpacity>
                            ) : currentTask.stage !== 'BUCKET_ARRANGE' ? (
                                /* Manual stages: per piece, per 25g, weighing, cutting - NOT bucket_arrange (has its own btn) */
                                <TouchableOpacity style={styles.primaryBtn} onPress={handleCompleteTask} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Mark Complete</Text>}
                                </TouchableOpacity>
                            ) : null}
                        </>
                    )}

                    {currentTask.status === 'PAUSED' && (
                        <>
                            <TouchableOpacity style={styles.successBtn} onPress={handleResumeStage} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Resume Task</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* BUCKET_ARRANGE complete button */}
                    {currentTask.stage === 'BUCKET_ARRANGE' && currentTask.status === 'RUNNING' && (
                        <TouchableOpacity style={styles.successBtn} onPress={handleCompleteTask} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>बकेट तैयार - पूरा हुआ</Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ─── DRYING MODE SELECTION MODAL ─────────────────────────── */}
            <Modal visible={isDryingModalOpen} transparent={true} animationType="slide">
                <View style={[styles.modalOverlay, (isTablet || isLandscape) && styles.modalOverlayCenter]}>
                    <View style={[
                        styles.dryingModalContent,
                        (isTablet || isLandscape) && styles.dryingModalContentDialog,
                        { maxWidth: modalMaxWidth }
                    ]}>
                        <Text style={styles.modalTitle}>Select Drying Method</Text>
                        <Text style={styles.modalSubText}>Choose how you want to dry this product</Text>

                        <ScrollView
                            style={{ maxHeight: 360 }}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                            bounces={true}
                        >
                            <TouchableOpacity
                                style={styles.dryingOption}
                                onPress={() => handleDryingModeSelected('machine')}
                                disabled={loading}
                            >
                                <Ionicons name="hardware-chip-outline" size={24} color="#273AF8" style={styles.dryingOptionIcon} />
                                <View style={styles.dryingOptionText}>
                                    <Text style={styles.dryingOptionTitle}>Machine Drying</Text>
                                    <Text style={styles.dryingOptionSub}>Timer-based • Can run in background</Text>
                                </View>
                                {loading && <ActivityIndicator color="#1976D2" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dryingOption}
                                onPress={() => handleDryingModeSelected('piece')}
                                disabled={loading}
                            >
                                <Ionicons name="hand-left-outline" size={24} color="#273AF8" style={styles.dryingOptionIcon} />
                                <View style={styles.dryingOptionText}>
                                    <Text style={styles.dryingOptionTitle}>Per Piece</Text>
                                    <Text style={styles.dryingOptionSub}>Manual • Stay on screen</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dryingOption}
                                onPress={() => handleDryingModeSelected('gram')}
                                disabled={loading}
                            >
                                <Ionicons name="scale-outline" size={24} color="#273AF8" style={styles.dryingOptionIcon} />
                                <View style={styles.dryingOptionText}>
                                    <Text style={styles.dryingOptionTitle}>Per 25g</Text>
                                    <Text style={styles.dryingOptionSub}>Manual • Stay on screen</Text>
                                </View>
                            </TouchableOpacity>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => setIsDryingModalOpen(false)}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ─── ALARM MODAL ──────────────────────────────────────────── */}
            <Modal visible={isAlarmModalOpen} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <ScrollView
                        contentContainerStyle={styles.alarmModalScroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <View style={[styles.modalContent, { maxWidth: 440, width: '92%', alignSelf: 'center' }]}>
                            <Ionicons name="notifications" size={38} color="#D32F2F" style={{ marginBottom: 12 }} />
                            <Text style={styles.modalTitle}>टाइमर पूरा हुआ!</Text>
                            <Text style={styles.modalText}>
                                <Text style={styles.bold}>{formatProductName(alarmTask || currentTask)}</Text> के लिए <Text style={styles.bold}>{alarmTask?.stage}</Text> स्टेज पूरा हो चुका है।
                            </Text>
                            <TouchableOpacity style={styles.dangerBtn} onPress={handleAcknowledgeAlarm} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>अलार्म बंद करें और अगला स्टेज</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* ─── ALARM RINGTONE SETTINGS MODAL ───────────────────────── */}
            <AlarmSettingsModal
                visible={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', elevation: 2, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    backBtn: { paddingVertical: 6, paddingHorizontal: 4, marginRight: 8, flexShrink: 0 },
    backText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 6 },
    settingsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7', flexShrink: 0 },
    settingsBtnText: { color: '#166534', fontWeight: 'bold', fontSize: 13 },

    // Scroll Area
    scrollArea: { flex: 1 },
    scrollContentContainer: { padding: 12, paddingBottom: 20 },
    mainContentWrapper: { width: '100%' },

    // Task Card
    infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 2, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    stageText: { fontSize: 17, fontWeight: 'bold', color: '#2E7D32' },
    statusBadge: { backgroundColor: '#E8F5E9', color: '#2E7D32', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, fontWeight: 'bold', fontSize: 11, overflow: 'hidden' },
    dryingModeBadge: { marginTop: 8, backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#FFE0B2' },
    dryingModeText: { color: '#E65100', fontWeight: 'bold', fontSize: 11 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    col: { flex: 1.4, minWidth: 0, paddingRight: 8 },
    colRight: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
    label: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
    labelRight: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 2, textAlign: 'right' },
    value: { fontSize: 14, fontWeight: 'bold', color: '#111827', flexWrap: 'wrap' },
    valueRight: { fontSize: 14, fontWeight: 'bold', color: '#111827', textAlign: 'right' },

    // Timer Section
    timerSection: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10, elevation: 2, borderWidth: 1, borderColor: '#E5E7EB' },
    timerLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 2, letterSpacing: 0.3 },
    timerText: { fontSize: 38, fontWeight: 'bold', color: '#1976D2', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 },
    timerTextWarning: { color: '#D32F2F' },
    almostDoneText: { color: '#F57C00', fontWeight: 'bold', fontSize: 11, marginTop: 2 },

    // Bucket List Section
    bucketSection: { backgroundColor: '#E8F5E9', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#C8E6C9', marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1B5E20', marginBottom: 6 },
    bucketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#C8E6C9' },
    bucketNumber: { backgroundColor: '#4CAF50', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8, flexShrink: 0 },
    bucketNumberText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
    bucketUser: { flex: 1, minWidth: 0, fontSize: 13, color: '#333', fontWeight: '600', paddingRight: 6 },
    bucketQty: { fontSize: 13, fontWeight: 'bold', color: '#1B5E20', flexShrink: 0 },
    bucketEmptyText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic', paddingVertical: 6, textAlign: 'center' },

    // Footer
    footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'android' ? 14 : 10, backgroundColor: '#fff', elevation: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    footerInner: { width: '100%', gap: 8 },
    primaryBtn: { backgroundColor: '#1976D2', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    secondaryBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    warningBtn: { backgroundColor: '#F57C00', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    successBtn: { backgroundColor: '#388E3C', paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    dangerBtn: { backgroundColor: '#D32F2F', paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 14 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1.5,
        borderColor: '#FECACA',
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 8,
    },
    cancelBtnText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '700',
    },

    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center', padding: 0 },
    modalOverlayCenter: { justifyContent: 'center', padding: 16 },
    alarmModalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 20 },
    modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 440, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 4, borderColor: '#D32F2F', marginBottom: 0 },
    alarmEmoji: { fontSize: 64, marginBottom: 10 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', marginBottom: 8, textAlign: 'center' },
    modalSubText: { fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' },
    modalText: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
    bold: { fontWeight: 'bold', color: '#000' },

    // Drying modal styles
    dryingModalContent: { backgroundColor: '#fff', width: '100%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 22, paddingBottom: 36 },
    dryingModalContentDialog: { borderRadius: 24, alignSelf: 'center' },
    dryingOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 12 },
    dryingOptionIcon: { marginRight: 14, flexShrink: 0 },
    dryingOptionText: { flex: 1, minWidth: 0 },
    dryingOptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    dryingOptionSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
