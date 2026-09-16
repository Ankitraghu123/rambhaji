import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import {
    ALARM_RINGTONES,
    getRingtoneAudioModule,
    getSelectedRingtoneKey,
    setSelectedRingtoneKey,
    scheduleTaskAlarm,
} from '../src/utils/notificationHelper';
import { ThemeColors, Shadows } from '../constants/theme';
import { useResponsive } from '../src/utils/responsive';

/**
 * RingtoneSelector Component
 * Provides a responsive list of available alarm ringtones with radio selection,
 * audio preview, auto-persistence across app restarts, and a 5-second test alarm.
 *
 * @param {Object} props
 * @param {function} [props.onSelect] - Optional callback triggered on ringtone selection with the ringtone key.
 * @param {boolean} [props.showTestButton=true] - Whether to show the 5-second test alarm button.
 * @param {boolean} [props.showExplanation=true] - Whether to show native lock-screen explanation text.
 */
export default function RingtoneSelector({
    onSelect,
    showTestButton = true,
    showExplanation = true,
}) {
    const { scaleFont } = useResponsive();
    const [selectedKey, setSelectedKey] = useState('alarm1');
    const [previewingKey, setPreviewingKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testingAlarm, setTestingAlarm] = useState(false);

    const soundRef = useRef(null);
    const testTimerRef = useRef(null);
    const isMountedRef = useRef(true);

    // Load persisted ringtone on mount
    useEffect(() => {
        isMountedRef.current = true;
        getSelectedRingtoneKey().then((key) => {
            if (isMountedRef.current) {
                const activeKey = key || 'alarm1';
                setSelectedKey(activeKey);
                setLoading(false);
            }
        });

        return () => {
            isMountedRef.current = false;
            stopPreview();
            if (testTimerRef.current) {
                clearTimeout(testTimerRef.current);
            }
        };
    }, []);

    const stopPreview = async () => {
        if (isMountedRef.current) {
            setPreviewingKey(null);
        }
        if (soundRef.current) {
            try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch (_e) {}
            soundRef.current = null;
        }
    };

    const handlePreview = async (ringtoneKey) => {
        // If already previewing this sound, stop it
        if (previewingKey === ringtoneKey) {
            await stopPreview();
            return;
        }

        await stopPreview();
        if (isMountedRef.current) {
            setPreviewingKey(ringtoneKey);
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
            }).catch(() => {});

            const module = getRingtoneAudioModule(ringtoneKey);
            const { sound } = await Audio.Sound.createAsync(module);
            soundRef.current = sound;
            await sound.setIsLoopingAsync(false);
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    if (isMountedRef.current) {
                        setPreviewingKey(null);
                    }
                }
            });
            await sound.playAsync();
        } catch (err) {
            console.error('Audio preview error:', err);
            if (isMountedRef.current) {
                setPreviewingKey(null);
            }
        }
    };

    const handleSelect = async (ringtoneKey) => {
        setSelectedKey(ringtoneKey);
        await setSelectedRingtoneKey(ringtoneKey);
        if (onSelect) {
            onSelect(ringtoneKey);
        }
    };

    const handleTestAlarm = async () => {
        setTestingAlarm(true);
        Alert.alert(
            '5 सेकंड में अलार्म टेस्ट',
            'अभी अपना फोन लॉक या स्क्रीन बंद करें! 5 सेकंड में फोन की स्क्रीन चालू होगी, अलार्म दिखेगा और आपकी चुनी हुई रिंगटोन बजेगी।',
            [{ text: 'ठीक है' }]
        );

        // Schedule a real OS alarm clock for 5 seconds in the future
        const testTask = {
            id: 999999,
            stage: 'ALARM_TEST',
            status: 'RUNNING',
            started_at: new Date().toISOString(),
            Product: { name: 'TimerApp', hindi_name: 'अलार्म टेस्ट' },
        };

        await scheduleTaskAlarm(testTask, 5);

        testTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setTestingAlarm(false);
            }
        }, 6000);
    };

    if (loading) {
        return (
            <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={ThemeColors.royalBlue} />
                <Text style={styles.loadingText}>रिंगटोन लोड हो रही है...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header info / instructions */}
            <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color="#273AF8" style={{ marginRight: 6 }} />
                <Text style={[styles.infoBannerText, { fontSize: scaleFont(12) }]}>
                    टाइमर 00:00 होने पर आपकी चुनी गई रिंगटोन फोन लॉक रहने पर भी ज़ोर से बजेगी।
                </Text>
            </View>

            {/* Ringtones list with radio selection */}
            <View style={styles.list}>
                {ALARM_RINGTONES.map((ringtone) => {
                    const isSelected = selectedKey === ringtone.key;
                    const isPlaying = previewingKey === ringtone.key;

                    return (
                        <TouchableOpacity
                            key={ringtone.key}
                            style={[
                                styles.ringtoneCard,
                                isSelected && styles.ringtoneCardSelected,
                            ]}
                            onPress={() => handleSelect(ringtone.key)}
                            activeOpacity={0.8}
                        >
                            {/* Radio Button Indicator */}
                            <View style={styles.radioContainer}>
                                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </View>

                            {/* Ringtone Name & Description */}
                            <View style={styles.ringtoneInfo}>
                                <View style={styles.titleRow}>
                                    <Text
                                        style={[
                                            styles.ringtoneName,
                                            { fontSize: scaleFont(15) },
                                            isSelected && styles.ringtoneNameSelected,
                                        ]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {ringtone.name}
                                    </Text>
                                    {ringtone.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>डिफ़ॉल्ट</Text>
                                        </View>
                                    )}
                                    {isSelected && (
                                        <View style={styles.activeBadge}>
                                            <Ionicons name="checkmark-circle" size={12} color="#273AF8" style={{ marginRight: 2 }} />
                                            <Text style={styles.activeBadgeText}>चयनित</Text>
                                        </View>
                                    )}
                                </View>
                                <Text
                                    style={[styles.ringtoneDesc, { fontSize: scaleFont(12) }]}
                                    numberOfLines={2}
                                >
                                    {ringtone.desc}
                                </Text>
                            </View>

                            {/* Preview / Play Button */}
                            <TouchableOpacity
                                style={[styles.previewBtn, isPlaying && styles.previewBtnActive]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handlePreview(ringtone.key);
                                }}
                                activeOpacity={0.75}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={isPlaying ? 'stop' : 'volume-high-outline'}
                                    size={14}
                                    color={isPlaying ? '#FFFFFF' : '#475569'}
                                    style={{ marginRight: 4 }}
                                />
                                <Text
                                    style={[
                                        styles.previewBtnText,
                                        { fontSize: scaleFont(12) },
                                        isPlaying && styles.previewBtnTextActive,
                                    ]}
                                >
                                    {isPlaying ? 'रोकें' : 'सुनें'}
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* 5-Second Test Alarm Action */}
            {showTestButton && (
                <View style={styles.testSection}>
                    <TouchableOpacity
                        style={styles.testBtn}
                        onPress={handleTestAlarm}
                        disabled={testingAlarm}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="alarm-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={[styles.testBtnText, { fontSize: scaleFont(14) }]}>
                            {testingAlarm ? 'अलार्म टेस्ट शुरू हो रहा है...' : '5-सेकंड टेस्ट अलार्म (स्क्रीन लॉक करें)'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.testHint, { fontSize: scaleFont(11) }]}>
                        दबाने के बाद तुरंत फोन लॉक करें और रिंगटोन व स्क्रीन वेक-अप टेस्ट करें।
                    </Text>
                </View>
            )}

            {/* Lock-screen explanation card */}
            {showExplanation && (
                <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                        <Ionicons name="shield-checkmark" size={16} color="#059669" style={{ marginRight: 6 }} />
                        <Text style={styles.infoTitle}>नेटिव अलार्म इंजन</Text>
                    </View>
                    <Text style={styles.infoBody}>
                        चुनी हुई रिंगटोन सीधे डिवाइस के अलार्म मैनेजर से जुड़ी होती है। फोन साइलेंट या लॉक रहने पर भी यह 100% सही समय पर बजेगी।
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    loadingBox: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748B',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#CCD2FC',
    },
    infoBannerText: {
        flex: 1,
        color: '#1E293B',
        fontWeight: '600',
        lineHeight: 18,
    },
    list: {
        width: '100%',
    },
    ringtoneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 13,
        marginBottom: 10,
        ...Shadows.card,
    },
    ringtoneCardSelected: {
        backgroundColor: '#F0F4FF',
        borderColor: ThemeColors.royalBlue,
        borderWidth: 2,
    },
    radioContainer: {
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#94A3B8',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    radioOuterSelected: {
        borderColor: ThemeColors.royalBlue,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: ThemeColors.royalBlue,
    },
    ringtoneInfo: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    ringtoneName: {
        fontWeight: '700',
        color: '#1E293B',
    },
    ringtoneNameSelected: {
        color: ThemeColors.royalBlue,
        fontWeight: '800',
    },
    defaultBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: ThemeColors.royalBlue,
    },
    ringtoneDesc: {
        color: '#64748B',
        marginTop: 3,
        lineHeight: 16,
    },
    previewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        flexShrink: 0,
    },
    previewBtnActive: {
        backgroundColor: ThemeColors.magenta,
        borderColor: ThemeColors.magenta,
    },
    previewBtnText: {
        fontWeight: '700',
        color: '#475569',
    },
    previewBtnTextActive: {
        color: '#FFFFFF',
    },
    testSection: {
        marginTop: 12,
        marginBottom: 8,
    },
    testBtn: {
        flexDirection: 'row',
        backgroundColor: ThemeColors.royalBlue,
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.buttonPrimary,
    },
    testBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    testHint: {
        color: '#64748B',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 15,
    },
    infoCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginTop: 8,
        marginBottom: 8,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    infoBody: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
    },
});
