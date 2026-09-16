// app/(tabs)/index.js
// Redesigned with premium fresh green theme (fruits, vegetables & alkaline water)
// World-class mobile interface inspired by Zepto, Blinkit, and Material Design 3.
// Features dynamic mesh gradients, count-up numbers, Reanimated slider progress, and expo-linear-gradient cards.

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Animated, Easing, TouchableWithoutFeedback, ActivityIndicator, Alert, Dimensions, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { s, vs, ms } from '../../src/core/utils/responsive';
import SwipeToConfirmButton from '../../src/components/common/SwipeToConfirmButton';

// Local selectors to avoid Metro resolution circularity or undefined issues
const selectDriver = (state) => state.auth?.driver;
const selectDashboardStats = (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const combinedRaw = [...activeOrders, ...historyOrders];

  // Strictly deduplicate combined list
  const allOrders = [];
  const seenIds = new Set();
  combinedRaw.forEach(o => {
    const key = String(o.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      allOrders.push(o);
    }
  });

  const pending = activeOrders.filter((o) => {
    const s = (o.status || '').toUpperCase();
    return s === 'ASSIGNED' || s === 'IN_TRANSIT' || s === 'PENDING' || s === 'READY_FOR_DELIVERY';
  }).length;

  const completedOrdersCount = allOrders.filter((o) => {
    const s = (o.status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'DELIVERED';
  }).length;
  const completed = Math.max(state.route?.historyCount || 0, completedOrdersCount);

  const completedTodayOrders = activeOrders.filter((o) => {
    const s = (o.status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'DELIVERED';
  }).length;
  const completedToday = (state.route?.historyCountToday && state.route.historyCountToday > 0)
    ? state.route.historyCountToday
    : completedTodayOrders;

  const returnedOrders = allOrders.filter((o) => o.status === 'RETURNED');
  const replacedOrders = allOrders.filter((o) => o.status === 'REPLACED');

  const returnedCount = returnedOrders.length;
  const replacementCount = replacedOrders.length;

  const returnedItemsCount = returnedOrders.reduce(
    (sum, o) => sum + (o.returnDetails?.items || o.items || []).length,
    0
  );

  return {
    completed,
    completedToday,
    pending,
    total: activeOrders.filter((o) => o.status !== 'REPLACEMENT_SCHEDULED').length,
    returned: returnedCount,
    replacement: replacementCount,
    returnedItemsCount,
    replacedItemsCount: replacementCount,
    totalDistanceKm: state.route?.totalDistanceKm || 0,
  };
};
const selectRouteLoading = (state) => state.route?.loading || false;
const selectIsOnline = (state) => state.auth?.isOnline ?? true;
const selectAllOrders = (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const seenIds = new Set(activeOrders.map(o => o.id));
  const uniqueHistory = historyOrders.filter(o => !seenIds.has(o.id));
  return [...activeOrders, ...uniqueHistory];
};
const selectAvailableOrders = (state) => state.availableOrders?.orders || [];

import RouteService from '../../src/features/routes/services/RouteService';
import AvailableOrdersService from '../../src/features/routes/services/AvailableOrdersService';
import { PulsingDot, AnimatedCard, AnimatedPressable, SkeletonCard, GlowingPulse, triggerHaptic } from '../../src/components/common/Motion';
import IncomingOrderModal from '../../src/components/common/IncomingOrderModal';
import { useDynamicBranding } from '../../src/core/branding/useDynamicBranding';
import DynamicHeader from '../../src/components/branding/DynamicHeader';
import { useDeferredVal } from '../../src/core/utils/useDeferredVal';
import NotificationRepository from '../../src/features/notifications/repositories/NotificationRepository';
import { addNotification, clearNotifications } from '../../src/features/notifications/state/notificationSlice';
import AttendanceService from '../../src/features/attendance/services/AttendanceService';
import AttendanceModal from '../../src/components/attendance/AttendanceModal';
// import LiveDeliveryHeroAnimation from '../../src/components/common/LiveDeliveryHeroAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 🔢 COUNT-UP NUMBER ANIMATION COMPONENT (Supports float/km counts)
const CountUpNumber = memo(function CountUpNumber({ value, style, isFloat = false }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = isFloat ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(end) || end === 0) {
      setDisplayVal(0);
      return;
    }
    const duration = 750; // ms
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // Ease out quad
      const current = easeProgress * end;
      setDisplayVal(isFloat ? `${current.toFixed(1)} km` : Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, isFloat]);

  return <Text numberOfLines={1} adjustsFontSizeToFit style={style}>{displayVal}</Text>;
});

// 🎈 GENTLE FLOATING EFFECT PILL
const FloatingPill = memo(function FloatingPill({ children, delay = 0, style }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 3,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, delay]);

  return (
    <Animated.View style={[{ transform: [{ translateY: floatAnim }] }, style]}>
      {children}
    </Animated.View>
  );
});

