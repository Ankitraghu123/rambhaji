// app/(tabs)/available-orders.js
// SCR-06: Available Orders — Claim new delivery orders with premium motion empty state

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useDynamicBranding } from '../../src/core/branding/useDynamicBranding';

import {
  Ionicons,
  Feather,
  MaterialCommunityIcons
} from '@expo/vector-icons';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
  ZoomIn,
  SlideInDown,
  SlideOutDown,
  interpolate
} from 'react-native-reanimated';

import { s, vs, ms } from '../../src/core/utils/responsive';
import {
  selectAvailableOrders,
  selectAvailableOrdersLoading,
  selectAvailableOrdersError
} from '../../src/features/routes/state/availableOrdersSlice';
import AvailableOrdersService from '../../src/features/routes/services/AvailableOrdersService';
import { AnimatedCard, triggerHaptic, SkeletonCard } from '../../src/components/common/Motion';

const selectMyOrders = (state) => state.route?.orders || [];

// ─── Category Emoji Helper ───────────────────────────────────────────────────
function getCategoryEmoji(category = '', name = '') {
  const c = category.toLowerCase();
  const n = name.toLowerCase();
  if (c.includes('water') || n.includes('water') || n.includes('alkaline')) return '💧';
  if (c.includes('fruit') || n.includes('apple') || n.includes('banana') || n.includes('mango') || n.includes('orange')) return '🍎';
  if (c.includes('veg') || n.includes('onion') || n.includes('potato') || n.includes('tomato') || n.includes('spinach')) return '🥬';
  return '📦';
}

