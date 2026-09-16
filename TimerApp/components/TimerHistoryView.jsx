import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    Animated,
    PanResponder,
    LayoutAnimation,
    Platform,
    UIManager,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../src/utils/responsive';
import { ThemeColors, Shadows } from '../constants/theme';
import {
    getTimerHistory,
    subscribeHistoryUpdates,
    deleteHistoryEntry,
} from '../src/utils/historyHelper';
// eslint-disable-next-line import/no-unresolved
import { HistoryListSkeleton } from './SkeletonShimmer';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * AnimatedFilterChip
 * Tactile spring bounce on press and layout transition on select.
 */
function AnimatedFilterChip({ active, onPress, children, style, activeStyle, dotColor }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.93,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[style, active && activeStyle]}
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    onPress();
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.85}
            >
                {dotColor && <View style={[styles.chipDot, { backgroundColor: dotColor }]} />}
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
}

/**
 * SwipeableHistoryCard
 * Features:
 * - Staggered entrance animation
 * - Swipe-to-delete and swipe action strip
 * - Expandable card animation with rotating chevron
 */
function SwipeableHistoryCard({
    item,
    index,
    isExpanded,
    onToggleExpand,
    onDelete,
    scaleFont,
}) {
    // 1. Staggered Entrance Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        const delay = Math.min(index * 45, 300);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(translateYAnim, {
                toValue: 0,
                tension: 70,
                friction: 8,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [index, fadeAnim, translateYAnim]);

    // 2. Swipe Actions & Swipe-to-Delete
    const translateX = useRef(new Animated.Value(0)).current;
    const isDeletingRef = useRef(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 12;
            },
            onPanResponderMove: (_, gestureState) => {
                if (isDeletingRef.current) return;
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -130));
                } else if (gestureState.dx > 0) {
                    translateX.setValue(Math.min(gestureState.dx * 0.25, 20));
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (isDeletingRef.current) return;
                if (gestureState.dx < -100) {
                    triggerDeleteAnimation();
                } else if (gestureState.dx < -45) {
                    Animated.spring(translateX, {
                        toValue: -85,
                        friction: 6,
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        friction: 6,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const triggerDeleteAnimation = () => {
        isDeletingRef.current = true;
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: -450,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            onDelete(item.id);
        });
    };

    const handleConfirmDelete = () => {
        Alert.alert(
            'Delete Record',
            `Remove "${item.taskName}" from history?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                    },
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: triggerDeleteAnimation,
                },
            ]
        );
    };

    // 3. Expandable Card Animation
    const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: isExpanded ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [isExpanded, rotateAnim]);

    const chevronRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <Animated.View
            style={[
                styles.swipeContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: translateYAnim }],
                },
            ]}
        >
            {/* Background Delete Action revealed on swipe */}
            <View style={styles.swipeActionBackground}>
                <TouchableOpacity
                    style={styles.swipeDeleteBtn}
                    onPress={handleConfirmDelete}
                    activeOpacity={0.8}
                >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.swipeDeleteText}>Delete</Text>
                </TouchableOpacity>
            </View>

            {/* Foreground Card */}
            <Animated.View
                style={[
                    styles.card,
                    styles.cardCompleted,
                    { transform: [{ translateX }] },
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => {
                        translateX.stopAnimation((value) => {
                            if (value < -20) {
                                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
                            } else {
                                onToggleExpand(item.id);
                            }
                        });
                    }}
                >
                    {/* Header: Title, Status Badge & Animated Chevron */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardTitleWrap}>
                            <Text style={[styles.taskTitle, { fontSize: scaleFont(16) }]} numberOfLines={2}>
                                {item.taskName}
                            </Text>
                            {item.stage ? (
                                <View style={styles.stageChip}>
                                    <Text style={styles.stageChipText}>{item.stage}</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.statusBadge, styles.badgeCompleted]}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color="#059669"
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={[styles.statusText, styles.statusTextCompleted]}>
                                    Completed
                                </Text>
                            </View>

                            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                            </Animated.View>
                        </View>
                    </View>

                    {/* Date & Duration Row */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 5 }} />
                            <Text style={[styles.metaText, { fontSize: scaleFont(12) }]}>
                                {item.date} • {item.endTime || item.startTime}
                            </Text>
                        </View>

                        <View style={styles.durationBadge}>
                            <Ionicons name="timer-outline" size={13} color={ThemeColors.royalBlue} style={{ marginRight: 4 }} />
                            <Text style={[styles.durationText, { fontSize: scaleFont(12) }]}>
                                Duration: {item.durationFormatted}
                            </Text>
                        </View>
                    </View>

                    {/* Quick timestamps */}
                    {item.startTime && item.endTime && item.startTime !== item.endTime && (
                        <View style={styles.timeRangeRow}>
                            <Text style={[styles.timeRangeText, { fontSize: scaleFont(11) }]}>
                                Started: {item.startTime} → Finished: {item.endTime}
                            </Text>
                        </View>
                    )}

                    {/* Expandable Details */}
                    {isExpanded && (
                        <View style={styles.expandedContent}>
                            <View style={styles.expandedDivider} />

                            <View style={styles.expandedRow}>
                                <Text style={styles.expandedKey}>Product</Text>
                                <Text style={styles.expandedValue}>{item.productName || 'Kitchen Batch Product'}</Text>
                            </View>

                            {item.stage ? (
                                <View style={styles.expandedRow}>
                                    <Text style={styles.expandedKey}>Production Stage</Text>
                                    <Text style={styles.expandedValue}>{item.stage}</Text>
                                </View>
                            ) : null}

                            <View style={styles.expandedRow}>
                                <Text style={styles.expandedKey}>Task Status</Text>
                                <Text style={[styles.expandedValue, { color: '#059669' }]}>
                                    Completed according to recipe specs
                                </Text>
                            </View>

                            {item.durationSeconds > 0 && (
                                <View style={styles.expandedRow}>
                                    <Text style={styles.expandedKey}>Total Duration</Text>
                                    <Text style={styles.expandedValue}>{item.durationFormatted} ({item.durationSeconds}s)</Text>
                                </View>
                            )}

                            <View style={styles.expandedActionsRow}>
                                <TouchableOpacity
                                    style={styles.cardDeleteBtn}
                                    onPress={handleConfirmDelete}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="trash-outline" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                                    <Text style={styles.cardDeleteBtnText}>Delete Record</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

/**
 * TimerHistoryView Component
 */
export default function TimerHistoryView() {
    const insets = useSafeAreaInsets();
    const { modalMaxWidth, scaleFont } = useResponsive();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    // Filters (Only active valid filters - no Cancelled)
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'Today' | 'Yesterday' | 'This Week' | 'Custom'
    const [selectedCustomDate, setSelectedCustomDate] = useState('');
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);

    // Load history and subscribe to updates
    useEffect(() => {
        let isMounted = true;
        getTimerHistory().then((data) => {
            if (isMounted) {
                // Ensure no cancelled records are in state
                setHistory(data.filter((item) => item.status !== 'Cancelled'));
                setLoading(false);
            }
        });

        const unsubscribe = subscribeHistoryUpdates((updated) => {
            if (isMounted) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setHistory(updated.filter((item) => item.status !== 'Cancelled'));
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    // Unique dates available in history for Custom Date selection
    const availableDates = useMemo(() => {
        const dates = new Set();
        history.forEach((item) => {
            if (item.date) dates.add(item.date);
        });
        return Array.from(dates);
    }, [history]);

    // Filtered data calculation
    const filteredHistory = useMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return history.filter((item) => {
            // Strictly exclude any cancelled record
            if (item.status === 'Cancelled') return false;

            // 1. Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const nameMatch = item.taskName?.toLowerCase().includes(q);
                const prodMatch = item.productName?.toLowerCase().includes(q);
                const stageMatch = item.stage?.toLowerCase().includes(q);
                const dateMatch = item.date?.toLowerCase().includes(q);
                if (!nameMatch && !prodMatch && !stageMatch && !dateMatch) {
                    return false;
                }
            }

            // 2. Date filter
            if (dateFilter !== 'All') {
                const itemDate = new Date(item.finishedAt || item.timestamp);
                if (isNaN(itemDate.getTime())) return false;

                if (dateFilter === 'Today') {
                    if (itemDate.toDateString() !== todayStr) return false;
                } else if (dateFilter === 'Yesterday') {
                    if (itemDate.toDateString() !== yesterdayStr) return false;
                } else if (dateFilter === 'This Week') {
                    if (itemDate < sevenDaysAgo) return false;
                } else if (dateFilter === 'Custom') {
                    if (selectedCustomDate && item.date !== selectedCustomDate) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [history, searchQuery, dateFilter, selectedCustomDate]);

    const handleSelectCustomDate = (dateStr) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedCustomDate(dateStr);
        setDateFilter('Custom');
        setIsCustomDateModalOpen(false);
    };

    const handleResetFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSearchQuery('');
        setDateFilter('All');
        setSelectedCustomDate('');
    };

    const handleToggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleDeleteItem = async (id) => {
        await deleteHistoryEntry(id);
    };

    const handleSearchChange = (text) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSearchQuery(text);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <HistoryListSkeleton count={4} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Input Box */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, { fontSize: scaleFont(14) }]}
                        placeholder="Search History..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleSearchChange('')}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Date Filter Chips with Spring Animation (No Cancelled filter) */}
            <View style={styles.filterSection}>
                <View style={styles.chipRow}>
                    {['All', 'Today', 'Yesterday', 'This Week'].map((df) => (
                        <AnimatedFilterChip
                            key={df}
                            active={dateFilter === df}
                            onPress={() => setDateFilter(df)}
                            style={styles.dateChip}
                            activeStyle={styles.dateChipActive}
                        >
                            <Text style={[styles.dateChipText, dateFilter === df && styles.dateChipTextActive]}>
                                {df === 'All' ? 'All Time' : df}
                            </Text>
                        </AnimatedFilterChip>
                    ))}

                    <AnimatedFilterChip
                        active={dateFilter === 'Custom'}
                        onPress={() => setIsCustomDateModalOpen(true)}
                        style={styles.dateChip}
                        activeStyle={styles.dateChipActive}
                    >
                        <Ionicons
                            name="calendar"
                            size={12}
                            color={dateFilter === 'Custom' ? ThemeColors.royalBlue : '#64748B'}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.dateChipText, dateFilter === 'Custom' && styles.dateChipTextActive]}>
                            {dateFilter === 'Custom' && selectedCustomDate ? selectedCustomDate : 'Custom Date'}
                        </Text>
                    </AnimatedFilterChip>
                </View>
            </View>

            {/* List or Empty State */}
            {filteredHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="time-outline" size={42} color="#94A3B8" />
                    </View>
                    {history.length === 0 ? (
                        <>
                            <Text style={[styles.emptyTitle, { fontSize: scaleFont(18) }]}>
                                No Timer History
                            </Text>
                            <Text style={[styles.emptySubtitle, { fontSize: scaleFont(13) }]}>
                                Your completed timers will appear here.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.emptyTitle, { fontSize: scaleFont(18) }]}>
                                No Matching Records
                            </Text>
                            <Text style={[styles.emptySubtitle, { fontSize: scaleFont(13) }]}>
                                No history found for your current search or date filter.
                            </Text>
                            <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters} activeOpacity={0.8}>
                                <Text style={styles.resetBtnText}>Reset Filters</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredHistory}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <SwipeableHistoryCard
                            item={item}
                            index={index}
                            isExpanded={expandedId === item.id}
                            onToggleExpand={handleToggleExpand}
                            onDelete={handleDeleteItem}
                            scaleFont={scaleFont}
                        />
                    )}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: 68 + Math.max(insets.bottom, 12) + 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Custom Date Picker Modal */}
            <Modal
                visible={isCustomDateModalOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsCustomDateModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { maxWidth: modalMaxWidth }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select History Date</Text>
                            <TouchableOpacity
                                onPress={() => setIsCustomDateModalOpen(false)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close" size={20} color="#475569" />
                            </TouchableOpacity>
                        </View>

                        {availableDates.length === 0 ? (
                            <Text style={styles.noDatesText}>No past recorded dates yet.</Text>
                        ) : (
                            availableDates.map((dateStr) => (
                                <TouchableOpacity
                                    key={dateStr}
                                    style={[
                                        styles.dateOptionRow,
                                        selectedCustomDate === dateStr && styles.dateOptionRowSelected,
                                    ]}
                                    onPress={() => handleSelectCustomDate(dateStr)}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={18}
                                        color={selectedCustomDate === dateStr ? ThemeColors.royalBlue : '#64748B'}
                                        style={{ marginRight: 10 }}
                                    />
                                    <Text
                                        style={[
                                            styles.dateOptionText,
                                            selectedCustomDate === dateStr && styles.dateOptionTextSelected,
                                        ]}
                                    >
                                        {dateStr}
                                    </Text>
                                    {selectedCustomDate === dateStr && (
                                        <Ionicons name="checkmark" size={18} color={ThemeColors.royalBlue} />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}

                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setIsCustomDateModalOpen(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    searchWrapper: {
        marginBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    searchInput: {
        flex: 1,
        color: '#0F172A',
        padding: 0,
        fontWeight: '500',
    },
    filterSection: {
        marginBottom: 14,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    dateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dateChipActive: {
        backgroundColor: '#E0E7FF',
        borderColor: ThemeColors.royalBlue,
    },
    dateChipText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    dateChipTextActive: {
        color: ThemeColors.royalBlue,
        fontWeight: '700',
    },
    listContent: {
        paddingBottom: 24,
    },
    swipeContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    swipeActionBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 85,
        backgroundColor: '#DC2626',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    swipeDeleteBtn: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeDeleteText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        marginTop: 2,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 15,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderLeftWidth: 5,
        ...Shadows.card,
    },
    cardCompleted: {
        borderLeftColor: '#10B981',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitleWrap: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    taskTitle: {
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: 22,
    },
    stageChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    stageChipText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexShrink: 0,
    },
    badgeCompleted: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    statusTextCompleted: {
        color: '#059669',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        color: '#64748B',
        fontWeight: '500',
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF0FE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    durationText: {
        color: ThemeColors.royalBlue,
        fontWeight: '700',
    },
    timeRangeRow: {
        marginTop: 6,
    },
    timeRangeText: {
        color: '#94A3B8',
        fontWeight: '500',
    },
    expandedContent: {
        marginTop: 6,
    },
    expandedDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 10,
    },
    expandedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    expandedKey: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    expandedValue: {
        fontSize: 12,
        color: '#0F172A',
        fontWeight: '700',
        maxWidth: '65%',
        textAlign: 'right',
    },
    expandedActionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    cardDeleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cardDeleteBtnText: {
        color: '#DC2626',
        fontSize: 11,
        fontWeight: '800',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 40,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 10,
        ...Shadows.card,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: {
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
    resetBtn: {
        marginTop: 16,
        backgroundColor: ThemeColors.royalBlue,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
    },
    resetBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        ...Shadows.modal,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    noDatesText: {
        color: '#64748B',
        paddingVertical: 16,
        textAlign: 'center',
        fontSize: 13,
    },
    dateOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 6,
    },
    dateOptionRowSelected: {
        backgroundColor: '#EEF0FE',
    },
    dateOptionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    dateOptionTextSelected: {
        color: ThemeColors.royalBlue,
        fontWeight: '700',
    },
    modalCloseBtn: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    modalCloseBtnText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '700',
    },
});
