// app/notifications.js
// SCR-08: Notification Center
// Redesigned with premium Saffron & Cream theme

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Animated } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { 
  selectAllNotifications, 
  markAllRead, 
  markRead, 
  clearNotifications,
  addNotification 
} from '../src/features/notifications/state/notificationSlice';
import { AnimatedCard, AnimatedPressable } from '../src/components/common/Motion';
import PageLoader from '../src/components/common/PageLoader';
import NotificationRepository from '../src/features/notifications/repositories/NotificationRepository';

// Sample mock data helper to fill notification center if empty (fallback only)
const MOCK_NOTIFS = [
  {
    id: 'm1',
    type: 'route',
    title: 'New Route Assigned 🚚',
    body: 'You have been assigned 47 orders for today\'s fresh delivery shift.',
    receivedAt: Date.now() - 10 * 60000, // 10m ago
  },
  {
    id: 'm2',
    type: 'alert',
    title: 'Urgent Weather Warning ⛈️',
    body: 'Heavy rainfall expected on your route. Drive safely and keep vegetable boxes covered.',
    receivedAt: Date.now() - 60 * 60000, // 1h ago
  },
  {
    id: 'm3',
    type: 'success',
    title: 'Bonus Incentive Unlocked 💰',
    body: 'Great job! Completed 10 consecutive deliveries on-time today.',
    receivedAt: Date.now() - 120 * 60000, // 2h ago
  },
  {
    id: 'm4',
    type: 'info',
    title: 'Alkaline Water Safety Notice 💧',
    body: 'Ensure alkaline water bottles are kept upright in the cargo carrier.',
    receivedAt: Date.now() - 1440 * 60000, // 24h ago
  }
];

export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const dbNotifications = useSelector(selectAllNotifications);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Load real notifications from backend on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await NotificationRepository.getNotifications();
        // Clear old items and load fresh list from API
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
        } else {
          // If server is empty and no custom notifications, populate mock for demo
          MOCK_NOTIFS.forEach(n => {
            dispatch(addNotification(n));
          });
        }
      } catch (err) {
        console.warn('[NotificationsScreen] API load failed, using mock data fallback:', err.message);
        // Fallback to mocks if server cannot be reached
        if (dbNotifications.length === 0) {
          MOCK_NOTIFS.forEach(n => {
            dispatch(addNotification(n));
          });
        }
      } finally {
        setIsTransitioning(false);
      }
    };

    fetchNotifications();
  }, [dispatch]);

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
    // Opt: call mark-all-read API if backend supports it
  };

  const handleClear = () => {
    dispatch(clearNotifications());
  };

  const handleNotificationPress = async (id) => {
    dispatch(markRead(id));
    try {
      await NotificationRepository.markAsRead(id);
    } catch (err) {
      console.warn('[NotificationsScreen] Failed to mark as read on API:', err.message);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getNotifStyles = (type) => {
    switch (type) {
      case 'route':
        return { emoji: '🚚', bg: '#FFF8F0', border: '#FFE6D5', color: '#FF7E36' };
      case 'alert':
        return { emoji: '⛈️', bg: '#FFF3E0', border: '#FBBF24', color: '#E8750A' };
      case 'success':
        return { emoji: '💰', bg: '#FFF3E6', border: '#FFE6D5', color: '#FF7E36' };
      case 'info':
      default:
        return { emoji: '💧', bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
    }
  };

  if (isTransitioning) {
    return <PageLoader message="Connecting securely..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF6F0" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>◀</Text>
        </AnimatedPressable>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>Inbox Alerts 🔔</Text>
          <Text style={styles.subtitle}>Ram Bhaji Driver Notifications</Text>
        </View>
        {dbNotifications.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Action Bar */}
      {dbNotifications.some(n => !n.readAt) && (
        <View style={styles.actionBar}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadBtn}>
            <Text style={styles.markReadText}>✓ Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scrollable list */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {dbNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>📭</Text>
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No new alerts or delivery updates right now.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.goHomeBtn}>
              <Text style={styles.goHomeText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          dbNotifications.map((notif, index) => {
            const config = getNotifStyles(notif.type);
            const isRead = !!notif.readAt;

            return (
              <AnimatedCard key={notif.id || index} delay={index * 60}>
                <TouchableOpacity 
                  onPress={() => handleNotificationPress(notif.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.card, 
                    !isRead && styles.unreadCard,
                    { borderLeftColor: config.color }
                  ]}
                >
                  {/* Left Icon */}
                  <View style={[styles.iconCircle, { backgroundColor: config.bg, borderColor: config.border }]}>
                    <Text style={styles.iconEmoji}>{config.emoji}</Text>
                  </View>

                  {/* Body Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardTitle, !isRead && styles.unreadText]}>{notif.title}</Text>
                      {!isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardBody}>{notif.body}</Text>
                    <Text style={styles.cardTime}>{formatTime(notif.receivedAt)}</Text>
                  </View>
                </TouchableOpacity>
              </AnimatedCard>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EFEBE4',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEBE4',
  },
  backText: {
    fontSize: 14,
    color: '#FF7E36',
    fontWeight: 'bold',
  },
  titleColumn: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7E36',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 11,
    color: '#FF7E36',
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 1,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  actionBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#EFEBE4',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  markReadText: {
    fontSize: 12,
    color: '#FF7E36',
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EFEBE4',
    borderLeftWidth: 5,
    shadowColor: '#FF7E36',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#FFF8F0',
    borderColor: '#FFE6D5',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconEmoji: {
    fontSize: 18,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'System',
    fontWeight: '600',
    flex: 1,
  },
  unreadText: {
    color: '#FF7E36',
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8C42',
    marginLeft: 6,
  },
  cardBody: {
    fontSize: 12,
    color: '#7E7A74',
    fontFamily: 'System',
    marginTop: 4,
    lineHeight: 16,
  },
  cardTime: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'System',
    marginTop: 6,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE6D5',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7E36',
    fontFamily: 'System',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#7E7A74',
    textAlign: 'center',
    fontFamily: 'System',
    paddingHorizontal: 40,
    marginBottom: 24,
    lineHeight: 18,
  },
  goHomeBtn: {
    backgroundColor: '#FF7E36',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#FF7E36',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  goHomeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});
