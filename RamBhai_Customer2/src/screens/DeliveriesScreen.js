import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import DeliveryCard from '../components/DeliveryCard';
import AppButton from '../components/AppButton';
import { deliveries } from '../data/mockData';

// ─── Filter config ─────────────────────────────────────────────────────────────
const FILTERS = [
  { label: 'All',       icon: 'view-grid-outline'      },
  { label: 'Arriving',  icon: 'truck-fast-outline'     },
  { label: 'Upcoming',  icon: 'calendar-clock-outline' },
  { label: 'Delivered', icon: 'check-circle-outline'   },
  { label: 'Failed',    icon: 'close-circle-outline'   },
];

// ─── Tone mapping for status badges ───────────────────────────────────────────
const STATUS_TONE = {
  Pending:             'primary',
  'Out For Delivery':  'info',
  Delivered:           'success',
  Failed:              'danger',
  Skipped:             'warning',
  'Partial Delivered': 'warning',
};

// ─── Animated entrance for each delivery card ─────────────────────────────────
function AnimatedRow({ children, index }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 340,
      delay: index * 70,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function matchesFilter(d, filter) {
  if (filter === 'All') return true;
  if (filter === 'Upcoming') return d.status === 'Arriving' || d.status === 'Upcoming';
  return d.status === filter;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DeliveriesScreen({ navigation }) {
  const [filter, setFilter] = useState('Upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [serverDeliveries, setServerDeliveries] = useState([]);

  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const success = colors.success ?? '#16A34A';

  async function fetchDeliveries() {
    try {
      let aggregatedDeliveries = [];

      // 1. Fetch upcoming schedules from active subscriptions
      const { subscriptionsApi } = require('../services/api/subscriptions');
      const subRes = await subscriptionsApi.getMySubscriptions();
      
      if (subRes.success && subRes.subscriptions) {
        const activeSubs = subRes.subscriptions.filter(s => s.status === 'active');
        for (const sub of activeSubs) {
           const schedRes = await subscriptionsApi.getUpcomingSelections(sub.id);
           if (schedRes.success && schedRes.schedules) {
              const mapped = schedRes.schedules.map(sch => {
                 const d = new Date(sch.scheduled_date);
                 const dateStr = isNaN(d) ? sch.scheduled_date : d.toDateString();
                 return {
                   id: `sub_${sub.id}_sch_${sch.id}`,
                   deliveryId: sch.id, // For navigation if needed
                   subscriptionId: sub.id,
                   title: dateStr,
                   area: sub.Package?.name || 'Subscription Delivery',
                   date: sub.type ? `${sub.type.toUpperCase()} PLAN` : 'Subscription',
                   status: 'Upcoming', 
                   time: `Delivery on ${dateStr}`,
                   note: sch.selections?.length > 0 ? `✅ ${sch.selections.length} custom picks` : '⏳ Auto-fill defaults'
                 };
              });
              aggregatedDeliveries = [...aggregatedDeliveries, ...mapped];
           }
        }
      }

      // 2. Fetch past delivery history
      const { deliveryApi } = require('../services/api/delivery');
      const histRes = await deliveryApi.getDeliveryHistory();
      if (histRes.success && (histRes.history || histRes.deliveries || histRes.data)) {
         const rawHistory = histRes.history || histRes.deliveries || histRes.data || [];
         const mappedHistory = rawHistory.map(d => {
            const dateStr = d.created_at ? new Date(d.created_at).toDateString() : (d.date || 'Recent');
            return {
              ...d,
              title: d.title || 'Order Delivery',
              area: d.area || 'Your Address',
              date: d.date || dateStr,
              time: d.time || (d.status === 'delivered' ? 'Completed' : 'Pending'),
              note: d.note || (d.DeliveryItems ? `${d.DeliveryItems.length} items included` : ''),
              status: d.status === 'pending' ? 'Upcoming' : d.status === 'paused' ? 'Skipped' : 'Delivered'
            };
         });
         aggregatedDeliveries = [...aggregatedDeliveries, ...mappedHistory];
      }

      setServerDeliveries(aggregatedDeliveries);
    } catch (e) {
      console.warn('Fetch deliveries failed', e);
      setServerDeliveries([]);
    }
  }

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Remove fallback to dummy data
  const dataToUse = serverDeliveries;

  const filtered = useMemo(
    () => dataToUse.filter((d) => matchesFilter(d, filter)),
    [filter, dataToUse]
  );
  const deliveryCount = filtered.length;

  const nextDelivery = useMemo(
    () =>
      dataToUse.find((d) => d.status === 'Out For Delivery') ||
      dataToUse.find((d) => d.status === 'Pending' || d.status === 'Arriving' || d.status === 'Upcoming'),
    [dataToUse]
  );

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
    setLastUpdated('Updated just now');
    setTimeout(() => setLastUpdated(null), 2500);
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Page header ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>My Deliveries</Text>
            <Text style={[s.subtitle, { color: colors.textSoft }]}>
              {deliveryCount} {filter === 'All' ? 'total' : filter.toLowerCase()}{' '}
              {deliveryCount === 1 ? 'delivery' : 'deliveries'}
            </Text>
            {!!lastUpdated && (
              <View style={s.updatedRow}>
                <MaterialCommunityIcons name="check-circle" size={12} color={success} />
                <Text style={[s.updatedText, { color: success }]}>{lastUpdated}</Text>
              </View>
            )}
          </View>

          {/* Renew alert pill — sits top-right, not inline with title */}
          {/* <Pressable
            onPress={() => navigation.navigate('Plans')}
            style={[s.renewPill, { backgroundColor: '#FFF3CD', borderColor: '#F5C518' }]}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#B8860B" />
            <Text style={s.renewText}>Renew</Text>
          </Pressable> */}
        </View>

        {/* ── Expiry warning banner (dismissible) ──────────────────────────── */}
        {/* {!bannerDismissed && (
          <Pressable
            onPress={() => navigation.navigate('Plans')}
            style={[s.warningBanner, { backgroundColor: '#FFFBEB', borderColor: '#F5C518' }]}
          >
            <View style={s.warningLeft}>
              <MaterialCommunityIcons name="clock-alert-outline" size={18} color="#B8860B" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[s.warningTitle, { color: '#92650A' }]}>
                  Subscription expiring soon
                </Text>
                <Text style={[s.warningBody, { color: '#B8860B' }]}>
                  Renew now to keep your weekly deliveries running without a break.
                </Text>
              </View>
            </View>
            <View style={s.warningRight}>
              <Pressable
                onPress={() => setBannerDismissed(true)}
                hitSlop={8}
                style={s.bannerCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={14} color="#B8860B" />
              </Pressable>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#B8860B" />
            </View>
          </Pressable>
        )} */}

        {/* ── Coming up next ────────────────────────────────────────────── */}
        {!!nextDelivery && (
          <AnimatedRow index={0}>
            <Card style={{ marginBottom: 16 }}>
              <SectionHeader title="Coming up next" subtitle={nextDelivery.area} />
              <DeliveryCard
                item={nextDelivery}
                onPress={() => {
                  if (nextDelivery.status === 'Upcoming' && nextDelivery.subscriptionId) {
                    navigation.navigate('ScheduleSelection', { subscription: { id: nextDelivery.subscriptionId, Package: { name: nextDelivery.title } } });
                  } else {
                    navigation.navigate('DeliveryDetail', { deliveryId: nextDelivery.id });
                  }
                }}
              />
            </Card>
          </AnimatedRow>
        )}

        {/* ── Filter chips ───────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTERS.map(({ label, icon }) => {
            const active = filter === label;
            const count = dataToUse.filter((d) => matchesFilter(d, label)).length;
            return (
              <Pressable
                key={label}
                onPress={() => setFilter(label)}
                style={({ pressed }) => [
                  s.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={14}
                  color={active ? '#fff' : colors.textSoft}
                />
                <Text style={[s.filterLabel, { color: active ? '#fff' : colors.text }]}>
                  {label}
                </Text>
                <View
                  style={[
                    s.countPill,
                    { backgroundColor: active ? 'rgba(255,255,255,0.25)' : (colors.surfaceSoft ?? 'rgba(0,0,0,0.06)') },
                  ]}
                >
                  <Text style={[s.countText, { color: active ? '#fff' : colors.textSoft }]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Delivery cards ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={[s.emptyState, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="truck-outline" size={38} color={colors.textSoft} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>
              No {filter.toLowerCase()} deliveries
            </Text>
            <Text style={[s.emptyBody, { color: colors.textSoft }]}>
              {filter === 'Upcoming'
                ? 'You have no upcoming deliveries scheduled.'
                : `Nothing here yet for the "${filter}" filter.`}
            </Text>
            <AppButton
              title="Browse Plans"
              variant="secondary"
              onPress={() => navigation.navigate('Plans')}
              style={{ marginTop: 14 }}
            />
          </View>
        ) : (
          <View style={s.cardList}>
            {filtered.map((item, idx) => (
              <AnimatedRow key={item.id} index={idx}>
                <DeliveryCard
                  item={item}
                  onPress={() => {
                    if (item.status === 'Upcoming' && item.subscriptionId) {
                      navigation.navigate('ScheduleSelection', { subscription: { id: item.subscriptionId, Package: { name: item.title } } });
                    } else {
                      navigation.navigate('DeliveryDetail', { deliveryId: item.id });
                    }
                  }}
                />
              </AnimatedRow>
            ))}
          </View>
        )}

        {/* ── Status legend card (tap a status to filter) ──────────────── */}
        <Card style={{ marginTop: 8 }}>
          <SectionHeader title="Delivery statuses" subtitle="Tap a status to filter instantly" />
          <View style={s.statusGrid}>
            {Object.entries(STATUS_TONE).map(([label, tone]) => (
              <Pressable
                key={label}
                onPress={() => setFilter(label)}
                style={({ pressed }) => [
                  s.legendBadge,
                  filter === label && { borderColor: colors.primary, borderWidth: 1.5 },
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Badge label={label} tone={tone} />
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  updatedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  renewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  renewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92650A',
  },

  // ── Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
  },
  warningLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  warningRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerCloseBtn: {
    padding: 2,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  warningBody: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },

  // ── Filter chips
  filterRow: {
    gap: 8,
    paddingBottom: 16,
    paddingRight: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 99,
  },
  filterLabel: {
    fontWeight: '800',
    fontSize: 12,
  },
  countPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── Delivery card list
  cardList: {
    gap: 12,
    marginBottom: 8,
  },

  // ── Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 20,
    borderStyle: 'dashed',
    marginBottom: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Status legend
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  legendBadge: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
});
