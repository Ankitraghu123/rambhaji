import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    Modal,
    AppState,
    Platform,
    BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from '../src/utils/storage';
import {
    getTodayBatches,
    markAttendance,
    getBatchDemand,
    assignNextTask,
    getMyActiveTasks,
    acknowledgeAlarm,
    getStuckTasks,
    forceCompleteTask
} from '../src/api/workerTask.api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateRemainingSeconds, formatTime, formatProductName } from '../src/utils/timeHelper';
import { useResponsive } from '../src/utils/responsive';
import {
    scheduleTaskAlarm,
    cancelAllTaskAlarms,
    dismissAllAlarms,
    stopAlarm,
    getSelectedRingtoneKey,
    getRingtoneAudioModule,
    canAlarmRing,
    markAlarmRinging,
    markAlarmAcknowledged,
    clearAlarmAcknowledged,
    claimAlarmTrigger,
    generateAlarmId,
    getRingtoneName
} from '../src/utils/notificationHelper';
import RingtoneSelector from '../components/RingtoneSelector';
import AlarmSettingsModal from '../components/AlarmSettingsModal';
import AboutAppModal from '../components/AboutAppModal';
import PrivacyLegalModal from '../components/PrivacyLegalModal';
import TimerHistoryView from '../components/TimerHistoryView';
import { addHistoryEntry } from '../src/utils/historyHelper';
import { APP_INFO } from '../constants/appConfig';
import { ThemeColors, Shadows } from '../constants/theme';

