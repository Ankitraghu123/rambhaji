// app/(tabs)/returns.js
// SCR-07: Returns and Replacements list with status tracking
// Redesigned with premium fresh green theme (fruits, vegetables & alkaline water)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { s, vs, ms } from '../../src/core/utils/responsive';
import { router, useLocalSearchParams } from 'expo-router';
import { truncate } from '../../src/core/utils/formatUtils';
import { Image } from 'expo-image';
import { AnimatedCard, AnimatedPressable, NoOrdersAnim, SkeletonCard, triggerHaptic } from '../../src/components/common/Motion';
import RouteService from '../../src/features/routes/services/RouteService';

// Local selectors — strictly deduplicate active + history. Server now correctly maps status from DeliveryItems.
const selectAllOrdersCombined = (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const combinedRaw = [...activeOrders, ...historyOrders];

  const uniqueCombined = [];
  const seenIds = new Set();
  combinedRaw.forEach(o => {
    const key = String(o.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      uniqueCombined.push(o);
    }
  });

  return uniqueCombined;
};

const selectReturnedOrders = (state) => {
  // Server now correctly maps RETURNED from DeliveryItems — use only server data
  return selectAllOrdersCombined(state).filter((o) => o.status === 'RETURNED');
};

const selectReplacementOrders = (state) => {
  // Server now correctly maps REPLACED from DeliveryItems — use only server data
  return selectAllOrdersCombined(state).filter((o) => o.status === 'REPLACED');
};

const selectRouteLoading = (state) => state.route?.isLoading;
const selectIsOnline = (state) => state.sync?.isOnline;

// Sum number of unique items returned
function totalItemCount(list) {
  return list.reduce(
    (sum, req) => sum + (req.returnDetails?.items || req.items || []).length,
    0
  );
}

