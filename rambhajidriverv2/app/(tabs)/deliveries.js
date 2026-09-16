// app/(tabs)/deliveries.js
// SCR-05: Redesigned deliveries list screen with premium Segment slider,
// typewriter placeholder typing effect, collapsible details cards, 60 FPS spring stagger entries,
// custom scroll pull-to-refresh scooter, and floating empty states.

import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, RefreshControl,
  ActivityIndicator, Animated, Easing, Dimensions, TouchableOpacity,
  LayoutAnimation, UIManager, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { s, vs, ms } from '../../src/core/utils/responsive';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useDynamicBranding } from '../../src/core/branding/useDynamicBranding';
import { triggerHaptic, SkeletonCard } from '../../src/components/common/Motion';
import SwipeToConfirmButton from '../../src/components/common/SwipeToConfirmButton';
import RouteService from '../../src/features/routes/services/RouteService';
import { truncate, categoryLabel } from '../../src/core/utils/formatUtils';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILTERS = ['All', 'Pending', 'Completed'];

const STATUS_COLORS = {
  ASSIGNED:   '#F59E0B', // Pending / Amber
  IN_TRANSIT: '#16A34A', // Action / Corporate Green
  COMPLETED:  '#16A34A', // Fresh Green
  RETURNED:   '#EF4444', // Error Red
  FAILED:     '#EF4444', // Error Red
  REPLACED:   '#3B82F6', // Blue
  REPLACEMENT_SCHEDULED: '#3B82F6', // Blue
};

const STATUS_LABELS = {
  ASSIGNED:   'Pending',
  IN_TRANSIT: 'In Transit',
  COMPLETED:  'Delivered',
  RETURNED:   'Returned Items',
  FAILED:     'Failed',
  REPLACED:   'Returned Order',
  REPLACEMENT_SCHEDULED: 'Rescheduled',
};

// 🔢 COUNT-UP NUMBER ANIMATION COMPONENT
const CountUpNumber = memo(function CountUpNumber({ value, style }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end) || end === 0) {
      setDisplayVal(0);
      return;
    }
    const duration = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      const current = Math.round(easeProgress * end);
      setDisplayVal(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <Text style={style}>{displayVal}</Text>;
});

// 🎈 GENTLE FLOATING EFFECT WRAPPER
const FloatingItemPill = memo(function FloatingItemPill({ children, delay = 0 }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(floatAnim, {
          toValue: -2.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 2.5,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, delay]);

  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
      {children}
    </Animated.View>
  );
});

// ⌨️ SEARCH PLACEHOLDER TYPEWRITER EFFECT
const useTypewriterPlaceholder = (phrases, speed = 80, delayBetween = 1500) => {
  const [placeholder, setPlaceholder] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIdx];
    let timer;

    if (isDeleting) {
      timer = setTimeout(() => {
        setPlaceholder(currentPhrase.substring(0, charIdx - 1));
        setCharIdx((prev) => prev - 1);
      }, speed / 2);
    } else {
      timer = setTimeout(() => {
        setPlaceholder(currentPhrase.substring(0, charIdx + 1));
        setCharIdx((prev) => prev + 1);
      }, speed);
    }

    if (!isDeleting && charIdx === currentPhrase.length) {
      timer = setTimeout(() => setIsDeleting(true), delayBetween);
    } else if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setPhraseIdx((prev) => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, phraseIdx, phrases]);

  return placeholder;
};