// ⚡ PREMIUM MOVING GRADIENT PRESSABLE BUTTON
const MovingGradientButton = memo(function MovingGradientButton({ onPress, children, colors, style, disabled }) {
  const transX = useRef(new Animated.Value(-SCREEN_WIDTH * 0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(transX, {
          toValue: SCREEN_WIDTH * 0.8,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(transX, {
          toValue: -SCREEN_WIDTH * 0.8,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [transX]);

  return (
    <AnimatedPressable onPress={onPress} disabled={disabled} style={[style, { overflow: 'hidden', backgroundColor: colors[0] || '#166534' }]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          width: '300%',
          left: '-100%',
          transform: [{ translateX: transX }],
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={{ backgroundColor: 'transparent', paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </AnimatedPressable>
  );
});

export default function DashboardScreen() {
  const driver = useSelector(selectDriver);
  const stats = useSelector(selectDashboardStats, shallowEqual);
  const isLoading = useSelector(selectRouteLoading);
  const isOnline = useSelector(selectIsOnline);
  const orders = useSelector(selectAllOrders);
  const availableOrders = useSelector(selectAvailableOrders);

  const dispatch = useDispatch();
  const isReady = useDeferredVal(false, true);
  const { themeColors, triggerConfigSync } = useDynamicBranding();
  const styles = getStyles(themeColors);

  const [claimingId, setClaimingId] = useState(null);

  const greetOpacity = useRef(new Animated.Value(0)).current;
  const greetTranslateY = useRef(new Animated.Value(15)).current;

  // Premium Screen Entrance Animation Values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  const stat1Scale = useRef(new Animated.Value(0.9)).current;
  const stat1Opacity = useRef(new Animated.Value(0)).current;

  const stat2Scale = useRef(new Animated.Value(0.9)).current;
  const stat2Opacity = useRef(new Animated.Value(0)).current;

  const stat3Scale = useRef(new Animated.Value(0.9)).current;
  const stat3Opacity = useRef(new Animated.Value(0)).current;

  const stat4Scale = useRef(new Animated.Value(0.9)).current;
  const stat4Opacity = useRef(new Animated.Value(0)).current;

  const stat5Scale = useRef(new Animated.Value(0.9)).current;
  const stat5Opacity = useRef(new Animated.Value(0)).current;

  const activeDispatchScale = useRef(new Animated.Value(0.9)).current;
  const activeDispatchOpacity = useRef(new Animated.Value(0)).current;
  const activeDispatchTranslateY = useRef(new Animated.Value(40)).current;

  const routeCardOpacity = useRef(new Animated.Value(0)).current;
  const gigBoardOpacity = useRef(new Animated.Value(0)).current;

  // Active Dispatch Assigned badge bounce animation
  const statusBadgeBounce = useRef(new Animated.Value(0)).current;

  // Route progress animation
  const completionRate = stats.total > 0 ? (stats.completedToday / stats.total) * 100 : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Custom scooter pull-to-refresh animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const loadingRideAnim = useRef(new Animated.Value(0)).current;

  // Attendance State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(true);

  // Auto-refresh today's route, available orders & stats once when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      RouteService.loadTodaysRoute();
      AvailableOrdersService.loadAvailableOrders();
      RouteService.fetchHistoryCount();

      // Live Attendance Status Check for Today
      const marked = AttendanceService.isAttendanceMarkedToday();
      setIsAttendanceMarked(marked);
      if (!marked) {
        setShowAttendanceModal(true);
      } else {
        setShowAttendanceModal(false);
      }
      return () => {};
    }, [])
  );

  useEffect(() => {
    // Prefetch Notifications in Background
    const prefetchNotifications = async () => {
      try {
        const response = await NotificationRepository.getNotifications();
        dispatch(clearNotifications());
        const list = response.notifications || response.data || [];
        if (list.length > 0) {
          list.forEach(n => {
            dispatch(addNotification({
              id: n._id || n.id,
              type: n.type || 'info',
              title: n.title || 'Notification',
              body: n.body || '',
              receivedAt: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
              readAt: n.readAt ? new Date(n.readAt).getTime() : null,
            }));
          });
        }
      } catch (err) {
        console.log('[Dashboard] Notification prefetch failed:', err.message);
      }
    };
    prefetchNotifications();

    // Choreographed entrance flow
    // 1. Header slides down and fades in
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(greetOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(greetTranslateY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    // 2. Staggered Stat Cards entrance (80ms delays)
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(stat1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(stat1Scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(stat2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(stat2Scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(stat3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(stat3Scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(stat4Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(stat4Scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(stat5Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(stat5Scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();

    // 3. Active Dispatch card (slides from bottom and scale/fades)
    Animated.parallel([
      Animated.timing(activeDispatchOpacity, { toValue: 1, duration: 450, delay: 240, useNativeDriver: true }),
      Animated.spring(activeDispatchScale, { toValue: 1, tension: 50, friction: 8, delay: 240, useNativeDriver: true }),
      Animated.spring(activeDispatchTranslateY, { toValue: 0, tension: 50, friction: 8, delay: 240, useNativeDriver: true }),
    ]).start();

    // 4. Route card fades in
    Animated.timing(routeCardOpacity, { toValue: 1, duration: 500, delay: 360, useNativeDriver: true }).start();

    // 5. Gig Board card fades in
    Animated.timing(gigBoardOpacity, { toValue: 1, duration: 500, delay: 420, useNativeDriver: true }).start();
  }, []);

  const activeOrder = orders.find((o) => o.status === 'IN_TRANSIT') || orders.find((o) => o.status === 'ASSIGNED');
  
  // Bounce active badge once on mount/change
  useEffect(() => {
    if (activeOrder) {
      statusBadgeBounce.setValue(-12);
      Animated.spring(statusBadgeBounce, {
        toValue: 0,
        tension: 110,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [activeOrder?.id]);

  // Route completion rate animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: completionRate,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [completionRate]);

  // Custom scooter ride loop during active refresh
  useEffect(() => {
    if (isLoading) {
      loadingRideAnim.setValue(0);
      Animated.loop(
        Animated.timing(loadingRideAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRideAnim.setValue(0);
    }
  }, [isLoading]);

  const onRefresh = () => {
    if (isOnline) {
      RouteService.loadTodaysRoute(true);
      AvailableOrdersService.loadAvailableOrders();
      RouteService.fetchHistoryCount();
    }
  };

  const handleClaimOpenOrder = async (order) => {
    setClaimingId(order.id);
    try {
      const success = await AvailableOrdersService.claimOrder(order);
      if (success) {
        RouteService.loadTodaysRoute(true);
        Alert.alert('🎉 Order Claimed!', `Order #${String(order.id).slice(-4)} has been added to your deliveries.`);
      } else {
        Alert.alert('❌ Failed', 'Could not claim the order. Please try again.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaimingId(null);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const categoryLabel = (cat) => {
    if (!cat) return 'Package';
    const clean = cat.toLowerCase();
    if (clean.includes('water')) return 'Alkaline Water';
    if (clean.includes('fruit')) return 'Fresh Fruits';
    if (clean.includes('veg')) return 'Organic Veggies';
    return cat;
  };

  const formatDistance = (m) => {
    if (!m || isNaN(m)) return '0 km';
    const km = m / 1000;
    return `${km.toFixed(1)} km`;
  };

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  const bikeLeft = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '94%'],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }} edges={['top']}>
      {/* 🔮 Ambient Mesh Glow Overlay Layer */}
      <View style={[styles.ambientGlowTop, { backgroundColor: themeColors.primary }]} pointerEvents="none" />
      <View style={[styles.ambientGlowBottom, { backgroundColor: themeColors.accent }]} pointerEvents="none" />

      {/* Dynamic Branding Header */}
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
          width: '100%',
        }}
      >
        <DynamicHeader
          driverName={driver?.name || 'Delivery Boy'}
          initialLetter={driver?.name?.[0]?.toUpperCase() || 'D'}
          notificationCount={0}
        />
      </Animated.View>

      {/* 🛵 Custom Premium Scooter Pull-To-Refresh Indicator */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 15,
          left: isLoading
            ? loadingRideAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, SCREEN_WIDTH + 80] })
            : scrollY.interpolate({ inputRange: [-90, 0], outputRange: [SCREEN_WIDTH / 2 - 25, -60], extrapolate: 'clamp' }),
          opacity: isLoading
            ? 1
            : scrollY.interpolate({ inputRange: [-80, -20], outputRange: [1, 0], extrapolate: 'clamp' }),
          transform: [
            { scale: 1.25 },
            {
              translateY: isLoading
                ? 0
                : scrollY.interpolate({
                    inputRange: [-90, -40, 0],
                    outputRange: [0, -3, 0],
                    extrapolate: 'clamp',
                  })
            }
          ],
          zIndex: 1000,
        }}
        pointerEvents="none"
      >
        <Text style={{ fontSize: 28 }}>🛵💨</Text>
      </Animated.View>

      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              triggerHaptic('medium');
              onRefresh();
            }}
            colors={['#00B4D8', '#E024E3', '#1D4ED8']}
            tintColor="#00B4D8"
          />
        }
        onScrollEndDrag={(e) => {
          const { contentOffset } = e.nativeEvent;
          if (contentOffset.y <= -80 && !isLoading) {
            triggerHaptic('medium');
            onRefresh();
          }
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Date, Online/Offline status card (Ultra-Premium 3-Color Signature Glassmorphic Bar) */}
        <AnimatedCard delay={60}>
          <LinearGradient
            colors={['#1D4ED8', '#00B4D8', '#E024E3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dateBarBorder}
          >
            <View style={styles.dateBarInner}>
              {/* Left Side: Live Date Badge */}
              <View style={styles.dateChipBox}>
                <View style={styles.dateIconWrapper}>
                  <Feather name="calendar" size={ms(15)} color="#00B4D8" />
                </View>
                <Text style={styles.dateChipText}>
                  {formattedDate}
                </Text>
              </View>

              {/* Right Side: Interactive Live Online/Offline Status Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('medium');
                  dispatch(setNetworkStatus(!isOnline));
                }}
                style={[
                  styles.onlineBadgePill,
                  {
                    backgroundColor: isOnline ? '#ECFDF5' : '#FDF4FF',
                    borderColor: isOnline ? '#10B981' : '#E024E3',
                  },
                ]}
              >
                {isOnline ? (
                  <GlowingPulse color="#10B981" borderWidth={2} duration={1800} style={{ marginRight: s(5) }}>
                    <View style={{ width: ms(7), height: ms(7), borderRadius: ms(3.5), backgroundColor: '#10B981' }} />
                  </GlowingPulse>
                ) : (
                  <PulsingDot color="#E024E3" size={ms(7)} />
                )}
                <Text
                  style={[
                    styles.onlineBadgePillText,
                    { color: isOnline ? '#065F46' : '#E024E3' },
                  ]}
                >
                  {isOnline ? 'ONLINE SHIFT' : 'OFFLINE MODE'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </AnimatedCard>

        {/* Live Attendance Status Banner */}
        <AnimatedCard delay={90}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              triggerHaptic('light');
              setShowAttendanceModal(true);
            }}
            style={[
              styles.attendanceBanner,
              {
                borderColor: isAttendanceMarked ? '#10B981' : '#00B4D8',
                backgroundColor: isAttendanceMarked ? '#ECFDF5' : '#F0F9FF',
              },
            ]}
          >
            <View style={styles.attendanceLeft}>
              <Text style={{ fontSize: ms(18) }}>{isAttendanceMarked ? '✅' : '✋'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.attendanceTitle, { color: isAttendanceMarked ? '#065F46' : '#1D4ED8' }]}>
                  {isAttendanceMarked ? "Today's Attendance Marked" : "Attendance Pending — Tap to Punch In"}
                </Text>
                <Text style={styles.attendanceSub}>
                  {isAttendanceMarked ? "You are active & verified for today's deliveries" : "Mark live attendance to log your shift"}
                </Text>
              </View>
            </View>
            <View style={[styles.attendancePill, { backgroundColor: isAttendanceMarked ? '#10B981' : '#E024E3' }]}>
              <Text style={styles.attendancePillText}>{isAttendanceMarked ? 'VERIFIED' : 'PUNCH IN'}</Text>
            </View>
          </TouchableOpacity>
        </AnimatedCard>

        {!isReady ? (
          <View style={{ gap: 12, marginTop: 4 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <>
            {/* 🎬 Hero Live Delivery Cinematic World Animation (Hidden per user request) */}
            {/* <LiveDeliveryHeroAnimation /> */}

            {/* Stats Grid (Cinematic grids with Return Item and Return Order) */}
            <View style={styles.statsGrid}>
              <View style={styles.gridRow}>
                {[
                  { key: 'pending', emoji: '⏳', label: 'PENDING', color: '#00B4D8', bgColor: '#E0F2FE', val: stats.pending, path: '/(tabs)/deliveries', filter: 'Pending', colors: ['#FFFFFF', '#F0F9FF'], opacity: stat1Opacity, scale: stat1Scale },
                  { key: 'completed', emoji: '✅', label: 'DELIVERED', color: '#1D4ED8', bgColor: '#DBEAFE', val: stats.completed, path: '/(tabs)/deliveries', filter: 'Completed', colors: ['#FFFFFF', '#EFF6FF'], opacity: stat2Opacity, scale: stat2Scale }
                ].map((item) => (
                  <Animated.View
                    key={item.key}
                    style={{
                      flex: 1,
                      opacity: item.opacity,
                      transform: [{ scale: item.scale }],
                    }}
                  >
                    <AnimatedPressable
                      style={styles.statPressableGrid}
                      onPress={() => {
                        triggerHaptic('light');
                        if (item.key === 'open_orders') {
                          router.push(item.path);
                        } else {
                          router.push({ pathname: item.path, params: { filter: item.filter } });
                        }
                      }}
                    >
                      <LinearGradient
                        colors={item.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.statCardGridItem, { borderBottomColor: item.color }]}
                      >
                        <View style={[styles.statEmojiBg, { backgroundColor: item.bgColor }]}>
                          <Text style={styles.statEmoji}>{item.emoji}</Text>
                        </View>
                        <CountUpNumber value={item.val} style={[styles.statValue, { color: item.color }]} />
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statLabel}>{item.label}</Text>
                      </LinearGradient>
                    </AnimatedPressable>
                  </Animated.View>
                ))}
              </View>
              
              <View style={[styles.gridRow, { marginTop: s(10) }]}>
                {[
                  { key: 'returned_items', emoji: '↩️', label: 'RETURN ITEM', color: '#E024E3', bgColor: '#FCE7F3', val: stats.returnedItemsCount, path: '/(tabs)/returns', filter: 'RETURNS', colors: ['#FFFFFF', '#FDF4FF'], opacity: stat4Opacity, scale: stat4Scale },
                  { key: 'returned_orders', emoji: '📦', label: 'RETURN ORDER', color: '#00B4D8', bgColor: '#E0F2FE', val: stats.replacement, path: '/(tabs)/returns', filter: 'REPLACEMENTS', colors: ['#FFFFFF', '#F0F9FF'], opacity: stat5Opacity, scale: stat5Scale }
                ].map((item) => (
                  <Animated.View
                    key={item.key}
                    style={{
                      flex: 1,
                      opacity: item.opacity,
                      transform: [{ scale: item.scale }],
                    }}
                  >
                    <AnimatedPressable
                      style={styles.statPressableGrid}
                      onPress={() => {
                        triggerHaptic('light');
                        router.push({ pathname: item.path, params: { filter: item.filter } });
                      }}
                    >
                      <LinearGradient
                        colors={item.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.statCardGridItem, { borderBottomColor: item.color }]}
                      >
                        <View style={[styles.statEmojiBg, { backgroundColor: item.bgColor }]}>
                          <Text style={styles.statEmoji}>{item.emoji}</Text>
                        </View>
                        <CountUpNumber value={item.val} style={[styles.statValue, { color: item.color }]} />
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statLabel}>{item.label}</Text>
                      </LinearGradient>
                    </AnimatedPressable>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Active Delivery Order Card (Glassmorphic Linear Gradient) */}
            {activeOrder && (
              <Animated.View
                style={{
                  opacity: activeDispatchOpacity,
                  transform: [
                    { translateY: activeDispatchTranslateY },
                    { scale: activeDispatchScale }
                  ]
                }}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeOrderCard}
                >
                  <View style={styles.activeOrderHeader}>
                    <View style={styles.activeBadgeContainer}>
                      <Text style={styles.activeOrderLabel}>⚡ ACTIVE DISPATCH</Text>
                    </View>
                    <Animated.View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: activeOrder.status === 'IN_TRANSIT' ? '#E9F5EF' : '#FEF3C7',
                          transform: [{ translateY: statusBadgeBounce }]
                        }
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: activeOrder.status === 'IN_TRANSIT' ? '#0E4A35' : '#D97706' }]}>
                        {activeOrder.status === 'IN_TRANSIT' ? 'In Transit' : 'Assigned'}
                      </Text>
                    </Animated.View>
                  </View>

                  <Text style={styles.activeCustomerName}>{activeOrder.customerName}</Text>
                  <Text style={styles.activeAddress}>📍 {activeOrder.address}</Text>

                  {/* Highlight Special Organic Items */}
                  <Text style={styles.itemsSectionTitle}>Delivery Items:</Text>
                  <View style={styles.activeItemsContainer}>
                    {activeOrder.items?.map((item, idx) => {
                      const category = item.category?.toLowerCase() || '';
                      const name = (item.productName || item.name || '').toLowerCase();

                      let itemEmoji = '📦';
                      let isSpecial = false;

                      if (category.includes('water') || name.includes('water') || name.includes('alkaline')) {
                        itemEmoji = '💧';
                        isSpecial = true;
                      } else if (category.includes('fruit') || name.includes('apple') || name.includes('banana')) {
                        itemEmoji = '🍎';
                      } else if (category.includes('veg') || name.includes('onion') || name.includes('potato')) {
                        itemEmoji = '🥬';
                      }

                      return (
                        <FloatingPill key={idx} delay={idx * 160}>
                          <View style={[styles.itemPill, isSpecial && styles.specialItemPill]}>
                            <Text style={[styles.itemPillText, isSpecial && styles.specialItemPillText]}>
                              {itemEmoji} {item.productName || item.name || categoryLabel(item.category)}
                            </Text>
                          </View>
                        </FloatingPill>
                      );
                    })}
                  </View>

                  <View style={styles.activeMetaRow}>
                    <View style={styles.activeMetaItem}>
                      <Text style={styles.activeMetaLabel}>PAYMENT METHOD</Text>
                      <Text style={styles.activeMetaVal}>
                        {activeOrder.paymentMode === 'COD' ? `COD (Collect ₹${activeOrder.codAmount})` : 'Prepaid Online'}
                      </Text>
                    </View>
                  </View>

                  {/* Clean Normal Action Button */}
                  <SwipeToConfirmButton
                    title="Start Navigation & Details"
                    onConfirm={() => {
                      router.push(`/order/${activeOrder.id}`);
                    }}
                    style={{ marginTop: vs(12) }}
                  />
                </LinearGradient>
              </Animated.View>
            )}

            {/* Today's Route Info Card (Subtle Gradient Card) */}
            <Animated.View style={{ opacity: routeCardOpacity }}>
              <LinearGradient
                colors={['#FFFFFF', '#FDFCF7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.routeCard}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>📍 Shift Route Information</Text>
                  <AnimatedPressable
                    style={styles.routePill}
                    onPress={() => { triggerHaptic('light'); router.push({ pathname: '/(tabs)/deliveries', params: { filter: 'All' } }); }}
                  >
                    <Text style={styles.routePillText}>{stats.total} Stops Total</Text>
                  </AnimatedPressable>
                </View>

                {/* Scooter Slider Track representing Shift Progress */}
                <View style={styles.deliveryProgressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabelLeft}>Start</Text>
                    <Text style={[styles.progressLabelCenter, { color: themeColors.primary }]}>
                      {stats.completedToday}/{stats.total} Deliveries Done
                    </Text>
                    <Text style={styles.progressLabelRight}>Shift End</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <Animated.View style={[styles.progressBarFill, { width: fillWidth, backgroundColor: themeColors.primary }]} />
                    <Animated.View style={[styles.progressRiderMarker, { left: bikeLeft }]}>
                      <Text style={{ fontSize: 16 }}>🛵</Text>
                    </Animated.View>
                  </View>
                </View>

                {/* Route statistics */}
                <View style={styles.routeStats}>
                  <View style={styles.routeStat}>
                    <CountUpNumber value={stats.totalDistanceKm} style={styles.routeStatValue} isFloat />
                    <Text style={styles.routeStatLabel}>Est. Distance</Text>
                  </View>
                  <View style={styles.routeStatDivider} />
                  <AnimatedPressable
                    style={styles.routeStat}
                    onPress={() => { triggerHaptic('light'); router.push({ pathname: '/(tabs)/deliveries', params: { filter: 'Pending' } }); }}
                  >
                    <CountUpNumber value={stats.pending} style={styles.routeStatValue} />
                    <Text style={styles.routeStatLabel}>Stops Left</Text>
                  </AnimatedPressable>
                  <View style={styles.routeStatDivider} />
                  <AnimatedPressable
                    style={styles.routeStat}
                    onPress={() => { triggerHaptic('light'); router.push({ pathname: '/(tabs)/deliveries', params: { filter: 'Completed' } }); }}
                  >
                    <CountUpNumber value={stats.completedToday} style={styles.routeStatValue} />
                    <Text style={styles.routeStatLabel}>Stops Finished</Text>
                  </AnimatedPressable>
                </View>

                <MovingGradientButton
                  colors={[themeColors.primary, themeColors.accent || '#10B981', themeColors.primary]}
                  onPress={() => {
                    triggerHaptic('light');
                    router.push('/(tabs)/deliveries');
                  }}
                  style={styles.startBtnWrapper}
                >
                  <Text style={styles.startBtnText}>▶  View Deliveries List</Text>
                </MovingGradientButton>
              </LinearGradient>
            </Animated.View>

            {/* Available orders Gigs board */}
            {availableOrders.length > 0 && (
              <Animated.View style={{ opacity: gigBoardOpacity }}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.openOrdersCard}
                >
                  <View style={styles.openOrdersHeader}>
                    <Text style={styles.openOrdersTitle}>💼 Gig Board: Claim Orders</Text>
                    <View style={styles.openOrdersCountBadge}>
                      <Text style={styles.openOrdersCountText}>{availableOrders.length} New</Text>
                    </View>
                  </View>

                  <View style={styles.openOrdersList}>
                    {availableOrders.map((order) => (
                      <LinearGradient
                        key={order.id}
                        colors={['#FAF9F6', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.openOrderItem}
                      >
                        <View style={styles.openOrderItemHeader}>
                          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.openOrderCustomer}>{order.customerName}</Text>
                          <Text style={styles.openOrderAmount}>₹{order.codAmount || 0}</Text>
                        </View>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.openOrderAddress}>📍 {order.address}</Text>

                        <View style={styles.openOrderItemsRow}>
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <View key={idx} style={styles.openOrderItemPill}>
                              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.openOrderItemPillText}>
                                {item.productName || item.name || 'Package'}
                              </Text>
                            </View>
                          ))}
                          {order.items?.length > 3 && (
                            <Text style={styles.openOrderMoreItems}>
                              +{order.items.length - 3} more
                            </Text>
                          )}
                        </View>

                        <MovingGradientButton
                          colors={[themeColors.primary, themeColors.accent || '#10B981', themeColors.primary]}
                          onPress={() => {
                            triggerHaptic('medium');
                            handleClaimOpenOrder(order);
                          }}
                          disabled={claimingId !== null}
                          style={styles.openOrderClaimBtnWrapper}
                        >
                          {claimingId === order.id ? (
                            <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                            <Text style={styles.openOrderClaimBtnText}>Claim GIG ➔</Text>
                          )}
                        </MovingGradientButton>
                      </LinearGradient>
                    ))}
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Incoming Order Overlay Modal */}
      <IncomingOrderModal />

      {/* Live Attendance Punch Modal */}
      <AttendanceModal
        visible={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        onSuccessNavigate={() => {
          setShowAttendanceModal(false);
          setIsAttendanceMarked(true);
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { paddingHorizontal: s(16), paddingTop: vs(12), paddingBottom: vs(40) },

  // Ambient mesh glow background bubbles
  ambientGlowTop: {
    position: 'absolute',
    top: -vs(150),
    left: -s(150),
    width: s(320),
    height: vs(320),
    borderRadius: s(160),
    opacity: 0.05,
    zIndex: -1,
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -vs(150),
    right: -s(150),
    width: s(320),
    height: vs(320),
    borderRadius: s(160),
    opacity: 0.05,
    zIndex: -1,
  },

  // Date and status header card (Ultra-Premium 3-Color Glassmorphic Bar)
  dateBarBorder: {
    borderRadius: s(22),
    padding: 2, // 2px 3-Color Gradient Border stroke!
    marginBottom: vs(12),
    elevation: 5,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: s(12),
  },
  dateBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
  },
  dateChipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  dateIconWrapper: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(10),
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChipText: {
    fontSize: ms(13),
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: 0.2,
  },
  onlineBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: s(14),
    paddingHorizontal: s(11),
    paddingVertical: vs(5.5),
    borderWidth: 1.5,
  },
  onlineBadgePillText: {
    fontSize: ms(10.5),
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Attendance Status Banner Styles
  attendanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: s(18),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderWidth: 1.5,
    marginBottom: vs(12),
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: s(8),
    elevation: 2,
  },
  attendanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    flex: 1,
    paddingRight: s(8),
  },
  attendanceTitle: {
    fontSize: ms(13),
    fontWeight: 'bold',
  },
  attendanceSub: {
    fontSize: ms(11),
    color: '#64748B',
    marginTop: vs(1),
  },
  attendancePill: {
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
  },
  attendancePillText: {
    fontSize: ms(10),
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Stats Grid Card Block (1x3 Row Layout)
  statsGrid: { marginBottom: vs(12) },
  gridRow: { flexDirection: 'row', gap: s(10) },
  statPressableGrid: {
    flex: 1,
    borderRadius: s(20),
    overflow: 'hidden',
  },
  statCardGridItem: {
    flex: 1,
    paddingVertical: vs(14),
    paddingHorizontal: s(8),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 5,
    borderRadius: s(20),
    shadowColor: themeColors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: s(8),
    elevation: 3,
  },
  statEmojiBg: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  statEmoji: { fontSize: ms(18) },
  statValue: { fontSize: ms(20), fontWeight: '900', lineHeight: vs(24) },
  statLabel: { fontSize: ms(10), color: themeColors.subtext, fontWeight: 'bold', marginTop: vs(4), textAlign: 'center' },

  // Active Task Card (Glassmorphic)
  activeOrderCard: {
    borderRadius: s(20),
    padding: s(18),
    marginBottom: vs(12),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: s(12),
    elevation: 3,
  },
  activeOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(14) },
  activeBadgeContainer: { backgroundColor: '#F1F5F9', borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: vs(4) },
  activeOrderLabel: { fontSize: ms(9), color: '#0F172A', fontWeight: '900', letterSpacing: 0.8 },
  statusBadge: { borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: vs(4) },
  statusBadgeText: { fontSize: ms(10), fontWeight: 'bold' },
  activeCustomerName: { fontSize: ms(18), color: '#0F172A', fontWeight: '900', marginBottom: vs(6) },
  activeAddress: { fontSize: ms(13), color: '#475569', marginBottom: vs(16), lineHeight: vs(18) },

  itemsSectionTitle: { fontSize: ms(11), fontWeight: 'bold', color: '#1E293B', letterSpacing: 0.5, marginBottom: vs(8) },
  activeItemsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginBottom: vs(16) },
  itemPill: { backgroundColor: '#F8FAFC', borderRadius: s(12), paddingHorizontal: s(12), paddingVertical: vs(6), borderWidth: 1, borderColor: '#E2E8F0' },
  itemPillText: { fontSize: ms(11), color: '#0F172A', fontWeight: '600' },
  specialItemPill: { backgroundColor: '#F0FDF4', borderColor: '#16A34A' },
  specialItemPillText: { color: '#15803D', fontWeight: 'bold' },

  activeMetaRow: { backgroundColor: '#F8FAFC', borderRadius: s(14), padding: s(12), marginBottom: vs(16), borderWidth: 1, borderColor: '#E2E8F0' },
  activeMetaItem: { alignItems: 'center' },
  activeMetaLabel: { fontSize: ms(9), color: '#64748B', fontWeight: 'bold', marginBottom: vs(2), letterSpacing: 0.5 },
  activeMetaVal: { fontSize: ms(13), color: '#16A34A', fontWeight: 'bold' },

  // Gradient CTA Wrappers
  navigateTaskBtnWrapper: {
    borderRadius: s(16),
    overflow: 'hidden',
  },
  navigateTaskBtn: {
    padding: vs(14),
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.15,
    shadowRadius: s(8),
    elevation: 2,
  },
  navigateTaskBtnText: { color: '#FFFFFF', fontSize: ms(14), fontWeight: 'bold' },

  // Route card
  routeCard: {
    borderRadius: s(20),
    padding: s(18),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: s(14),
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  routeTitle: { fontSize: ms(15), color: themeColors.text, fontWeight: 'bold' },
  routePill: {
    backgroundColor: themeColors.isDark ? '#334155' : '#F1F5F9', borderRadius: s(12), paddingHorizontal: s(10), paddingVertical: vs(4),
  },
  routePillText: { color: themeColors.text, fontSize: ms(11), fontWeight: 'bold' },

  // Custom Delivery Progress Slider track
  deliveryProgressContainer: {
    backgroundColor: themeColors.background,
    borderRadius: s(18),
    padding: s(14),
    borderWidth: 1,
    borderColor: themeColors.border,
    marginBottom: vs(18),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  progressLabelLeft: { fontSize: ms(10), fontWeight: 'bold', color: themeColors.subtext },
  progressLabelCenter: { fontSize: ms(11), fontWeight: '900' },
  progressLabelRight: { fontSize: ms(10), fontWeight: 'bold', color: themeColors.subtext },
  progressBarTrack: {
    height: vs(8),
    backgroundColor: themeColors.border,
    borderRadius: s(4),
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: s(4),
  },
  progressRiderMarker: {
    position: 'absolute',
    width: s(24),
    height: vs(24),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    transform: [{ translateY: -1 }],
  },

  routeStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: vs(18) },
  routeStat: { alignItems: 'center' },
  routeStatValue: { fontSize: ms(20), color: '#16A34A', fontWeight: 'bold' },
  routeStatLabel: { fontSize: ms(11), color: themeColors.subtext, marginTop: vs(4), fontWeight: '500' },
  routeStatDivider: { width: 1, backgroundColor: themeColors.border },
  
  startBtnWrapper: {
    borderRadius: s(16),
    overflow: 'hidden',
  },
  startBtn: {
    padding: vs(14),
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.15,
    shadowRadius: s(8),
    elevation: 2,
  },
  startBtnText: { color: themeColors.surface, fontSize: ms(14), fontWeight: 'bold' },

  // Available/Open orders cards
  openOrdersCard: {
    borderRadius: s(20),
    padding: s(18),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: s(16),
    elevation: 3,
  },
  openOrdersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16) },
  openOrdersTitle: { fontSize: ms(15), color: themeColors.text, fontWeight: 'bold' },
  openOrdersCountBadge: { backgroundColor: '#DBEAFE', borderRadius: s(10), paddingHorizontal: s(10), paddingVertical: vs(4), borderWidth: 1, borderColor: '#BFDBFE' },
  openOrdersCountText: { color: '#1E40AF', fontSize: ms(10), fontWeight: 'bold' },
  openOrdersList: { gap: vs(12) },
  openOrderItem: { borderRadius: s(18), padding: s(14), borderWidth: 1, borderColor: themeColors.border },
  openOrderItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(6) },
  openOrderCustomer: { fontSize: ms(15), fontWeight: 'bold', color: themeColors.text },
  openOrderAmount: { fontSize: ms(13), fontWeight: 'bold', color: '#16A34A' },
  openOrderAddress: { fontSize: ms(12), color: themeColors.subtext, marginBottom: vs(10), lineHeight: vs(16) },
  openOrderItemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginBottom: vs(12) },
  openOrderItemPill: { backgroundColor: themeColors.surface, borderRadius: s(8), paddingHorizontal: s(8), paddingVertical: vs(4), borderWidth: 1, borderColor: themeColors.border },
  openOrderItemPillText: { fontSize: ms(10), color: themeColors.text },
  openOrderMoreItems: { fontSize: ms(10), color: themeColors.subtext, alignSelf: 'center', fontWeight: '600' },
  
  openOrderClaimBtnWrapper: {
    borderRadius: s(12),
    overflow: 'hidden',
  },
  openOrderClaimBtn: { paddingVertical: vs(10), alignItems: 'center' },
  openOrderClaimBtnDisabled: { opacity: 0.6 },
  openOrderClaimBtnText: { color: themeColors.surface, fontSize: ms(13), fontWeight: 'bold' },
});