// ─── Live Dot Pulsing Badge ──────────────────────────────────────────────────
function LivePulseBadge() {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1600, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.6], [0.5, 0]),
  }));

  return (
    <View style={styles.liveChip}>
      <Animated.View style={[styles.liveDotGlow, glowStyle]} />
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

// ─── Radar Search Package Illustration ───────────────────────────────────────
function RadarSearchingIllustration() {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(2.4, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulse2.value = withDelay(
      1100,
      withRepeat(
        withTiming(2.4, { duration: 2200, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: interpolate(pulse1.value, [1, 2.4], [0.45, 0]),
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: interpolate(pulse2.value, [1, 2.4], [0.45, 0]),
  }));

  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.radarContainer}>
      <Animated.View style={[styles.radarRing, ringStyle1]} />
      <Animated.View style={[styles.radarRing, ringStyle2]} />
      <Animated.View style={[styles.radarCenter, floatStyle]}>
        <MaterialCommunityIcons name="package-variant-closed" size={48} color="#166534" />
      </Animated.View>
    </View>
  );
}

// ─── Large Green Gradient Button ─────────────────────────────────────────────
function RefreshGradientButton({ onPress, loading }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const scale = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      spin.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      spin.value = 0;
    }
  }, [loading]);

  const handlePressIn = () => {
    triggerHaptic('light');
    scale.value = withTiming(0.96, { duration: 90 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.refreshBtnWrapper, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={loading}
        style={styles.refreshBtn}
      >
        <LinearGradient
          colors={['#1D4ED8', '#00B4D8', '#E024E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.refreshBtnGradient}
        >
          {loading ? (
            <Animated.View style={[styles.spinnerWrapper, spinStyle]}>
              <Feather name="refresh-cw" size={18} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <Feather name="refresh-cw" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.refreshBtnText}>
            {loading ? 'Refreshing Orders...' : 'Refresh Orders'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Sliding bottom sheet for new order arrival ──────────────────────────────
function NewOrderBottomSheet({ order, onClaim, onClose }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);

  const claimScale = useSharedValue(1);

  const handlePressIn = () => {
    triggerHaptic('medium');
    claimScale.value = withTiming(0.95, { duration: 90 });
  };

  const handlePressOut = () => {
    claimScale.value = withSpring(1, { damping: 9 });
  };

  const animBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: claimScale.value }],
  }));

  if (!order) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(450)}
      exiting={SlideOutDown.duration(300)}
      style={styles.sheetOverlay}
    >
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHeaderIndicator} />

        <View style={styles.sheetContent}>
          <View style={styles.sheetTitleRow}>
            <View style={styles.sheetGiftBox}>
              <Text style={{ fontSize: 24 }}>🎉</Text>
            </View>
            <View>
              <Text style={styles.sheetTitle}>New Delivery Assigned</Text>
              <Text style={styles.sheetSubtitle}>Ready for immediate logistics claim</Text>
            </View>
          </View>

          <View style={styles.sheetDivider} />

          <View style={styles.sheetOrderDetails}>
            <View style={styles.sheetDetailItem}>
              <Feather name="user" size={14} color="#64748B" />
              <Text style={styles.sheetDetailText}>{order.customerName}</Text>
            </View>
            <View style={styles.sheetDetailItem}>
              <Feather name="map-pin" size={14} color="#64748B" />
              <Text style={styles.sheetDetailText}>{order.distance || 'Nearby'}</Text>
            </View>
          </View>

          <Animated.View style={animBtnStyle}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => onClaim(order)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Accept and claim order for ${order?.customerName || 'customer'}`}
              accessibilityHint="Accepts the newly assigned order"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.sheetClaimBtn, { minHeight: 48 }]}
            >
              <LinearGradient
                colors={['#1D4ED8', '#00B4D8', '#E024E3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sheetClaimBtnGradient}
              >
                <Text style={styles.sheetClaimBtnText}>Accept & Claim Now ➔</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss assignment modal"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.sheetCloseBtn, { minHeight: 48, justifyContent: 'center' }]}
          >
            <Text style={styles.sheetCloseBtnText}>Dismiss assignment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Single Order Card ────────────────────────────────────────────────────────
function AvailableOrderCard({ order, index, onClaim, claiming }) {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  return (
    <AnimatedCard delay={index * 80}>
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>#{String(order.id).slice(-4)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>
                {order.paymentMode === 'COD' ? `💵 COD ₹${order.codAmount}` : '✅ Prepaid'}
              </Text>
            </View>
            {order.isMyOrder && (
              <View style={[styles.paymentBadge, { backgroundColor: '#E9F5EF', borderColor: '#2E9D6A' }]}>
                <Text style={[styles.paymentBadgeText, { color: '#2E9D6A' }]}>
                  ✓ Accepted
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.address} numberOfLines={2}>
          📍 {order.address || 'Address not available'}
        </Text>

        {/* Distance / Amount */}
        {(order.distance || order.estimatedAmount) ? (
          <View style={styles.metaRow}>
            {order.distance ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>🛵 {order.distance}</Text>
              </View>
            ) : null}
            {order.estimatedAmount ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>💰 ₹{order.estimatedAmount}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <View style={styles.itemsRow}>
            {order.items.slice(0, 4).map((item, i) => {
              const emoji = getCategoryEmoji(item.category, item.productName);
              return (
                <View key={i} style={styles.itemPill}>
                  <Text style={styles.itemPillText}>
                    {emoji} {item.productName}
                    {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                  </Text>
                </View>
              );
            })}
            {order.items.length > 4 && (
              <Text style={styles.moreItems}>+{order.items.length - 4} more</Text>
            )}
          </View>
        )}

        {/* Claim / Details Button */}
        {order.isMyOrder ? (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: '#10B981', shadowColor: '#10B981', minHeight: 48, justifyContent: 'center' }]}
            onPress={() => router.push(`/order/${order.id}`)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Open order details for ${order.customerName}`}
            accessibilityHint="Navigates to full order delivery screen"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.claimBtnText}>🚀 Open Order Details</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.claimBtn, claiming && styles.claimBtnDisabled, { minHeight: 48, justifyContent: 'center' }]}
            onPress={() => onClaim(order)}
            activeOpacity={0.8}
            disabled={claiming}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Accept order for ${order.customerName}`}
            accessibilityHint="Claims this order and adds it to your active deliveries"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {claiming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.claimBtnText}>Accept This Order</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </AnimatedCard>
  );
}

const MemoizedAvailableOrderCard = React.memo(AvailableOrderCard);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AvailableOrdersScreen() {
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);
  const availableOrders = useSelector(selectAvailableOrders);
  const isLoading = useSelector(selectAvailableOrdersLoading);
  const error = useSelector(selectAvailableOrdersError);
  const myOrders = useSelector(selectMyOrders);

  const [claimingId, setClaimingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [assignedOrder, setAssignedOrder] = useState(null);
  const prevOrdersRef = useRef([]);

  const mergedOrders = useMemo(() => {
    return availableOrders.map((o) => ({
      ...o,
      isMyOrder: false,
    }));
  }, [availableOrders]);

  const paginatedOrders = useMemo(() => {
    return mergedOrders.slice(0, visibleCount);
  }, [mergedOrders, visibleCount]);

  // Auto-refresh available orders once whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      AvailableOrdersService.loadAvailableOrders();
      return () => {};
    }, [])
  );

  // Background auto-refresh polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      AvailableOrdersService.loadAvailableOrders(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Monitor order list for new order arrival triggers
  useEffect(() => {
    const prevOrders = prevOrdersRef.current;
    if (availableOrders.length > prevOrders.length && prevOrders.length > 0) {
      const prevIds = prevOrders.map((o) => o.id);
      const newOrders = availableOrders.filter((o) => !prevIds.includes(o.id));
      if (newOrders.length > 0) {
        setAssignedOrder(newOrders[0]);
        triggerHaptic('success');
      }
    }
    prevOrdersRef.current = availableOrders;
  }, [availableOrders]);

  const onRefresh = useCallback(() => {
    setVisibleCount(6);
    AvailableOrdersService.loadAvailableOrders(true);
  }, []);

  const handleClaim = useCallback((order) => {
    triggerHaptic('success');
    setClaimingId(order.id);
    setAssignedOrder(null); // Clear bottom sheet if open
    AvailableOrdersService.claimOrder(order);
    Alert.alert('🎉 Order Claimed!', `Order #${String(order.id).slice(-4)} has been added to your deliveries.`);
    setClaimingId(null);
  }, []);

  const loadMore = useCallback(() => {
    if (visibleCount < mergedOrders.length) {
      setVisibleCount((prev) => prev + 6);
    }
  }, [visibleCount, mergedOrders.length]);

  const renderFooter = () => {
    if (visibleCount >= mergedOrders.length) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#2E9D6A" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        {/* Radar concentric searching package anim */}
        <RadarSearchingIllustration />
        
        <Text style={styles.emptyTitle}>No Orders Available</Text>
        <Text style={styles.emptySubtitle}>
          You're all caught up!{"\n"}
          There are currently no pending deliveries assigned to you.{"\n"}
          Pull down to refresh or wait for new assignments.
        </Text>
        
        <RefreshGradientButton onPress={onRefresh} loading={isLoading} />
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#F0F7FF', '#E0F2FE']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.root} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pending Orders</Text>
            <Text style={styles.subtitle}>
              {availableOrders.length} Ready to Claim
            </Text>
          </View>

          {/* Pulsing Live badge */}
          <LivePulseBadge />
        </View>

        {/* Loading skeleton shimmer while first loading */}
        {isLoading && mergedOrders.length === 0 && (
          <View style={[styles.list, { flex: 1 }]}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Error Banner */}
        {error && mergedOrders.length === 0 && !isLoading && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Orders List */}
        {!isLoading || mergedOrders.length > 0 ? (
          <FlatList
            data={paginatedOrders}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <MemoizedAvailableOrderCard
                order={item}
                index={index}
                onClaim={handleClaim}
                claiming={claimingId === item.id}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                tintColor="#00B4D8"
                colors={['#00B4D8', '#E024E3', '#1D4ED8']}
              />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            initialNumToRender={5}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
          />
        ) : null}

        {/* New Order Bottom Sheet overlay */}
        <NewOrderBottomSheet
          order={assignedOrder}
          onClaim={handleClaim}
          onClose={() => setAssignedOrder(null)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (themeColors) => StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: vs(12),
    paddingBottom: vs(14),
  },
  title: {
    fontSize: ms(24),
    fontWeight: 'bold',
    color: '#00B4D8',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: ms(13),
    color: '#64748B',
    fontFamily: 'System',
    marginTop: vs(2),
    fontWeight: '600',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#E8F5E9',
    borderRadius: s(20),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderWidth: 1.2,
    borderColor: '#C8E6C9',
    position: 'relative',
  },
  liveDotGlow: {
    position: 'absolute',
    left: s(12),
    width: s(7),
    height: s(7),
    borderRadius: s(4),
    backgroundColor: '#22C55E',
  },
  liveDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(4),
    backgroundColor: '#16A34A',
    zIndex: 2,
  },
  liveText: {
    fontSize: ms(11),
    fontWeight: 'bold',
    color: '#16A34A',
    letterSpacing: 0.8,
  },

  // List
  list: {
    paddingHorizontal: s(20),
    paddingTop: vs(4),
    paddingBottom: vs(40),
    gap: vs(14),
    flexGrow: 1,
  },

  // Card
  card: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)',
    borderRadius: s(22),
    padding: s(18),
    borderWidth: 1.5,
    borderColor: '#00B4D8',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.1,
    shadowRadius: s(10),
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadgeText: {
    fontSize: ms(12),
    fontWeight: 'bold',
    color: themeColors.subtext,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  paymentBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  paymentBadgeText: {
    fontSize: ms(12),
    fontWeight: 'bold',
    color: '#16A34A',
    fontFamily: 'System',
  },

  customerName: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: '#F8FAFC',
    fontFamily: 'System',
    marginBottom: vs(5),
  },
  address: {
    fontSize: ms(13),
    color: '#94A3B8',
    fontFamily: 'System',
    lineHeight: vs(18),
    marginBottom: vs(10),
  },

  metaRow: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: vs(10),
  },
  metaChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  metaChipText: {
    fontSize: ms(12),
    color: '#D97706',
    fontWeight: 'bold',
    fontFamily: 'System',
  },

  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginBottom: vs(14),
  },
  itemPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemPillText: {
    fontSize: ms(12),
    color: themeColors.text,
    fontFamily: 'System',
    fontWeight: '500',
  },
  moreItems: {
    fontSize: ms(12),
    color: themeColors.subtext,
    fontFamily: 'System',
    alignSelf: 'center',
    fontWeight: '600',
  },

  claimBtn: {
    backgroundColor: '#00B4D8',
    borderRadius: s(16),
    paddingVertical: vs(14),
    alignItems: 'center',
    shadowColor: '#00B4D8',
    shadowOpacity: 0.15,
    shadowRadius: s(8),
    elevation: 3,
  },
  claimBtnDisabled: {
    backgroundColor: '#BAE6FD',
  },
  claimBtnText: {
    color: themeColors.surface,
    fontSize: ms(15),
    fontWeight: 'bold',
    fontFamily: 'System',
  },

  // Redesigned empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: vs(50),
    paddingHorizontal: s(24),
  },
  radarContainer: {
    width: s(170),
    height: s(170),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: vs(24),
  },
  radarRing: {
    position: 'absolute',
    width: s(110),
    height: s(110),
    borderRadius: s(55),
    borderWidth: 2,
    borderColor: '#00B4D8',
    backgroundColor: 'rgba(0, 180, 216, 0.04)',
  },
  radarCenter: {
    width: ms(76),
    height: ms(76),
    borderRadius: ms(38),
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: ms(22),
    fontWeight: 'bold',
    color: themeColors.text,
    fontFamily: 'System',
    marginBottom: vs(10),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: ms(13),
    color: themeColors.subtext,
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: vs(20),
    marginBottom: vs(28),
    fontWeight: '500',
  },

  // Refresh Gradient button styles
  refreshBtnWrapper: {
    width: '100%',
    paddingHorizontal: s(8),
  },
  refreshBtn: {
    width: '100%',
    height: vs(56),
    borderRadius: ms(18),
    overflow: 'hidden',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshBtnGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnText: {
    color: themeColors.surface,
    fontWeight: 'bold',
    fontSize: ms(16),
    fontFamily: 'System',
  },
  spinnerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error banner
  errorBanner: {
    marginHorizontal: s(20),
    backgroundColor: '#FEF2F2',
    borderRadius: s(14),
    padding: s(14),
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: vs(8),
  },
  errorText: {
    fontSize: ms(13),
    color: '#DC2626',
    fontFamily: 'System',
    fontWeight: '500',
  },

  // Sliding sheet styles
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  sheetContainer: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingBottom: vs(32),
    paddingHorizontal: s(24),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHeaderIndicator: {
    width: s(40),
    height: vs(5),
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: vs(12),
    marginBottom: vs(20),
  },
  sheetContent: {
    width: '100%',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  sheetGiftBox: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
  },
  sheetTitle: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: themeColors.text,
  },
  sheetSubtitle: {
    fontSize: ms(13),
    color: themeColors.subtext,
    fontWeight: '600',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: vs(16),
  },
  sheetOrderDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: ms(16),
    padding: ms(14),
    gap: vs(8),
    marginBottom: vs(24),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sheetDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  sheetDetailText: {
    fontSize: ms(14),
    color: '#374151',
    fontWeight: '600',
  },
  sheetClaimBtn: {
    width: '100%',
    height: vs(56),
    borderRadius: ms(18),
    overflow: 'hidden',
    marginBottom: vs(12),
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetClaimBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetClaimBtnText: {
    color: themeColors.surface,
    fontWeight: 'bold',
    fontSize: ms(16),
  },
  sheetCloseBtn: {
    alignItems: 'center',
    paddingVertical: vs(6),
  },
  sheetCloseBtnText: {
    fontSize: ms(14),
    color: themeColors.subtext,
    fontWeight: 'bold',
  },
});