// 📦 ORDER CARD COMPONENT
const OrderCard = memo(function OrderCard({ order, index, themeColors }) {
  const styles = getStyles(themeColors);
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[order.status] || '#64748B';

  const getOrderDisplayId = (id) => {
    const str = String(id || '');
    if (str.startsWith('SIM-')) return '#' + str.slice(-4);
    if (str.includes('-')) return '#' + str.slice(-4);
    return '#' + str;
  };

  // Staggered Entrance Animations
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // Chevron rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0, tension: 120, friction: 8, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 120, friction: 8, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [index]);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const toggleExpand = () => {
    triggerHaptic('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Animated.View style={{ opacity, transform: [{ scale }, { translateY }], marginBottom: 12 }}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.card, expanded && styles.cardExpanded]}
        onPress={toggleExpand}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Order ${getOrderDisplayId(order.id)} for ${order.customerName}, Status ${STATUS_LABELS[order.status] || order.status}`}
        accessibilityHint="Double tap to expand or collapse delivery details"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Index Bubble */}
          <View style={styles.cardLeft}>
            <View style={[styles.indexBubble, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
              <Text style={[styles.indexText, { color: statusColor }]}>{getOrderDisplayId(order.id)}</Text>
            </View>
          </View>

          {/* Card main contents */}
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.customerName} numberOfLines={1}>
                {order.customerName}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '12' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {STATUS_LABELS[order.status] || order.status}
                </Text>
              </View>
            </View>
            <Text style={styles.address}>📍 {expanded ? order.address : truncate(order.address, 45)}</Text>
          </View>

          {/* Chevron expander */}
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Text style={styles.chevron}>›</Text>
          </Animated.View>
        </View>

        {/* Staggered expanded detailed content */}
        {expanded && (
          <View style={styles.expandedContent}>
            {order.deliveryInstructions ? (
              <View style={styles.instructionBox}>
                <Text style={styles.instructionText}>📝 Instructions: {order.deliveryInstructions}</Text>
              </View>
            ) : null}

            <Text style={styles.itemsTitle}>Items scheduled:</Text>
            <View style={styles.itemsRow}>
              {order.items?.map((item, i) => {
                const isWater = item.category?.toLowerCase().includes('water') || item.name?.toLowerCase().includes('water');
                return (
                  <FloatingItemPill key={i} delay={i * 120}>
                    <View style={[styles.itemPill, isWater && styles.waterPill]}>
                      <Text style={[styles.itemText, isWater && styles.waterText]}>
                        {isWater ? '💧' : '🥬'} {item.productName || item.name || categoryLabel(item.category)}
                      </Text>
                    </View>
                  </FloatingItemPill>
                );
              })}
            </View>

            {/* Clean Normal Action Button */}
            <SwipeToConfirmButton
              title="Start Navigation & Delivery"
              onConfirm={() => {
                router.push(`/order/${order.id}`);
              }}
              style={{ marginTop: vs(10) }}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// Local selectors to avoid Metro resolution circularity or undefined issues
const selectAllOrders = (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const seenIds = new Set(activeOrders.map(o => o.id));
  const uniqueHistory = historyOrders.filter(o => !seenIds.has(o.id));
  return [...activeOrders, ...uniqueHistory];
};
const selectRouteLoading = (state) => state.route?.loading || false;
const selectIsOnline = (state) => state.auth?.isOnline ?? true;

export default function DeliveriesScreen() {
  const orders = useSelector(selectAllOrders);
  const isLoading = useSelector(selectRouteLoading);
  const isOnline = useSelector(selectIsOnline);
  const { filter } = useLocalSearchParams();
  const { themeColors } = useDynamicBranding();
  const styles = getStyles(themeColors);

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  // Typewriter phrases
  const phrases = ['Search client name...', 'Search Bhopal address...', 'Search order ID...'];
  const typewriterPlaceholder = useTypewriterPlaceholder(phrases);

  // Scroll animations values
  const scrollY = useRef(new Animated.Value(0)).current;
  const loadingRideAnim = useRef(new Animated.Value(0)).current;

  // Filter morph slide pill width configuration
  const filterPillWidth = (SCREEN_WIDTH - 48) / 3;
  const filterPillTranslateX = useRef(new Animated.Value(0)).current;

  // Debounce search input changes by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  useEffect(() => {
    if (filter) {
      const matched = FILTERS.find((f) => f.toLowerCase() === filter.toLowerCase());
      if (matched) {
        setActiveFilter(matched);
      }
    }
  }, [filter]);

  // Auto-refresh today's route & history on screen focus once
  useFocusEffect(
    useCallback(() => {
      RouteService.loadTodaysRoute();
      RouteService.fetchHistoryCount();
      return () => {};
    }, [])
  );

  // Tab segment slider spring transition
  useEffect(() => {
    const targetIdx = FILTERS.indexOf(activeFilter);
    Animated.spring(filterPillTranslateX, {
      toValue: targetIdx * filterPillWidth,
      tension: 180,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeFilter]);

  const isPendingOrder = useCallback((o) => {
    const s = (o.status || '').toUpperCase();
    return (
      s === 'ASSIGNED' ||
      s === 'IN_TRANSIT' ||
      s === 'READY_FOR_DELIVERY' ||
      s === 'READY_FOR_DISPATCH' ||
      s === 'PENDING' ||
      (s !== 'COMPLETED' && s !== 'DELIVERED' && s !== 'RETURNED' && s !== 'REPLACED' && s !== 'REPLACEMENT_SCHEDULED' && s !== 'FAILED')
    );
  }, []);

  const isCompletedOrder = useCallback((o) => {
    const s = (o.status || '').toUpperCase();
    return (
      s === 'COMPLETED' ||
      s === 'DELIVERED' ||
      s === 'RETURNED' ||
      s === 'REPLACED' ||
      s === 'REPLACEMENT_SCHEDULED'
    );
  }, []);

  const filtered = useMemo(() => {
    let list = orders;

    // Filter by tab
    if (activeFilter === 'Pending') {
      list = list.filter(isPendingOrder);
    } else if (activeFilter === 'Completed') {
      list = list.filter(isCompletedOrder);
    }

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q) ||
          String(o.id).includes(q)
      );
    }

    // Sort order: active pending first
    return [...list].sort((a, b) => {
      const aActive = isPendingOrder(a);
      const bActive = isPendingOrder(b);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });
  }, [orders, activeFilter, searchQuery, isPendingOrder, isCompletedOrder]);

  const paginatedOrders = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const loadMore = useCallback(() => {
    if (visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + 6);
    }
  }, [visibleCount, filtered.length]);

  const getTabCount = (f) => {
    if (f === 'All') return orders.length;
    if (f === 'Pending') return orders.filter(isPendingOrder).length;
    if (f === 'Completed') return orders.filter(isCompletedOrder).length;
    return 0;
  };

  const onRefresh = useCallback(() => {
    setVisibleCount(6);
    if (isOnline) {
      RouteService.loadTodaysRoute(true);
      RouteService.fetchHistoryCount();
    }
  }, [isOnline]);

  // Loop ride animation during refresh
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

  // Interpolated Header Shrinking style values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [90, 60],
    extrapolate: 'clamp',
  });

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 45],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* 🛵 Custom Scooter Pull-To-Refresh Indicator */}
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

      {/* Shrinking Sticky Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Animated.Text style={[styles.title, { color: themeColors.primary, transform: [{ scale: titleScale }] }]}>
            Deliveries
          </Animated.Text>
          <View style={[styles.onlineStatus, { backgroundColor: isOnline ? '#E9F5EF' : '#FEE2E2', borderColor: isOnline ? '#A7F3D0' : '#FCA5A5' }]}>
            <View style={[styles.dot, { backgroundColor: isOnline ? '#2E9D6A' : '#DC2626' }]} />
            <Text style={[styles.statusLbl, { color: isOnline ? '#2E9D6A' : '#DC2626' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          {orders.length} total scheduled today
        </Animated.Text>
      </Animated.View>

      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchInputValue}
          onChangeText={(text) => {
            setSearchInputValue(text);
            setVisibleCount(6);
          }}
          placeholder={typewriterPlaceholder}
          placeholderTextColor="#94A3B8"
        />
        {searchInputValue.length > 0 && (
          <TouchableOpacity onPress={() => setSearchInputValue('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Morphing Segmented Filters Slider */}
      <View style={styles.filterRow}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 4,
            width: filterPillWidth - 2.5,
            backgroundColor: themeColors.primary,
            borderRadius: 20,
            transform: [{ translateX: filterPillTranslateX }],
            zIndex: 1,
            shadowColor: themeColors.primary,
            shadowOpacity: 0.15,
            shadowRadius: 5,
            elevation: 3,
          }}
        />
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          const count = getTabCount(f);
          return (
            <TouchableOpacity
              key={f}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${f} filter, ${count} items`}
              accessibilityHint={`Filters list to show ${f} orders`}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={{ flex: 1, paddingVertical: 12, minHeight: 48, justifyContent: 'center', alignItems: 'center', zIndex: 2 }}
              onPress={() => {
                triggerHaptic('light');
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveFilter(f);
                setVisibleCount(6);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: isActive ? '#FFFFFF' : '#475569', fontSize: 13, fontWeight: 'bold' }}>
                  {f}
                </Text>
                <CountUpNumber
                  value={count}
                  style={{
                    color: isActive ? '#FFFFFF' : '#64748B',
                    fontSize: 10,
                    fontWeight: '800',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 8,
                  }}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading Skeleton Shimmer */}
      {isLoading && filtered.length === 0 ? (
        <View style={[styles.list, { flex: 1 }]}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        /* FlatList */
        <FlatList
          data={paginatedOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <OrderCard order={item} index={index} themeColors={themeColors} />
          )}
          contentContainerStyle={styles.list}
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          onScrollEndDrag={(e) => {
            const { contentOffset } = e.nativeEvent;
            if (contentOffset.y <= -80 && !isLoading) {
              triggerHaptic('medium');
              onRefresh();
            }
          }}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {/* Floating packages empty animation */}
              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: scrollY.interpolate({
                        inputRange: [-100, 0],
                        outputRange: [-15, 0],
                        extrapolate: 'clamp',
                      })
                    }
                  ],
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 64 }}>📦</Text>
              </Animated.View>
              <Text style={[styles.emptyTitle, { color: themeColors.primary }]}>No deliveries assigned yet.</Text>
              <Text style={styles.emptySubtitle}>Pull down to check for assigned delivery stops.</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.emptyRefreshBtn, { backgroundColor: themeColors.primary }]}
                onPress={() => {
                  triggerHaptic('medium');
                  onRefresh();
                }}
              >
                <Text style={styles.emptyRefreshBtnText}>🔄 Refresh Deliveries</Text>
              </TouchableOpacity>
            </View>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.25}
          initialNumToRender={5}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F7FF' },
  header: { paddingHorizontal: s(20), paddingTop: vs(14), paddingBottom: vs(6), justifyContent: 'center' },
  title: { fontSize: ms(24), fontWeight: '900', fontFamily: 'System' },
  subtitle: { fontSize: ms(13), fontFamily: 'System', color: '#1E293B', marginTop: vs(2), fontWeight: 'bold' },
  
  onlineStatus: {
    flexDirection: 'row', alignItems: 'center', gap: s(5),
    borderRadius: s(12), paddingHorizontal: s(8), paddingVertical: vs(4), borderWidth: 1,
    backgroundColor: '#E9F5EF', borderColor: '#A7F3D0',
  },
  dot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: '#2E9D6A' },
  statusLbl: { fontSize: ms(10), fontWeight: '800', color: '#2E9D6A' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F9FF', borderRadius: s(18), marginHorizontal: s(20), marginBottom: vs(14),
    borderWidth: 1.5, borderColor: '#00B4D8', paddingHorizontal: s(14), height: vs(48),
    shadowColor: '#1D4ED8', shadowOpacity: 0.08, shadowRadius: s(10), elevation: 3,
  },
  searchIcon: { fontSize: ms(16), marginRight: s(8) },
  searchInput: { flex: 1, color: '#0F172A', fontFamily: 'System', fontSize: ms(14), fontWeight: '600' },
  clearBtn: { padding: s(4), marginLeft: s(4) },
  clearBtnText: { color: '#E024E3', fontWeight: 'bold', fontSize: ms(14) },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: s(24),
    padding: s(4),
    marginHorizontal: s(20),
    marginBottom: vs(16),
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#00B4D8',
  },

  list: { paddingHorizontal: s(20), paddingTop: vs(4), gap: 0, paddingBottom: vs(40) },

  card: {
    backgroundColor: 'rgba(240, 247, 255, 0.96)', borderRadius: s(20), padding: s(16),
    borderWidth: 1.5, borderColor: '#00B4D8',
    shadowColor: '#1D4ED8', shadowOpacity: 0.1, shadowRadius: s(10), elevation: 3,
  },
  cardExpanded: {
    borderColor: '#E024E3',
    shadowColor: '#E024E3', shadowOpacity: 0.15, shadowRadius: s(16), elevation: 5,
  },
  cardLeft: { alignItems: 'center' },
  indexBubble: {
    width: s(38), height: s(38), borderRadius: s(19), borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  indexText: { fontSize: ms(10), fontFamily: 'System', fontWeight: 'bold' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(6) },
  customerName: { fontSize: ms(16), fontFamily: 'System', color: '#0F172A', fontWeight: 'bold', flex: 1 },
  statusPill: { borderRadius: s(8), paddingHorizontal: s(8), paddingVertical: vs(4), marginLeft: s(8) },
  statusText: { fontSize: ms(10), fontFamily: 'System', fontWeight: 'bold' },
  address: { fontSize: ms(12), color: '#64748B', fontFamily: 'System', lineHeight: vs(16) },
  chevron: { fontSize: ms(24), color: themeColors.subtext, paddingLeft: s(4), paddingBottom: vs(3) },

  // Expanded card styling
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    marginTop: vs(14),
    paddingTop: vs(14),
  },
  instructionBox: {
    backgroundColor: themeColors.background,
    borderColor: themeColors.border,
    borderWidth: 1,
    borderRadius: s(12),
    padding: s(10),
    marginBottom: vs(12),
  },
  instructionText: {
    fontSize: ms(12),
    color: '#F59E0B',
    fontWeight: '600',
    lineHeight: vs(16),
  },
  itemsTitle: {
    fontSize: ms(11),
    fontWeight: 'bold',
    color: themeColors.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: vs(8),
  },
  itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginBottom: vs(14) },
  itemPill: {
    backgroundColor: themeColors.background, borderRadius: s(10),
    paddingHorizontal: s(10), paddingVertical: vs(5), borderWidth: 1, borderColor: themeColors.border,
  },
  waterPill: {
    backgroundColor: themeColors.isDark ? '#334155' : '#F1F5F9', borderColor: themeColors.border,
  },
  itemText: { fontSize: ms(11), color: themeColors.text, fontFamily: 'System', fontWeight: '500' },
  waterText: { color: '#16A34A', fontWeight: 'bold' },

  actionBtn: {
    borderRadius: s(14),
    paddingVertical: vs(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.15,
    shadowRadius: s(8),
    elevation: 3,
  },
  actionBtnText: {
    color: themeColors.surface,
    fontSize: ms(13),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  emptyContainer: { alignItems: 'center', paddingTop: vs(80), paddingHorizontal: s(20) },
  emptyTitle: { fontSize: ms(18), fontFamily: 'System', fontWeight: 'bold', marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(13), color: themeColors.subtext, fontFamily: 'System', textAlign: 'center', marginBottom: vs(20) },
  emptyRefreshBtn: {
    borderRadius: s(14),
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.12,
    shadowRadius: s(6),
    elevation: 2,
  },
  emptyRefreshBtnText: {
    color: themeColors.surface,
    fontSize: ms(13),
    fontWeight: 'bold',
  }
});