function OrderCard({ order, type, index }) {
  const isReplacement = type === 'REPLACEMENT';
  const itemsList = order.replacementDetails?.items || order.returnDetails?.items || order.items || [];
  const reason = order.reason || order.replacementDetails?.reason || order.returnDetails?.reason || 'Customer Request';
  const isUserRequested = order.returnDetails?.isRequested || order.returnDetails?.returnedBy === 'user' || itemsList.some(it => it.return_status === 'requested' || it.returnStatus === 'requested');
  const photoUri = order.returnDetails?.photoUri;

  const totalItems = itemsList.reduce((s, item) => {
    const q = parseFloat(item.quantity || 1);
    return s + (q >= 50 ? 1 : q);
  }, 0);

  return (
    <AnimatedCard delay={index * 80}>
      <AnimatedPressable
        style={styles.card}
        onPress={() => router.push(`/order/${order.id}`)}
      >
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <View style={[
            styles.statusPill,
            isUserRequested
              ? { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1 }
              : { backgroundColor: isReplacement ? '#E0F2FE' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText,
              isUserRequested
                ? { color: '#B45309', fontWeight: 'bold' }
                : { color: isReplacement ? '#0284C7' : '#DC2626' }
            ]}>
              {isUserRequested
                ? '🙋‍♂️ Customer Requested'
                : isReplacement
                  ? '📦 Order Returned'
                  : '↩️ Item Returned'}
            </Text>
          </View>
        </View>

        <Text style={styles.address}>📍 {truncate(order.address, 45)}</Text>

        {/* Items list with count badge */}
        <View style={styles.itemsBox}>
          <View style={styles.itemsBoxHeader}>
            <Text style={styles.itemsBoxTitle}>
              Items {isReplacement ? 'to Replace' : 'Returned'}:
            </Text>
            <View style={[
              styles.itemCountBadge,
              isUserRequested
                ? { backgroundColor: '#FEF3C7' }
                : { backgroundColor: isReplacement ? '#E0F2FE' : '#FEE2E2' }
            ]}>
              <Text style={[
                styles.itemCountText,
                isUserRequested
                  ? { color: '#B45309' }
                  : { color: isReplacement ? '#0284C7' : '#DC2626' }
              ]}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          {itemsList.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
              <Text style={styles.itemText} numberOfLines={1}>
                • {item.productName || item.name}
              </Text>
              {(item.returnStatus === 'requested' || item.return_status === 'requested') && (
                <Text style={{ fontSize: 10, color: '#B45309', fontWeight: '600' }}>User Request</Text>
              )}
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={[styles.reasonText, { flex: 1, marginTop: 0 }]} numberOfLines={2}>
            💬 Reason: {reason}
          </Text>
          {photoUri && (
            <Image
              source={{ uri: photoUri }}
              style={{ width: s(36), height: vs(36), borderRadius: s(8), backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginLeft: 8 }}
              contentFit="cover"
            />
          )}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <Text style={styles.orderId}>Original Order #{order.orderId || order.id}</Text>
          <Text style={{ fontSize: ms(11), color: '#16A34A', fontWeight: 'bold' }}>View Details ›</Text>
        </View>
      </AnimatedPressable>
    </AnimatedCard>
  );
}

const MemoizedOrderCard = React.memo(OrderCard);

export default function ReturnsScreen() {
  const returnedOrders = useSelector(selectReturnedOrders);
  const replacementOrders = useSelector(selectReplacementOrders);
  const isLoading = useSelector(selectRouteLoading);
  const isOnline = useSelector(selectIsOnline);
  const { filter } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('RETURNS'); // 'RETURNS' | 'REPLACEMENTS'
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    if (filter) {
      const q = filter.toUpperCase();
      if (q === 'RETURNS' || q === 'RETURNED' || q === 'RETURN') {
        setActiveTab('RETURNS');
        setVisibleCount(6);
      } else if (q === 'REPLACEMENTS' || q === 'REPLACEMENT' || q === 'REPLACED') {
        setActiveTab('REPLACEMENTS');
        setVisibleCount(6);
      }
    }
  }, [filter]);

  const currentList = activeTab === 'RETURNS' ? returnedOrders : replacementOrders;

  const paginatedList = useMemo(() => {
    return currentList.slice(0, visibleCount);
  }, [currentList, visibleCount]);

  const loadMore = useCallback(() => {
    if (visibleCount < currentList.length) {
      setVisibleCount((prev) => prev + 6);
    }
  }, [visibleCount, currentList.length]);

  const renderFooter = () => {
    if (visibleCount >= currentList.length) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#2E9D6A" />
      </View>
    );
  };

  const onRefresh = useCallback(() => {
    setVisibleCount(6);
    if (isOnline) {
      RouteService.loadTodaysRoute(true);
      RouteService.fetchHistoryCount();
    }
  }, [isOnline]);

  // Summary item totals for the header pills
  const returnItemsTotal = totalItemCount(returnedOrders);
  const replacementItemsTotal = totalItemCount(replacementOrders);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reverse Logistics</Text>
        <Text style={styles.subtitle}>Track returns and scheduled replacements</Text>
      </View>

      {/* Summary cards — show per-category order + item counts */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
          <Text style={[styles.summaryPillEmoji]}>↩️</Text>
          <Text style={[styles.summaryPillCount, { color: '#DC2626' }]}>{returnItemsTotal}</Text>
          <Text style={[styles.summaryPillLabel, { color: '#DC2626' }]}>Return Items</Text>
          <Text style={[styles.summaryPillItems, { color: '#DC2626' }]}>{returnItemsTotal} items</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: '#E0F2FE', borderColor: '#93C5FD' }]}>
          <Text style={[styles.summaryPillEmoji]}>📦</Text>
          <Text style={[styles.summaryPillCount, { color: '#0284C7' }]}>{replacementOrders.length}</Text>
          <Text style={[styles.summaryPillLabel, { color: '#0284C7' }]}>Return Orders</Text>
          <Text style={[styles.summaryPillItems, { color: '#0284C7' }]}>{replacementOrders.length} orders</Text>
        </View>
      </View>

      {/* Sub-tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabBtn, activeTab === 'RETURNS' && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('RETURNS');
            setVisibleCount(6);
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.tabText, activeTab === 'RETURNS' && styles.tabTextActive]}
          >
            Return Items ({returnedOrders.length})
          </Text>
          <Text style={[styles.tabSubText, activeTab === 'RETURNS' && styles.tabSubTextActive]}>
            {returnItemsTotal} {returnItemsTotal === 1 ? 'item' : 'items'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabBtn, activeTab === 'REPLACEMENTS' && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('REPLACEMENTS');
            setVisibleCount(6);
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.tabText, activeTab === 'REPLACEMENTS' && styles.tabTextActive]}
          >
            Return Orders ({replacementOrders.length})
          </Text>
          <Text style={[styles.tabSubText, activeTab === 'REPLACEMENTS' && styles.tabSubTextActive]}>
            {replacementOrders.length} {replacementOrders.length === 1 ? 'order' : 'orders'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading skeleton shimmer while first loading */}
      {isLoading && currentList.length === 0 ? (
        <View style={[styles.list, { flex: 1 }]}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        /* Order list */
        <FlatList
          data={paginatedList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <MemoizedOrderCard
              order={item}
              index={index}
              type={activeTab === 'RETURNS' ? 'RETURN' : 'REPLACEMENT'}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <NoOrdersAnim style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No requests found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'RETURNS'
                  ? 'No items have been returned today.'
                  : 'No replacement deliveries scheduled.'
                }
              </Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF6F0' },
  header: { padding: s(20), paddingTop: vs(20), paddingBottom: vs(10) },
  title: { fontSize: ms(24), fontWeight: 'bold', fontFamily: 'System', color: '#2E9D6A' },
  subtitle: { fontSize: ms(13), color: '#7E7A74', fontFamily: 'System', marginTop: vs(2), fontWeight: '500' },

  // Summary row (two metric pills)
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: s(20), gap: s(10), marginBottom: vs(12),
  },
  summaryPill: {
    flex: 1, borderRadius: s(16), paddingVertical: vs(14), paddingHorizontal: s(12),
    borderWidth: 1, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: s(6), elevation: 2,
  },
  summaryPillEmoji: { fontSize: ms(20), marginBottom: vs(4) },
  summaryPillCount: { fontSize: ms(26), fontWeight: 'bold', fontFamily: 'System' },
  summaryPillLabel: { fontSize: ms(12), fontWeight: '700', fontFamily: 'System', marginTop: vs(2) },
  summaryPillItems: { fontSize: ms(11), fontWeight: '600', fontFamily: 'System', marginTop: vs(3), opacity: 0.8 },

  // Sub Tab Styles
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    marginHorizontal: s(16),
    marginBottom: vs(10),
    padding: s(4),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: s(6),
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: vs(10),
    paddingHorizontal: s(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: s(12),
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#166534', // Deep fresh green signature theme
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: s(4),
    elevation: 3,
  },
  tabText: {
    fontSize: ms(12.5),
    color: '#64748B',
    fontWeight: '700',
    fontFamily: 'System',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tabSubText: {
    fontSize: ms(10.5),
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: vs(2),
    textAlign: 'center',
  },
  tabSubTextActive: {
    color: '#DCFCE7',
    fontWeight: '700',
  },

  // List
  list: { padding: s(20), gap: vs(12), paddingBottom: vs(40) },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: s(20), padding: s(16),
    borderWidth: 1, borderColor: '#EFEBE4',
    shadowColor: '#FF7E36', shadowOpacity: 0.03, shadowRadius: s(8), elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', gap: s(10),
    justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(6),
  },
  customerName: { fontSize: ms(15), fontFamily: 'System', color: '#2C2B29', fontWeight: 'bold', flex: 1 },
  statusPill: { borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: vs(4) },
  statusText: { fontSize: ms(11), fontFamily: 'System', fontWeight: 'bold' },
  address: { fontSize: ms(12), color: '#7E7A74', fontFamily: 'System', marginBottom: vs(10) },

  // Items box
  itemsBox: {
    backgroundColor: '#FAF6F0', borderRadius: s(10), padding: s(10),
    marginBottom: vs(8), borderWidth: 1, borderColor: '#EFEBE4',
  },
  itemsBoxHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: vs(6),
  },
  itemsBoxTitle: {
    fontSize: ms(11), fontWeight: 'bold', color: '#2C2B29',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  itemCountBadge: { borderRadius: s(8), paddingHorizontal: s(8), paddingVertical: vs(3) },
  itemCountText: { fontSize: ms(10), fontWeight: 'bold' },
  itemText: { fontSize: ms(12), color: '#7E7A74', fontFamily: 'System', marginBottom: vs(2) },

  reasonText: { fontSize: ms(12), color: '#2E9D6A', fontWeight: '500', marginBottom: vs(4) },
  orderId: { fontSize: ms(10), color: '#94A3B8', fontFamily: 'System', fontWeight: 'bold' },

  // Empty state
  empty: { alignItems: 'center', paddingTop: vs(80) },
  emptyTitle: { fontSize: ms(18), fontFamily: 'System', color: '#2E9D6A', fontWeight: 'bold', marginBottom: vs(6) },
  emptySubtitle: {
    fontSize: ms(14), color: '#7E7A74', fontFamily: 'System',
    textAlign: 'center', paddingHorizontal: s(20),
  },
});
