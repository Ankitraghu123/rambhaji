// app/(tabs)/admin.js
// SCR-08: Admin Control & Live Monitoring Panel
// Designed with enterprise-level real-time tracking standards (Zepto, Blinkit, Amazon style)

import { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useSelector } from 'react-redux';
import { selectAdminLogs, selectReturnRequests, selectReplacementRequests, selectAllOrders } from '../../src/features/routes/state/routeSlice';
import { truncate } from '../../src/core/utils/formatUtils';
import { PulsingDot, AnimatedCard, AnimatedPressable, NoOrdersAnim } from '../../src/components/common/Motion';

export default function AdminPanelScreen() {
  const adminLogs = useSelector(selectAdminLogs);
  const returnRequests = useSelector(selectReturnRequests);
  const replacementRequests = useSelector(selectReplacementRequests);
  const orders = useSelector(selectAllOrders);

  const [activeTab, setActiveTab] = useState('LOGS'); // 'LOGS' | 'PHOTOS' | 'REVERSE'

  // Extract completed orders with photos
  const completedWithPhotos = orders.filter(o => o.status === 'COMPLETED' && o.photoUri);

  const renderLogItem = ({ item, index }) => {
    let emoji = '📝';
    let badgeColor = '#64748B';

    if (item.actionType === 'DELIVERED') {
      emoji = '✅';
      badgeColor = '#16A34A';
    } else if (item.actionType === 'RETURN_CREATED') {
      emoji = '↩️';
      badgeColor = '#DC2626';
    } else if (item.actionType === 'REPLACEMENT_CREATED') {
      emoji = '🔄';
      badgeColor = '#2563EB';
    } else if (item.actionType === 'ROUTE_STARTED' || item.actionType === 'VEHICLE_DISPATCHED') {
      emoji = '🚚';
      badgeColor = '#0E4A35';
    }

    return (
      <AnimatedCard delay={index * 60}>
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <View style={[styles.badge, { backgroundColor: badgeColor + '12' }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{emoji} {item.actionType}</Text>
            </View>
            <Text style={styles.logTime}>
              {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.logDetails}>{item.details}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>👤 Customer: {item.customerName}</Text>
            <Text style={styles.metaText}>🛵 Driver: {item.driverName}</Text>
          </View>
          {item.photoUri && (
            <View style={styles.logPhotoContainer}>
              <Text style={styles.photoLabel}>📸 Proof Photo Attached:</Text>
              <Image source={{ uri: item.photoUri }} style={styles.logPhoto} transition={200} cachePolicy="disk" />
            </View>
          )}
        </View>
      </AnimatedCard>
    );
  };

  const renderPhotoItem = ({ item, index }) => (
    <AnimatedCard delay={index * 60}>
      <View style={styles.photoCard}>
        <Image source={{ uri: item.photoUri }} style={styles.proofPhoto} transition={200} cachePolicy="disk" />
        <View style={styles.photoInfo}>
          <Text style={styles.photoTitle}>{item.customerName}</Text>
          <Text style={styles.photoAddress}>{truncate(item.address, 35)}</Text>
          <Text style={styles.photoMeta}>Order #{item.id} · Delivered successfully</Text>
        </View>
      </View>
    </AnimatedCard>
  );

  const renderReverseRequest = ({ item, index, type }) => {
    const isReplacement = type === 'REPLACEMENT';
    const itemsList = item.items || [];
    return (
      <AnimatedCard delay={index * 70}>
        <View style={styles.reverseCard}>
          <View style={styles.reverseHeader}>
            <Text style={styles.reverseCustomer}>{item.customerName}</Text>
            <View style={[styles.badge, { backgroundColor: isReplacement ? '#E0F2FE' : '#FEE2E2' }]}>
              <Text style={[styles.badgeText, { color: isReplacement ? '#0284C7' : '#DC2626' }]}>
                {isReplacement ? '🔄 Replacement' : '↩️ Return'}
              </Text>
            </View>
          </View>
          <Text style={styles.reverseAddress}>📍 {truncate(item.address, 45)}</Text>

          <View style={styles.reverseItems}>
            <Text style={styles.reverseItemsTitle}>Selected Items:</Text>
            {itemsList.map((it, idx) => (
              <Text key={idx} style={styles.reverseItem}>
                • {it.productName || it.name} (Qty: {it.quantity})
              </Text>
            ))}
          </View>

          <Text style={styles.reverseReason}>💬 Reason: {item.reason}</Text>

          {item.photoUri && (
            <View style={styles.logPhotoContainer}>
              <Text style={styles.photoLabel}>📸 Proof Photo:</Text>
              <Image source={{ uri: item.photoUri }} style={styles.logPhoto} transition={200} cachePolicy="disk" />
            </View>
          )}
          <Text style={styles.reverseTime}>Logged at: {new Date(item.timestamp).toLocaleString('en-IN')}</Text>
        </View>
      </AnimatedCard>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Admin Control Center</Text>
          <View style={styles.liveIndicator}>
            <PulsingDot size={6} style={{ marginRight: 6 }} color="#22C55E" />
            <Text style={styles.liveText}>LIVE MONITOR</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Blinkit & Amazon standard real-time delivery logs</Text>
      </View>

      {/* Sub tabs */}
      <View style={styles.tabRow}>
        <AnimatedPressable
          style={[styles.tabBtn, activeTab === 'LOGS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('LOGS')}
        >
          <Text style={[styles.tabText, activeTab === 'LOGS' && styles.tabTextActive]}>
            Activity Logs ({adminLogs.length})
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.tabBtn, activeTab === 'PHOTOS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PHOTOS')}
        >
          <Text style={[styles.tabText, activeTab === 'PHOTOS' && styles.tabTextActive]}>
            Proofs ({completedWithPhotos.length})
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.tabBtn, activeTab === 'REVERSE' && styles.tabBtnActive]}
          onPress={() => setActiveTab('REVERSE')}
        >
          <Text style={[styles.tabText, activeTab === 'REVERSE' && styles.tabTextActive]}>
            Reverse ({returnRequests.length + replacementRequests.length})
          </Text>
        </AnimatedPressable>
      </View>

      {/* Content views */}
      {activeTab === 'LOGS' && (
        <FlatList
          data={adminLogs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => renderLogItem({ item, index })}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <NoOrdersAnim style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No live logs available</Text>
              <Text style={styles.emptySubtitle}>Logs will appear as delivery activities happen.</Text>
            </View>
          }
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'PHOTOS' && (
        <FlatList
          data={completedWithPhotos}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => renderPhotoItem({ item, index })}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <NoOrdersAnim style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No delivery proof photos</Text>
              <Text style={styles.emptySubtitle}>Photos captured during door-step delivery show up here.</Text>
            </View>
          }
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'REVERSE' && (
        <FlatList
          data={[
            ...returnRequests.map(r => ({ ...r, type: 'RETURN' })),
            ...replacementRequests.map(r => ({ ...r, type: 'REPLACEMENT' }))
          ].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => renderReverseRequest({ item, index, type: item.type })}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <NoOrdersAnim style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>No reverse requests</Text>
              <Text style={styles.emptySubtitle}>Return and replacement orders requested by drivers list here.</Text>
            </View>
          }
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F8F6' },
  header: { padding: 20, paddingTop: 20, paddingBottom: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  title: { fontSize: 20, fontWeight: 'bold', fontFamily: 'System', color: '#0E4A35' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#86EFAC' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  liveText: { fontSize: 9, fontWeight: 'bold', color: '#15803D', letterSpacing: 0.5 },
  subtitle: { fontSize: 12, color: '#5C6F66', fontFamily: 'System', marginTop: 4, fontWeight: '500' },

  // Sub Tab Styles
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, marginHorizontal: 20, marginVertical: 10, padding: 4, borderWidth: 1, borderColor: '#E0E6E2' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#0E4A35' },
  tabText: { fontSize: 12, color: '#5C6F66', fontWeight: 'bold', fontFamily: 'System' },
  tabTextActive: { color: '#FFFFFF' },

  list: { padding: 20, gap: 12, paddingBottom: 40 },

  // Log card
  logCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E0E6E2',
    shadowColor: '#0E4A35', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', fontFamily: 'System', textTransform: 'uppercase', letterSpacing: 0.5 },
  logTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  logDetails: { fontSize: 14, color: '#1A2F25', fontWeight: '600', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F8F6', paddingTop: 8 },
  metaText: { fontSize: 11, color: '#5C6F66', fontWeight: '500' },

  logPhotoContainer: { marginTop: 10, backgroundColor: '#F5F8F6', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E0E6E2' },
  photoLabel: { fontSize: 10, fontWeight: 'bold', color: '#1A2F25', marginBottom: 4 },
  logPhoto: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#CBD5E1' },

  // Photo list
  photoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E0E6E2',
    shadowColor: '#0E4A35', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  proofPhoto: { width: '100%', height: 180, backgroundColor: '#CBD5E1' },
  photoInfo: { padding: 14 },
  photoTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A2F25' },
  photoAddress: { fontSize: 12, color: '#5C6F66', marginVertical: 2 },
  photoMeta: { fontSize: 10, color: '#16A34A', fontWeight: 'bold' },

  // Reverse card
  reverseCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E0E6E2',
    shadowColor: '#0E4A35', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  reverseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reverseCustomer: { fontSize: 15, fontWeight: 'bold', color: '#1A2F25' },
  reverseAddress: { fontSize: 12, color: '#5C6F66', marginBottom: 8 },
  reverseItems: { backgroundColor: '#F5F8F6', padding: 8, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E0E6E2' },
  reverseItemsTitle: { fontSize: 10, fontWeight: 'bold', color: '#1A2F25', marginBottom: 2 },
  reverseItem: { fontSize: 12, color: '#5C6F66' },
  reverseReason: { fontSize: 12, color: '#DC2626', fontWeight: 'bold', marginBottom: 6 },
  reverseTime: { fontSize: 9, color: '#94A3B8', marginTop: 8 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'System', color: '#0E4A35', fontWeight: 'bold', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#5C6F66', fontFamily: 'System', textAlign: 'center', paddingHorizontal: 20 },
});