// ─── Live Countdown Timer Component ───────────────────────────────────────────
function LiveCountdown({ task }) {
    const [timeLeft, setTimeLeft] = useState(() => calculateRemainingSeconds(task));

    useEffect(() => {
        if (!task || task.status !== 'RUNNING' || !task.started_at) {
            setTimeLeft(calculateRemainingSeconds(task));
            return;
        }

        const updateTime = () => {
            const remaining = calculateRemainingSeconds(task);
            setTimeLeft(remaining);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [task?.id, task?.status, task?.started_at, task?.remaining_seconds, task?.duration_seconds]);

    const isOverdue = timeLeft <= 0 && task?.status === 'RUNNING';
    const isWarning = timeLeft <= 60 && timeLeft > 0;

    return (
        <View style={[
            styles.taskCardTimerPill,
            isWarning && styles.taskCardTimerPillWarning,
            isOverdue && styles.taskCardTimerPillAlarm,
        ]}>
            <Text style={[
                styles.taskCardTimer,
                isOverdue && styles.taskCardTimerAlarm,
                isWarning && styles.taskCardTimerWarning,
            ]}>
                {task?.status === 'ALARM' ? 'ALARM' : (task?.status === 'PAUSED' ? 'PAUSED' : formatTime(timeLeft))}
            </Text>
        </View>
    );
}

// Helper for local date string YYYY-MM-DD
const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const router = useRouter();
    const { insets, isTablet, isSmallPhone, contentMaxWidth, scaleFont } = useResponsive();

    const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'background' | 'history' | 'settings'
    const [loading, setLoading] = useState(false);
    const [attendanceMarked, setAttendanceMarked] = useState(false);
    const [checkingAttendance, setCheckingAttendance] = useState(true);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [demands, setDemands] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [stuckTasks, setStuckTasks] = useState([]);
    const [workerId, setWorkerId] = useState('');
    const [selectedSoundName, setSelectedSoundName] = useState('Default Alarm');

    // Alarm state - shown on dashboard itself
    const [alarmTask, setAlarmTask] = useState(null);
    const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isPrivacyLegalModalOpen, setIsPrivacyLegalModalOpen] = useState(false);
    const [acknowledging, setAcknowledging] = useState(false);

    const soundRef = useRef(null);
    const alarmTaskRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const isPlayingSoundRef = useRef(false);
    const acknowledgingRef = useRef(false);

    // ─── Date-based Attendance Verification on Mount ────────────────────────
    useEffect(() => {
        const verifyAttendance = async () => {
            try {
                const userId = await SecureStore.getItemAsync('user_id');
                if (userId) setWorkerId(userId);
                const key = `attendance_marked_date_${userId || 'default'}`;
                const savedDate = await SecureStore.getItemAsync(key);
                const today = getTodayDateString();
                if (savedDate === today) {
                    setAttendanceMarked(true);
                }
                const savedRingtone = await getSelectedRingtoneKey();
                if (savedRingtone) {
                    setSelectedSoundName(getRingtoneName(savedRingtone));
                }
            } catch (e) {
                console.error('Error checking attendance date:', e);
            } finally {
                setCheckingAttendance(false);
            }
        };
        verifyAttendance();
    }, []);

    // ─── Sound helpers ───────────────────────────────────────────────────────
    const playAlarmSound = async () => {
        if (isPlayingSoundRef.current) return;
        isPlayingSoundRef.current = true;
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
            console.error('Dashboard alarm sound error:', e);
            isPlayingSoundRef.current = false;
        }
    };

    const stopAlarmSound = async () => {
        isPlayingSoundRef.current = false;
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (e) { /* ignore */ }
            soundRef.current = null;
        }
    };

    // ─── Fetch background tasks & detect ALARM ──────────────────────────────
    const fetchMyTasks = useCallback(async () => {
        try {
            const res = await getMyActiveTasks();
            if (res.success) {
                const tasks = res.tasks || [];
                setMyTasks(tasks);

                // Check for any ALARM task guarded strictly by AlarmStateManager
                const foundAlarm = tasks.find(t => {
                    if (!canAlarmRing(t)) return false;
                    if (t.status === 'ALARM') return true;
                    if (t.status === 'RUNNING' && t.started_at) {
                        const rem = calculateRemainingSeconds(t);
                        const baseSecs = Number(t.remaining_seconds) || Number(t.duration_seconds) || 0;
                        return rem <= 0 && baseSecs > 0;
                    }
                    return false;
                });

                // Ensure OS-level AlarmManager notification is scheduled for any running task
                tasks.forEach(t => {
                    if (t.status === 'RUNNING' && t.started_at) {
                        const rem = calculateRemainingSeconds(t);
                        if (rem > 0) {
                            scheduleTaskAlarm(t, rem);
                        }
                    }
                });

                if (foundAlarm && !isAlarmModalOpen) {
                    const claimed = claimAlarmTrigger(foundAlarm);
                    if (claimed) {
                        alarmTaskRef.current = foundAlarm;
                        setAlarmTask(foundAlarm);
                        setIsAlarmModalOpen(true);
                        playAlarmSound();
                    }
                }
            }
        } catch (e) {
            console.error("fetchMyTasks error:", e);
        }
    }, [isAlarmModalOpen]);

    const fetchMyTasksRef = useRef(fetchMyTasks);
    useEffect(() => {
        fetchMyTasksRef.current = fetchMyTasks;
    }, [fetchMyTasks]);

    // ─── AppState: re-fetch immediately when app comes to foreground ─────────
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                if (typeof fetchMyTasksRef.current === 'function') {
                    fetchMyTasksRef.current();
                }
            }
            appStateRef.current = nextAppState;
        });
        return () => subscription.remove();
    }, []);

    // ─── Android Back Button Handler (Tab-Aware + Alarm single-click) ────────
    useEffect(() => {
        const onBackPress = () => {
            // 1. If Alarm Modal open -> acknowledge and close immediately
            if (isAlarmModalOpen) {
                stopAlarmSound();
                if (alarmTask) {
                    markAlarmAcknowledged(alarmTask);
                    stopAlarm(alarmTask.id);
                }
                setIsAlarmModalOpen(false);
                setAlarmTask(null);
                alarmTaskRef.current = null;
                return true;
            }

            // 2. If Settings, About, or Privacy modal open -> close modal
            if (isPrivacyLegalModalOpen) {
                setIsPrivacyLegalModalOpen(false);
                return true;
            }
            if (isAboutModalOpen) {
                setIsAboutModalOpen(false);
                return true;
            }
            if (isSettingsModalOpen) {
                setIsSettingsModalOpen(false);
                return true;
            }

            // 3. If on Background, History, or Settings tab -> switch directly back to Dashboard
            if (currentTab !== 'dashboard') {
                setCurrentTab('dashboard');
                return true;
            }

            // 4. On Dashboard root tab -> let Android handle natural back (exit/background app)
            return false;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [isAlarmModalOpen, isSettingsModalOpen, isAboutModalOpen, isPrivacyLegalModalOpen, currentTab, alarmTask]);

    const fetchStuckTasksData = useCallback(async () => {
        try {
            const res = await getStuckTasks();
            if (res.success) setStuckTasks(res.tasks || []);
        } catch (e) {
            console.error('fetchStuckTasks error:', e);
        }
    }, []);

    useEffect(() => {
        loadBatches();
        fetchMyTasks();
        fetchStuckTasksData();
    }, []);

    // Cleanup sound on unmount
    useEffect(() => {
        return () => { stopAlarmSound(); };
    }, []);

    const loadBatches = async () => {
        try {
            const res = await getTodayBatches();
            if (res.success) {
                setBatches(res.batches || []);
                // If there's only 1 batch, select it automatically for convenience
                if (res.batches && res.batches.length === 1 && !selectedBatch) {
                    selectBatch(res.batches[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkAttendance = async () => {
        if (attendanceMarked) return;
        setLoading(true);
        try {
            const userId = await SecureStore.getItemAsync('user_id');
            const today = getTodayDateString();
            const key = `attendance_marked_date_${userId || 'default'}`;

            await markAttendance();
            await SecureStore.setItemAsync(key, today);
            setAttendanceMarked(true);
        } catch (e) {
            const errorMsg = e.response?.data?.message || '';
            if (errorMsg.toLowerCase().includes('already marked')) {
                const userId = await SecureStore.getItemAsync('user_id');
                const today = getTodayDateString();
                const key = `attendance_marked_date_${userId || 'default'}`;
                await SecureStore.setItemAsync(key, today);
                setAttendanceMarked(true);
            } else {
                Alert.alert('त्रुटि', errorMsg || 'हाजिरी दर्ज करने में विफल');
            }
        } finally {
            setLoading(false);
        }
    };

    const selectBatch = async (batchId) => {
        setSelectedBatch(batchId);
        try {
            const res = await getBatchDemand(batchId);
            if (res.success) setDemands(res.demand || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchNextTask = async () => {
        if (!selectedBatch) return Alert.alert('सूचना', 'कृपया पहले एक सक्रिय बैच चुनें');
        setLoading(true);
        try {
            const res = await assignNextTask(selectedBatch);
            if (res.success) {
                if (res.task) {
                    SecureStore.setMemoryItem('current_task', JSON.stringify(res.task));
                    // Clear any previous acknowledged flag for this new task/stage
                    clearAlarmAcknowledged(res.task);
                    router.push({
                        pathname: '/activetask',
                        params: { batchId: selectedBatch }
                    });
                } else {
                    Alert.alert('सब पूरा हुआ', 'अभी कोई कार्य लंबित नहीं है। बकेट टास्क चेक करें या अगले बैच की प्रतीक्षा करें।');
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert('त्रुटि', 'कार्य प्राप्त करने में विफल');
        } finally {
            setLoading(false);
        }
    };

    // ─── Acknowledge alarm from Dashboard modal (SINGLE TRIGGER ONLY) ────────
    const handleAcknowledgeAlarm = async () => {
        if (!alarmTask || acknowledgingRef.current) return;
        acknowledgingRef.current = true;
        setAcknowledging(true);
        const currentAlarm = alarmTask;
        try {
            await stopAlarmSound();
            if (currentAlarm?.id) {
                await markAlarmAcknowledged(currentAlarm);
                await stopAlarm(currentAlarm.id);
            } else {
                await dismissAllAlarms();
            }

            // Log completed alarm timer to history
            if (currentAlarm) {
                await addHistoryEntry({
                    task: currentAlarm,
                    status: 'Completed',
                    finishedAt: new Date().toISOString(),
                });
            }

            setIsAlarmModalOpen(false);
            alarmTaskRef.current = null;
            setAlarmTask(null);

            const res = await acknowledgeAlarm(currentAlarm.id);
            if (res.success) {
                await fetchMyTasks();
                await fetchStuckTasksData();

                if (res.nextTask) {
                    clearAlarmAcknowledged(res.nextTask);
                    SecureStore.setMemoryItem('current_task', JSON.stringify(res.nextTask));
                    router.push({
                        pathname: '/activetask',
                        params: { batchId: res.nextTask.batch_id }
                    });
                } else if (selectedBatch) {
                    try {
                        const assignRes = await assignNextTask(selectedBatch);
                        if (assignRes.success && assignRes.task) {
                            clearAlarmAcknowledged(assignRes.task);
                            SecureStore.setMemoryItem('current_task', JSON.stringify(assignRes.task));
                            router.push({
                                pathname: '/activetask',
                                params: { batchId: selectedBatch }
                            });
                            return;
                        }
                    } catch (assignErr) {
                        console.log("[Dashboard] Assign after alarm ack fallback:", assignErr?.message);
                    }
                    Alert.alert('पूरा हुआ', 'अलार्म स्वीकार कर लिया गया! आगे बढ़ने के लिए अगला कार्य प्राप्त करें।');
                } else {
                    Alert.alert('पूरा हुआ', 'अलार्म स्वीकार कर लिया गया! बैच चुनें और अगला कार्य प्राप्त करें।');
                }
            }
        } catch (e) {
            Alert.alert('त्रुटि', e.response?.data?.message || e.message);
        } finally {
            setAcknowledging(false);
            acknowledgingRef.current = false;
        }
    };

    const handleResumeStuckTask = (task) => {
        clearAlarmAcknowledged(task);
        SecureStore.setMemoryItem('current_task', JSON.stringify(task));
        router.push({ pathname: '/activetask', params: { batchId: task.batch_id } });
    };

    const openTask = (task) => {
        SecureStore.setMemoryItem('current_task', JSON.stringify(task));
        router.push({ pathname: '/activetask', params: { batchId: task.batch_id } });
    };

    const handleLogout = async () => {
        await cancelAllTaskAlarms();
        await dismissAllAlarms();
        await stopAlarmSound();
        await SecureStore.deleteItemAsync('worker_token');
        router.replace('/');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'RUNNING': return '#273AF8'; // Electric Royal Blue
            case 'PAUSED': return '#EA33FF';  // Neon Magenta
            case 'ALARM': return '#D32F2F';   // Urgent Red
            default: return '#33C3FF';        // Sky Blue
        }
    };

    // ─── Attendance Screen ───────────────────────────────────────────────────
    if (checkingAttendance) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#273AF8" />
                </View>
            </SafeAreaView>
        );
    }

    if (!attendanceMarked) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <ScrollView
                    contentContainerStyle={styles.centerScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={true}
                >
                    <View style={styles.welcomeCard}>
                        <View style={styles.welcomeEmojiCircle}>
                            <Text style={styles.welcomeMonogram}>R</Text>
                        </View>
                        <Text style={styles.title}>WELCOME TO RAMBHAJI</Text>
                        <Text style={styles.subtitle}>Please mark your attendance to access batches and start production tasks.</Text>
                        <TouchableOpacity style={styles.mainBtn} onPress={handleMarkAttendance} disabled={loading} activeOpacity={0.85}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Mark Attendance</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutBtnOutline} onPress={handleLogout} activeOpacity={0.85}>
                            <Text style={styles.logoutBtnOutlineText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const totalActiveBackground = myTasks.length + stuckTasks.length;

    // ─── Render Screen Content Based on Tab ──────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            {/* Header App Bar */}
            <View style={styles.header}>
                <View style={[styles.headerInner, { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerLogoCircle}>
                            <Text style={styles.headerLogoMonogram}>R</Text>
                        </View>
                        <View style={styles.headerTitleCol}>
                            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">RAMBHAJI KITCHEN</Text>
                            <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">Active Shift • Worker {workerId ? `#${workerId}` : ''}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        {totalActiveBackground > 0 && currentTab !== 'background' && (
                            <TouchableOpacity
                                onPress={() => setCurrentTab('background')}
                                style={styles.headerAlertPill}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.headerAlertText}>{totalActiveBackground} Active</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutPill} activeOpacity={0.8}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Main Content Area */}
            {currentTab === 'history' ? (
                <View style={[
                    styles.historyTabWrapper,
                    {
                        flex: 1,
                        paddingHorizontal: isSmallPhone ? 12 : (isTablet ? 24 : 18),
                        paddingTop: 12,
                        maxWidth: contentMaxWidth,
                        width: '100%',
                        alignSelf: 'center',
                    }
                ]}>
                    <TimerHistoryView />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={[
                        styles.scrollContentContainer,
                        { 
                            paddingHorizontal: isSmallPhone ? 12 : (isTablet ? 24 : 18),
                            paddingBottom: 68 + Math.max(insets.bottom, 12) + 24 
                        }
                    ]}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    bounces={true}
                    alwaysBounceVertical={true}
                >
                    <View style={[styles.mainContentWrapper, { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
                    {/* ══════════════════ TAB 1: DASHBOARD ══════════════════ */}
                    {currentTab === 'dashboard' && (
                    <View>
                        {/* Quick Quick-Switch Banner if background tasks are running */}
                        {myTasks.length > 0 && (
                            <TouchableOpacity
                                style={styles.runningBanner}
                                onPress={() => setCurrentTab('background')}
                                activeOpacity={0.88}
                            >
                                <View style={styles.runningBannerLeft}>
                                    <View style={styles.runningBannerEmojiCircle}>
                                        <Ionicons name="time-outline" size={22} color="#273AF8" />
                                    </View>
                                    <View>
                                        <Text style={styles.runningBannerTitle}>{myTasks.length} Background Task{myTasks.length > 1 ? 's' : ''} Running</Text>
                                        <Text style={styles.runningBannerSub}>Tap to view live countdowns & status</Text>
                                    </View>
                                </View>
                                <Text style={styles.runningBannerArrow}>View →</Text>
                            </TouchableOpacity>
                        )}

                        {/* Stuck Tasks Quick Banner */}
                        {stuckTasks.length > 0 && (
                            <TouchableOpacity
                                style={styles.stuckBanner}
                                onPress={() => setCurrentTab('background')}
                                activeOpacity={0.88}
                            >
                                <View style={styles.runningBannerLeft}>
                                    <View style={[styles.runningBannerEmojiCircle, { backgroundColor: '#FDF0FF', borderColor: '#F5B8FC' }]}>
                                        <Ionicons name="pause-circle-outline" size={22} color="#EA33FF" />
                                    </View>
                                    <View>
                                        <Text style={styles.stuckBannerTitle}>{stuckTasks.length} Task{stuckTasks.length > 1 ? 's' : ''} Paused / Needs Resume</Text>
                                        <Text style={styles.stuckBannerSub}>Tap to resume and avoid batch delays</Text>
                                    </View>
                                </View>
                                <Text style={styles.stuckBannerArrow}>Resume →</Text>
                            </TouchableOpacity>
                        )}

                        {/* ─── Batch Selection ─────────────────────────── */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Active Batches</Text>
                                <Text style={styles.badgeCount}>{batches.length} Available</Text>
                            </View>
                            {batches.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>No active batches found for today.</Text>
                                </View>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.batchList}
                                    nestedScrollEnabled={true}
                                    keyboardShouldPersistTaps="handled"
                                    directionalLockEnabled={true}
                                >
                                    {batches.map(item => (
                                        <TouchableOpacity
                                            key={item.id.toString()}
                                            style={[styles.batchCard, selectedBatch === item.id && styles.batchCardActive]}
                                            onPress={() => selectBatch(item.id)}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={[styles.batchText, selectedBatch === item.id && styles.batchTextActive]}>
                                                {selectedBatch === item.id ? `✓ ${item.name}` : item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* ─── Batch Demands List (Full visibility) ───── */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>{"Today's Demand List"}</Text>
                                <Text style={styles.badgeCount}>{demands.length} Items</Text>
                            </View>
                            {!selectedBatch ? (
                                <View style={styles.promptCard}>
                                    <Ionicons name="information-circle-outline" size={22} color="#64748B" style={{ marginRight: 8 }} />
                                    <Text style={styles.promptCardText}>Upar diye gaye batch ko tap karo to demand list load ho jayegi.</Text>
                                </View>
                            ) : demands.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Text style={styles.emptyText}>Is batch ke liye koi demand data nahi mila.</Text>
                                </View>
                            ) : (
                                <View style={styles.demandList}>
                                    {demands.map((d, idx) => (
                                        <View key={idx} style={[styles.demandRow, idx === demands.length - 1 && { borderBottomWidth: 0 }]}>
                                            <View style={styles.demandLeft}>
                                                <View style={styles.demandIconCircle}>
                                                    <Ionicons name="leaf-outline" size={16} color="#10B981" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.demandName} numberOfLines={2}>
                                                        {formatProductName(d)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.demandQtyBadge}>
                                                <Text style={styles.demandQty}>{d.quantity || d.quantity_grams || 0}g</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* ─── Fetch Task Action Card ─────────────────── */}
                        <View style={styles.actionCard}>
                            <View style={styles.actionCardHeader}>
                                <View style={styles.actionIconCircle}>
                                    <Ionicons name="arrow-forward-circle-outline" size={24} color="#273AF8" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.actionCardTitle}>Ready for Next Work?</Text>
                                    <Text style={styles.actionCardSub}>
                                        {selectedBatch 
                                            ? 'Batch select ho chuka hai. Niche button dabate hi agla stage assign hoga.' 
                                            : 'Pehle upar se batch select karein, fir agla task start karein.'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.mainBtn, !selectedBatch && styles.btnDisabled]}
                                onPress={fetchNextTask}
                                disabled={loading || !selectedBatch}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.mainBtnText}>
                                        {selectedBatch ? 'Fetch Next Task →' : 'Pehle Batch Select Karo'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ══════════════════ TAB 2: BACKGROUND ══════════════════ */}
                {currentTab === 'background' && (
                    <View>
                        {/* Stuck / Paused Tasks Section */}
                        {stuckTasks.length > 0 && (
                            <View style={styles.stuckSection}>
                                <Text style={styles.stuckTitle}>Ruke Hue Tasks ({stuckTasks.length})</Text>
                                <Text style={styles.stuckSubtitle}>
                                    Yeh tasks PAUSED hain. Inhe resume karo → timer chalega → alarm → done hoga.
                                </Text>
                                {stuckTasks.map(task => {
                                    const remainingMin = Math.ceil((task.remaining_seconds || 0) / 60);
                                    return (
                                        <View key={task.id.toString()} style={styles.stuckCard}>
                                            <View style={styles.stuckCardLeft}>
                                                <Text style={styles.stuckCardStage}>{task.stage}</Text>
                                                <Text style={styles.stuckCardProduct}>
                                                    {formatProductName(task)}
                                                </Text>
                                                <Text style={styles.stuckCardQty}>Weight: {task.quantity_grams}g</Text>
                                                <Text style={styles.stuckCardRemaining}>~{remainingMin} min bacha</Text>
                                                <View style={[styles.stuckStatusBadge, task.status === 'PAUSED' ? styles.stuckStatusPaused : styles.stuckStatusNotStarted]}>
                                                    <Text style={styles.stuckStatusText}>{task.status}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.stuckResumeBtn}
                                                onPress={() => handleResumeStuckTask(task)}
                                                activeOpacity={0.85}
                                            >
                                                <Text style={styles.stuckResumeBtnText}>Resume{`\n`}Karo</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Running Background Tasks */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Active Running Timers</Text>
                                <Text style={styles.badgeCount}>{myTasks.length} Active</Text>
                            </View>

                            {myTasks.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Ionicons name="timer-outline" size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
                                    <Text style={styles.emptyCardTitle}>Koi running background task nahi hai</Text>
                                    <Text style={styles.emptyCardSub}>
                                        Naya task start karne ke liye Dashboard tab par jayein aur Fetch Next Task karein.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.emptyActionBtn}
                                        onPress={() => setCurrentTab('dashboard')}
                                    >
                                        <Text style={styles.emptyActionBtnText}>Go to Dashboard →</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                myTasks.map(item => (
                                    <TouchableOpacity
                                        key={item.id.toString()}
                                        style={[
                                            styles.taskCard,
                                            { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 5 },
                                            item.status === 'ALARM' && styles.taskCardAlarm
                                        ]}
                                        onPress={() => openTask(item)}
                                        activeOpacity={0.85}
                                    >
                                        <View style={styles.taskCardLeft}>
                                            <Text style={styles.taskStageBadge}>{item.stage}</Text>
                                            <Text style={styles.taskCardTitle}>
                                                {formatProductName(item)}
                                            </Text>
                                            <Text style={styles.taskCardSub}>Weight: {item.quantity_grams}g</Text>
                                            <LiveCountdown task={item} />
                                        </View>
                                        <View style={styles.taskCardRight}>
                                            <Text style={[styles.taskCardStatus, { color: getStatusColor(item.status) }]}>
                                                {item.status}
                                            </Text>
                                            <View style={styles.taskCardTapPill}>
                                                <Text style={styles.taskCardTap}>View Task →</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                )}



                {/* ══════════════════ TAB 4: SETTINGS ══════════════════ */}
                {currentTab === 'settings' && (
                    <View style={styles.settingsContainer}>
                        {/* Settings Overview Header Banner */}
                        <View style={styles.settingsHeaderBanner}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={[styles.settingsHeaderTitle, { fontSize: scaleFont(20) }]} numberOfLines={1}>
                                    Settings & Station
                                </Text>
                                <Text style={[styles.settingsHeaderSub, { fontSize: scaleFont(12) }]} numberOfLines={1}>
                                    Manage kitchen terminal, audio alerts & shift profile
                                </Text>
                            </View>
                            <View style={styles.terminalStatusPill}>
                                <View style={styles.statusDotLive} />
                                <Text style={styles.terminalStatusPillText}>TERMINAL READY</Text>
                            </View>
                        </View>

                        {/* ── Section 1: WORKER & STATION PROFILE ── */}
                        <View style={styles.settingsSectionHeader}>
                            <Ionicons name="person-circle-outline" size={16} color={ThemeColors.royalBlue} />
                            <Text style={styles.settingsSectionHeaderText}>WORKER & STATION PROFILE</Text>
                        </View>

                        <View style={styles.settingsCard}>
                            {/* Profile Card Top */}
                            <View style={styles.profileHeaderRow}>
                                <View style={styles.profileAvatarCircle}>
                                    <Ionicons name="person" size={24} color={ThemeColors.royalBlue} />
                                    <View style={styles.avatarVerifiedBadge}>
                                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                                    </View>
                                </View>
                                <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 12 }}>
                                    <Text style={styles.profileNameText} numberOfLines={1}>
                                        {workerId ? `Worker #${workerId}` : 'Kitchen Staff #1'}
                                    </Text>
                                    <Text style={styles.profileStationText} numberOfLines={1}>
                                        RAMBHAJI Kitchen Prep Terminal
                                    </Text>
                                </View>
                                <View style={styles.shiftActiveBadge}>
                                    <View style={styles.activeDotGreen} />
                                    <Text style={styles.shiftActiveBadgeText}>ON SHIFT</Text>
                                </View>
                            </View>

                            <View style={styles.profileDivider} />

                            {/* Profile Details List */}
                            <View style={styles.profileDetailRow}>
                                <View style={styles.detailLabelGroup}>
                                    <Ionicons name="hardware-chip-outline" size={16} color="#64748B" />
                                    <Text style={styles.profileKey}>Worker Station ID</Text>
                                </View>
                                <View style={styles.profileValuePill}>
                                    <Text style={styles.profileValue}>{workerId ? `#${workerId}` : 'Staff #1'}</Text>
                                </View>
                            </View>

                            <View style={styles.profileDetailRow}>
                                <View style={styles.detailLabelGroup}>
                                    <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
                                    <Text style={styles.profileKey}>Shift Attendance</Text>
                                </View>
                                <View style={styles.attendanceStatusBadge}>
                                    <Ionicons name="checkmark-done" size={14} color="#059669" />
                                    <Text style={styles.attendanceStatusText}>Present (Verified)</Text>
                                </View>
                            </View>

                            <View style={styles.profileDetailRow}>
                                <View style={styles.detailLabelGroup}>
                                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                                    <Text style={styles.profileKey}>Shift Work Date</Text>
                                </View>
                                <Text style={styles.profileValue}>{getTodayDateString()}</Text>
                            </View>

                            <View style={[styles.profileDetailRow, { borderBottomWidth: 0 }]}>
                                <View style={styles.detailLabelGroup}>
                                    <Ionicons name="phone-portrait-outline" size={16} color="#64748B" />
                                    <Text style={styles.profileKey}>Device Platform</Text>
                                </View>
                                <Text style={styles.profileValue}>
                                    {Platform.OS === 'android' ? 'Android Station' : 'iOS Terminal'}
                                </Text>
                            </View>
                        </View>

                        {/* ── Section 2: AUDIO & ALERTS ── */}
                        <View style={styles.settingsSectionHeader}>
                            <Ionicons name="volume-high-outline" size={16} color={ThemeColors.royalBlue} />
                            <Text style={styles.settingsSectionHeaderText}>AUDIO & ALERTS</Text>
                        </View>

                        {/* Current Ringtone Summary Tile */}
                        <View style={styles.soundHighlightCard}>
                            <View style={styles.soundHighlightLeft}>
                                <View style={styles.soundHighlightIconCircle}>
                                    <Ionicons name="musical-notes" size={20} color={ThemeColors.royalBlue} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.soundHighlightLabel}>Active Alarm Sound</Text>
                                    <Text style={styles.soundHighlightName} numberOfLines={1}>{selectedSoundName}</Text>
                                    <Text style={styles.soundHighlightDesc} numberOfLines={1}>
                                        Rings when countdown reaches 0:00
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.soundActivePill}>
                                <Ionicons name="notifications-outline" size={12} color="#059669" />
                                <Text style={styles.soundActivePillText}>ACTIVE</Text>
                            </View>
                        </View>

                        {/* Ringtone Selection Panel */}
                        <View style={styles.settingsCard}>
                            <View style={styles.ringtoneCardHeader}>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.settingsCardTitle}>रिंगटोन चयन (Ringtone Library)</Text>
                                    <Text style={styles.settingsCardSub}>Select high-priority sound for countdown completion</Text>
                                </View>
                            </View>

                            {/* Ringtone Selector Component */}
                            <RingtoneSelector
                                onSelect={(key) => {
                                    const name = getRingtoneName(key);
                                    setSelectedSoundName(name);
                                }}
                                showTestButton={true}
                                showExplanation={true}
                            />
                        </View>

                        {/* ── Section 3: APPLICATION & COMPLIANCE ── */}
                        <View style={styles.settingsSectionHeader}>
                            <Ionicons name="shield-checkmark-outline" size={16} color={ThemeColors.royalBlue} />
                            <Text style={styles.settingsSectionHeaderText}>APPLICATION & COMPLIANCE</Text>
                        </View>

                        <View style={styles.groupedListCard}>
                            {/* Row: About App */}
                            <TouchableOpacity
                                style={styles.groupedListItem}
                                onPress={() => setIsAboutModalOpen(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.groupedListLeft}>
                                    <View style={[styles.groupedIconSquircle, { backgroundColor: '#EEF0FE', borderColor: '#CCD2FC' }]}>
                                        <Ionicons name="information-circle-outline" size={22} color={ThemeColors.royalBlue} />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={styles.groupedItemTitle}>About App</Text>
                                        <Text style={styles.groupedItemSub} numberOfLines={1}>
                                            {APP_INFO.fullDisplayName}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.groupedListRight}>
                                    <View style={styles.versionPill}>
                                        <Text style={styles.versionPillText}>v{APP_INFO.version}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.groupedDivider} />

                            {/* Row: Privacy & Legal */}
                            <TouchableOpacity
                                style={styles.groupedListItem}
                                onPress={() => setIsPrivacyLegalModalOpen(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.groupedListLeft}>
                                    <View style={[styles.groupedIconSquircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                        <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={styles.groupedItemTitle}>Privacy & Legal</Text>
                                        <Text style={styles.groupedItemSub} numberOfLines={1}>
                                            Privacy Policy, Terms of Service, Open Source
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                            </TouchableOpacity>

                            <View style={styles.groupedDivider} />

                            {/* Row: Release Stream */}
                            <View style={styles.groupedListItem}>
                                <View style={styles.groupedListLeft}>
                                    <View style={[styles.groupedIconSquircle, { backgroundColor: '#FDF0FF', borderColor: '#F5B8FC' }]}>
                                        <Ionicons name="layers-outline" size={20} color={ThemeColors.magenta} />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={styles.groupedItemTitle}>Release Stream</Text>
                                        <Text style={styles.groupedItemSub} numberOfLines={1}>
                                            {APP_INFO.releaseName} • Official Build
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.releaseBadge}>
                                    <Text style={styles.releaseBadgeText}>Genesis</Text>
                                </View>
                            </View>
                        </View>

                        {/* ── Section 4: SESSION MANAGEMENT ── */}
                        <View style={styles.settingsSectionHeader}>
                            <Ionicons name="power-outline" size={16} color="#EF4444" />
                            <Text style={[styles.settingsSectionHeaderText, { color: '#EF4444' }]}>SESSION MANAGEMENT</Text>
                        </View>

                        <View style={styles.logoutCard}>
                            <View style={styles.logoutNoticeRow}>
                                <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" style={{ marginRight: 8, flexShrink: 0 }} />
                                <Text style={styles.logoutNoticeText}>
                                    Ending your shift session will securely sign out of this station terminal and conclude today&apos;s active session.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.logoutActionBtn}
                                onPress={() => {
                                    Alert.alert(
                                        'शिफ्ट से लॉगआउट (Shift Logout)',
                                        'क्या आप वाकई अपना सत्र समाप्त करके लॉगआउट करना चाहते हैं?',
                                        [
                                            { text: 'रद्द करें', style: 'cancel' },
                                            { text: 'लॉगआउट', style: 'destructive', onPress: handleLogout }
                                        ]
                                    );
                                }}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                <Text style={styles.logoutActionBtnText}>Logout from Shift</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ── Station Watermark / Footer ── */}
                        <View style={styles.settingsFooter}>
                            <Text style={styles.settingsFooterTitle}>
                                {APP_INFO.name} • v{APP_INFO.version} ({APP_INFO.releaseName})
                            </Text>
                            <Text style={styles.settingsFooterSubtitle}>
                                Developed by {APP_INFO.developer} for {APP_INFO.company}
                            </Text>
                        </View>
                    </View>
                )}
                </View>
            </ScrollView>
            )}

            {/* ══════════════════ FIXED BOTTOM TAB BAR ══════════════════ */}
            <View style={[
                styles.bottomTabBar,
                { paddingBottom: Math.max(insets.bottom, 8), height: 56 + Math.max(insets.bottom, 8) }
            ]}>
                <View style={[styles.bottomTabBarInner, { maxWidth: isTablet ? 600 : '100%', width: '100%', alignSelf: 'center' }]}>
                    <TouchableOpacity
                        style={[styles.tabItem, currentTab === 'dashboard' && styles.tabItemActive]}
                        onPress={() => setCurrentTab('dashboard')}
                        activeOpacity={0.8}
                    >
                        <Ionicons 
                            name={currentTab === 'dashboard' ? 'grid' : 'grid-outline'} 
                            size={21} 
                            color={currentTab === 'dashboard' ? '#273AF8' : '#64748B'} 
                        />
                        <Text style={[styles.tabLabel, currentTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, currentTab === 'background' && styles.tabItemActive]}
                        onPress={() => setCurrentTab('background')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.tabIconWrapper}>
                            <Ionicons 
                                name={currentTab === 'background' ? 'time' : 'time-outline'} 
                                size={21} 
                                color={currentTab === 'background' ? '#273AF8' : '#64748B'} 
                            />
                            {totalActiveBackground > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{totalActiveBackground}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.tabLabel, currentTab === 'background' && styles.tabLabelActive]}>Background</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, currentTab === 'history' && styles.tabItemActive]}
                        onPress={() => setCurrentTab('history')}
                        activeOpacity={0.8}
                    >
                        <Ionicons 
                            name={currentTab === 'history' ? 'receipt' : 'receipt-outline'} 
                            size={20} 
                            color={currentTab === 'history' ? '#273AF8' : '#64748B'} 
                        />
                        <Text style={[styles.tabLabel, currentTab === 'history' && styles.tabLabelActive]}>History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabItem, currentTab === 'settings' && styles.tabItemActive]}
                        onPress={() => setCurrentTab('settings')}
                        activeOpacity={0.8}
                    >
                        <Ionicons 
                            name={currentTab === 'settings' ? 'settings' : 'settings-outline'} 
                            size={21} 
                            color={currentTab === 'settings' ? '#273AF8' : '#64748B'} 
                        />
                        <Text style={[styles.tabLabel, currentTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── ALARM MODAL (SINGLE TRIGGER ONLY) ───────────────────────── */}
            <Modal visible={isAlarmModalOpen} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <ScrollView
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <View style={styles.alarmModalContent}>
                            <View style={styles.alarmEmojiCircle}>
                                <Ionicons name="notifications" size={32} color="#D32F2F" />
                            </View>
                            <Text style={styles.alarmTitle}>टाइमर पूरा हुआ!</Text>
                            <Text style={styles.alarmStage}>{alarmTask?.stage} स्टेज तैयार है</Text>
                            <Text style={styles.alarmProduct}>
                                {formatProductName(alarmTask)}
                            </Text>
                            <Text style={styles.alarmQty}>वजन: {alarmTask?.quantity_grams}g</Text>

                            <TouchableOpacity
                                style={styles.alarmAckBtn}
                                onPress={handleAcknowledgeAlarm}
                                disabled={acknowledging}
                                activeOpacity={0.85}
                            >
                                {acknowledging ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.alarmAckBtnText}>स्वीकार करें और अगला स्टेज शुरू करें</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.alarmViewBtn}
                                onPress={() => {
                                    setIsAlarmModalOpen(false);
                                    openTask(alarmTask);
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.alarmViewBtnText}>कार्य विवरण देखें →</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* ─── ALARM RINGTONE SETTINGS MODAL ─────────────────────── */}
            <AlarmSettingsModal
                visible={isSettingsModalOpen}
                onClose={async () => {
                    setIsSettingsModalOpen(false);
                    const savedRingtone = await getSelectedRingtoneKey();
                    if (savedRingtone) {
                        setSelectedSoundName(getRingtoneName(savedRingtone));
                    }
                }}
            />

            {/* ─── ABOUT APP MODAL ────────────────────────────────────── */}
            <AboutAppModal
                visible={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
            />

            {/* ─── PRIVACY & LEGAL MODAL ──────────────────────────────── */}
            <PrivacyLegalModal
                visible={isPrivacyLegalModalOpen}
                onClose={() => setIsPrivacyLegalModalOpen(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, maxWidth: 440, width: '100%', alignSelf: 'center' },
    centerScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, maxWidth: 440, width: '100%', alignSelf: 'center' },
    modalScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 20 },
    welcomeCard: { backgroundColor: '#FFFFFF', padding: 28, borderRadius: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card },
    welcomeEmojiCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF0FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#CCD2FC' },
    welcomeMonogram: { fontSize: 32, fontWeight: '900', color: '#273AF8' },
    title: { 
        fontFamily: Platform.OS === 'ios' ? 'Copperplate' : 'serif',
        fontSize: 24, 
        fontWeight: '900', 
        color: '#0F172A', 
        marginBottom: 8, 
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    subtitle: { fontSize: 14, color: '#64748B', marginBottom: 24, textAlign: 'center', lineHeight: 20 },
    mainBtn: { backgroundColor: '#273AF8', paddingVertical: 15, paddingHorizontal: 28, borderRadius: 14, width: '100%', alignItems: 'center', ...Shadows.buttonPrimary },
    btnDisabled: { opacity: 0.6, backgroundColor: '#939DFA' },
    mainBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
    logoutBtnOutline: { marginTop: 14, paddingVertical: 13, borderRadius: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
    logoutBtnOutlineText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
    header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', ...Shadows.card },
    headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, marginRight: 8 },
    headerLogoCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF0FE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CCD2FC', flexShrink: 0 },
    headerLogoMonogram: { fontSize: 18, fontWeight: '900', color: '#273AF8' },
    headerTitleCol: { flex: 1, minWidth: 0 },
    headerTitle: { 
        fontFamily: Platform.OS === 'ios' ? 'Copperplate' : 'serif',
        fontSize: 16, 
        fontWeight: '900', 
        color: '#0F172A', 
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    headerSubtitle: { fontSize: 11, fontWeight: '600', color: '#10B981', marginTop: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
    headerAlertPill: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 9999, backgroundColor: '#FDF0FF', borderWidth: 1, borderColor: '#F5B8FC' },
    headerAlertText: { color: '#EA33FF', fontWeight: '800', fontSize: 11 },
    logoutPill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },

    // Scroll Area with generous clearance for bottom tab bar
    scrollArea: { flex: 1 },
    scrollContentContainer: { padding: 18, paddingBottom: 140 },
    mainContentWrapper: { width: '100%' },

    section: { marginBottom: 20 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
    badgeCount: { backgroundColor: '#EEF0FE', color: '#273AF8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
    emptyText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

    // Running Banner
    runningBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#EEF0FE', borderRadius: 16, padding: 14, marginBottom: 18,
        borderWidth: 1.5, borderColor: '#CCD2FC', ...Shadows.card,
    },
    runningBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 8 },
    runningBannerEmoji: { fontSize: 26 },
    runningBannerTitle: { fontSize: 14, fontWeight: '800', color: '#273AF8' },
    runningBannerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    runningBannerArrow: { fontSize: 18, fontWeight: '800', color: '#273AF8', paddingRight: 4, flexShrink: 0 },

    // Stuck Banner
    stuckBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FDF0FF', borderRadius: 16, padding: 14, marginBottom: 18,
        borderWidth: 1.5, borderColor: '#F5B8FC', ...Shadows.card,
    },
    stuckBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, paddingRight: 8 },
    stuckBannerTitle: { fontSize: 14, fontWeight: '800', color: '#EA33FF' },
    stuckBannerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    stuckBannerArrow: { fontSize: 13, fontWeight: '800', color: '#EA33FF', paddingRight: 4, flexShrink: 0 },

    // Running Task Cards
    taskCard: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16,
        marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0',
        overflow: 'hidden', ...Shadows.card,
    },
    taskCardAlarm: { backgroundColor: '#FFF5F5', borderColor: '#FECACA' },
    taskCardLeft: { flex: 1, minWidth: 0, paddingRight: 10 },
    taskCardRight: { alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 60, flexShrink: 0 },
    taskStageBadge: { alignSelf: 'flex-start', backgroundColor: '#EEF0FE', color: '#273AF8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, fontSize: 11, fontWeight: '800', overflow: 'hidden', marginBottom: 6 },
    taskCardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', lineHeight: 22 },
    taskCardSub: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
    taskCardTimerPill: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EEF0FE' },
    taskCardTimerPillWarning: { backgroundColor: '#FDF0FF' },
    taskCardTimerPillAlarm: { backgroundColor: '#FEF2F2' },
    taskCardTimer: { fontSize: 14, fontWeight: '800', color: '#273AF8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    taskCardTimerWarning: { color: '#EA33FF' },
    taskCardTimerAlarm: { color: '#EF4444' },
    taskCardStatus: { fontSize: 11, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F1F5F9' },
    taskCardTapPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    taskCardTap: { fontSize: 11, color: '#273AF8', fontWeight: '700' },

    // Batches
    batchList: { paddingVertical: 4 },
    batchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginRight: 10,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        minHeight: 44,
        ...Shadows.card
    },
    batchCardActive: {
        backgroundColor: '#273AF8',
        borderColor: '#273AF8',
        ...Shadows.buttonPrimary
    },
    batchCardIcon: { fontSize: 13 },
    batchText: { color: '#334155', fontWeight: '700', fontSize: 14 },
    batchTextActive: { color: '#FFFFFF', fontWeight: '800' },

    // Demands
    demandList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadows.card
    },
    demandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    demandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        paddingRight: 10
    },
    demandIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EEF0FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    demandIconEmoji: { fontSize: 16 },
    demandName: { fontSize: 14, color: '#0F172A', fontWeight: '700', lineHeight: 20 },
    demandQtyBadge: {
        backgroundColor: '#EEF0FE',
        borderWidth: 1,
        borderColor: '#CCD2FC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10
    },
    demandQty: { fontSize: 13, color: '#273AF8', fontWeight: '800' },

    // Action Card
    actionCard: {
        backgroundColor: '#FAFCFF',
        borderRadius: 20,
        padding: 18,
        marginTop: 10,
        borderWidth: 1.5,
        borderColor: '#CCD2FC',
        ...Shadows.card,
    },
    actionCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEF0FE',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCD2FC',
    },
    actionEmoji: {
        fontSize: 22,
    },
    actionCardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    actionCardSub: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 17 },

    // Prompt & Empty cards
    promptCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card },
    promptCardEmoji: { fontSize: 32, marginBottom: 8 },
    promptCardText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
    emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...Shadows.card },
    emptyEmoji: { fontSize: 36, marginBottom: 10 },
    emptyCardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    emptyCardSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 14 },
    emptyActionBtn: { backgroundColor: '#EEF0FE', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    emptyActionBtnText: { color: '#273AF8', fontSize: 13, fontWeight: '700' },

    // Stuck Tasks Section
    stuckSection: {
        backgroundColor: '#FDF0FF', borderRadius: 18, padding: 18,
        marginBottom: 22, borderWidth: 1.5, borderColor: '#F5B8FC', ...Shadows.card,
    },
    stuckTitle: { fontSize: 16, fontWeight: '800', color: '#EA33FF', marginBottom: 4 },
    stuckSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 18 },
    stuckCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#F5B8FC', ...Shadows.card,
    },
    stuckCardLeft: { flex: 1, paddingRight: 10 },
    stuckCardStage: { fontSize: 14, fontWeight: '800', color: '#EA33FF' },
    stuckCardProduct: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 2 },
    stuckCardQty: { fontSize: 12, color: '#64748B', marginTop: 2 },
    stuckStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
    stuckStatusPaused: { backgroundColor: '#FDF0FF' },
    stuckStatusNotStarted: { backgroundColor: '#EEF0FE' },
    stuckStatusText: { fontSize: 10, fontWeight: '700', color: '#EA33FF' },
    stuckCardRemaining: { fontSize: 12, color: '#273AF8', fontWeight: '700', marginTop: 4 },
    stuckResumeBtn: {
        backgroundColor: '#273AF8', paddingVertical: 10, paddingHorizontal: 16,
        borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...Shadows.buttonPrimary,
    },
    stuckResumeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },

    // ─── Settings Tab Styles (Systematic & Professional) ────────────────────────
    settingsContainer: {
        paddingBottom: 20,
    },
    settingsHeaderBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    settingsHeaderTitle: {
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    settingsHeaderSub: {
        color: '#64748B',
        marginTop: 2,
    },
    terminalStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        flexShrink: 0,
    },
    statusDotLive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    terminalStatusPillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#059669',
        letterSpacing: 0.5,
    },
    settingsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    settingsSectionHeaderText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
    },
    settingsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    settingsCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    settingsCardSub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    profileHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileAvatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF0FE',
        borderWidth: 2,
        borderColor: '#CCD2FC',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        flexShrink: 0,
    },
    avatarVerifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileNameText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    profileStationText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    shiftActiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        flexShrink: 0,
    },
    activeDotGreen: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#059669',
    },
    shiftActiveBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#059669',
        letterSpacing: 0.5,
    },
    profileDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    profileDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    detailLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileKey: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    profileValue: {
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '700',
    },
    profileValuePill: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    attendanceStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    attendanceStatusText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#059669',
    },
    soundHighlightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EEF0FE',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#CCD2FC',
    },
    soundHighlightLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    soundHighlightIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#CCD2FC',
        flexShrink: 0,
    },
    soundHighlightLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: ThemeColors.royalBlue,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    soundHighlightName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 1,
    },
    soundHighlightDesc: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    soundActivePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        flexShrink: 0,
    },
    soundActivePillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#059669',
        letterSpacing: 0.5,
    },
    ringtoneCardHeader: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    groupedListCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        ...Shadows.card,
    },
    groupedListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    groupedListLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
        paddingRight: 10,
    },
    groupedIconSquircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    groupedItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    groupedItemSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    groupedListRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
    },
    groupedDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 66,
    },
    versionPill: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CCD2FC',
    },
    versionPillText: {
        fontSize: 11,
        fontWeight: '800',
        color: ThemeColors.royalBlue,
    },
    releaseBadge: {
        backgroundColor: '#FDF0FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F5B8FC',
    },
    releaseBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: ThemeColors.magenta,
    },
    logoutCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#FECACA',
        ...Shadows.card,
    },
    logoutNoticeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 14,
    },
    logoutNoticeText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 17,
        fontWeight: '500',
    },
    logoutActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
    },
    logoutActionBtnText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    settingsFooter: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 8,
    },
    settingsFooterTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    settingsFooterSubtitle: {
        fontSize: 11,
        color: '#CBD5E1',
        marginTop: 3,
    },

    // ─── Fixed Bottom Tab Bar ──────────────────────────────────────────────
    bottomTabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.modal,
    },
    bottomTabBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 12,
        marginHorizontal: 2,
        minHeight: 44,
    },
    tabItemActive: {
        backgroundColor: '#EEF0FE',
    },
    tabIconWrapper: {
        position: 'relative',
    },
    tabIcon: {
        fontSize: 18,
        opacity: 0.65,
    },
    tabIconActive: {
        opacity: 1,
    },
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#EA33FF',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 16,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    tabLabelActive: {
        color: '#273AF8',
        fontWeight: '800',
    },

    // Alarm Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    alarmModalContent: {
        backgroundColor: '#FFFFFF', width: '100%', maxWidth: 440, borderRadius: 24,
        padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#FCA5A5', ...Shadows.modal,
    },
    alarmEmojiCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    alarmEmoji: { fontSize: 44 },
    alarmTitle: { fontSize: 24, fontWeight: '800', color: '#EF4444', marginBottom: 4, letterSpacing: -0.5, textAlign: 'center' },
    alarmStage: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4, textAlign: 'center' },
    alarmProduct: { fontSize: 16, color: '#64748B', marginBottom: 4, textAlign: 'center' },
    alarmQty: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginBottom: 20, textAlign: 'center' },
    alarmAckBtn: { backgroundColor: '#EF4444', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10, ...Shadows.buttonPrimary },
    alarmAckBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textAlign: 'center' },
    alarmViewBtn: { paddingVertical: 10, width: '100%', alignItems: 'center' },
    alarmViewBtnText: { color: '#273AF8', fontSize: 14, fontWeight: '700', textAlign: 'center' },
    historyTabWrapper: { flex: 1, width: '100%' },
});
