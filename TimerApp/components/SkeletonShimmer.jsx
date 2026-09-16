import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { Shadows } from '../constants/theme';

/**
 * Shimmer
 * A single animated skeleton shimmer block that pulses smoothly.
 */
export function Shimmer({ width = '100%', height = 16, borderRadius = 8, style }) {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 850,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 850,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [pulseAnim]);

    const opacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.9],
    });

    return (
        <Animated.View
            style={[
                styles.shimmerBase,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
}

/**
 * BatchesSkeleton
 * Shimmer placeholder row for horizontal active batches.
 */
export function BatchesSkeleton() {
    return (
        <View style={styles.batchesSkeletonRow}>
            <Shimmer width={110} height={44} borderRadius={14} style={{ marginRight: 10 }} />
            <Shimmer width={130} height={44} borderRadius={14} style={{ marginRight: 10 }} />
            <Shimmer width={95} height={44} borderRadius={14} style={{ marginRight: 10 }} />
            <Shimmer width={120} height={44} borderRadius={14} />
        </View>
    );
}

/**
 * DemandsSkeleton
 * Shimmer placeholder list for batch demands.
 */
export function DemandsSkeleton({ count = 3 }) {
    return (
        <View style={styles.demandsCard}>
            {Array.from({ length: count }).map((_, idx) => (
                <View
                    key={idx}
                    style={[
                        styles.demandRowSkeleton,
                        idx === count - 1 && { borderBottomWidth: 0 },
                    ]}
                >
                    <View style={styles.demandRowLeft}>
                        <Shimmer width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Shimmer width="75%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                            <Shimmer width="45%" height={10} borderRadius={4} />
                        </View>
                    </View>
                    <Shimmer width={64} height={26} borderRadius={8} />
                </View>
            ))}
        </View>
    );
}

/**
 * DashboardSkeleton
 * Complete animated skeleton layout for the main kitchen dashboard screen.
 */
export function DashboardSkeleton() {
    return (
        <ScrollView
            style={styles.fullScreen}
            contentContainerStyle={styles.dashboardSkeletonContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Header Skeleton */}
            <View style={styles.headerSkeleton}>
                <View style={{ flex: 1 }}>
                    <Shimmer width={160} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
                    <Shimmer width={220} height={12} borderRadius={4} />
                </View>
                <Shimmer width={72} height={32} borderRadius={16} />
            </View>

            {/* Quick Banner Skeleton */}
            <View style={styles.bannerSkeleton}>
                <Shimmer width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                    <Shimmer width="60%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                    <Shimmer width="40%" height={11} borderRadius={4} />
                </View>
                <Shimmer width={50} height={24} borderRadius={8} />
            </View>

            {/* Section 1: Active Batches */}
            <View style={styles.sectionSkeleton}>
                <View style={styles.sectionHeaderSkeleton}>
                    <Shimmer width={120} height={16} borderRadius={6} />
                    <Shimmer width={60} height={16} borderRadius={8} />
                </View>
                <BatchesSkeleton />
            </View>

            {/* Section 2: Demands */}
            <View style={styles.sectionSkeleton}>
                <View style={styles.sectionHeaderSkeleton}>
                    <Shimmer width={140} height={16} borderRadius={6} />
                    <Shimmer width={55} height={16} borderRadius={8} />
                </View>
                <DemandsSkeleton count={3} />
            </View>

            {/* Section 3: Action Button */}
            <View style={styles.actionCardSkeleton}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <Shimmer width={42} height={42} borderRadius={21} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Shimmer width="55%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
                        <Shimmer width="75%" height={12} borderRadius={4} />
                    </View>
                </View>
                <Shimmer width="100%" height={50} borderRadius={14} />
            </View>
        </ScrollView>
    );
}

/**
 * HistoryListSkeleton
 * Shimmer placeholder list for the timer history tab.
 */
export function HistoryListSkeleton({ count = 4 }) {
    return (
        <View style={styles.historySkeletonContainer}>
            {/* Search Bar Skeleton */}
            <Shimmer width="100%" height={46} borderRadius={14} style={{ marginBottom: 12 }} />

            {/* Filter Pills Skeleton */}
            <View style={styles.filterPillsRow}>
                <Shimmer width={55} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                <Shimmer width={90} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                <Shimmer width={85} height={32} borderRadius={16} style={{ marginRight: 8 }} />
                <Shimmer width={70} height={32} borderRadius={16} />
            </View>

            {/* History Cards */}
            {Array.from({ length: count }).map((_, idx) => (
                <View key={idx} style={styles.historyCardSkeleton}>
                    <View style={styles.historyCardTop}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Shimmer width="70%" height={16} borderRadius={6} style={{ marginBottom: 8 }} />
                            <Shimmer width="45%" height={12} borderRadius={4} />
                        </View>
                        <Shimmer width={80} height={24} borderRadius={12} />
                    </View>
                    <View style={styles.historyCardDivider} />
                    <View style={styles.historyCardBottom}>
                        <Shimmer width={130} height={12} borderRadius={4} />
                        <Shimmer width={70} height={18} borderRadius={6} />
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    shimmerBase: {
        backgroundColor: '#E2E8F0',
    },
    fullScreen: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    dashboardSkeletonContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    headerSkeleton: {
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
    bannerSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    sectionSkeleton: {
        marginBottom: 18,
    },
    sectionHeaderSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    batchesSkeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    demandsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    demandRowSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    demandRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    actionCardSkeleton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginTop: 6,
        ...Shadows.card,
    },
    historySkeletonContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    filterPillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    historyCardSkeleton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    historyCardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    historyCardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    historyCardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});

export default Shimmer;
