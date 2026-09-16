// app/(tabs)/_layout.js
// Main authenticated tab navigator layout

import { useEffect, useRef } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { s, vs, ms } from '../../src/core/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectIsAuthenticated } from '../../src/features/auth/state/authSlice';
import { selectUnreadCount } from '../../src/features/notifications/state/notificationSlice';
import { selectIsOnline, selectPendingCount } from '../../src/features/sync/state/syncSlice';
import { selectAvailableOrders } from '../../src/features/routes/state/availableOrdersSlice';
import OfflineBanner from '../../src/components/common/OfflineBanner';

const selectMyOrders = (state) => state.route?.orders || [];

// 🎨 ANIMATED TAB ICON WITH TOUCH SCALING, FOCUS LIFT, AND SPRING BADGE BOUNCE
const AnimatedTabIcon = ({ emoji, focused, showBadge, badgeCount }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1.0,
        tension: 180,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(lift, {
        toValue: focused ? -4 : 0,
        tension: 180,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  useEffect(() => {
    if (showBadge && badgeCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1.0, tension: 160, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [badgeCount, showBadge]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 45, height: 40, position: 'relative' }}>
      <Animated.View style={{ transform: [{ scale }, { translateY: lift }] }}>
        <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
      </Animated.View>
      {focused && (
        <View style={{
          position: 'absolute',
          bottom: -4,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: '#00B4D8',
          shadowColor: '#00B4D8',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 3,
          elevation: 2,
        }} />
      )}
      {showBadge && badgeCount > 0 && (
        <Animated.View
          style={[
            tabStyles.nativeBadge,
            {
              transform: [{ scale: badgeScale }],
              position: 'absolute',
              top: -3,
              right: -3,
              zIndex: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', lineHeight: 12 }}>{badgeCount}</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default function TabsLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const unreadCount = useSelector(selectUnreadCount);
  const isOnline = useSelector(selectIsOnline);
  const pendingCount = useSelector(selectPendingCount);
  const availableOrders = useSelector(selectAvailableOrders) || [];
  const availableCount = availableOrders.length;
  const myOrders = useSelector(selectMyOrders) || [];
  const myPendingCount = myOrders.filter((o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT').length;
  const insets = useSafeAreaInsets();

  const tabBarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tabBarOpacity, {
      toValue: 1,
      duration: 500,
      delay: 500, // Appears last in the entrance flow!
      useNativeDriver: true,
    }).start();
  }, []);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            ...tabStyles.tabBar,
            height: vs(60) + insets.bottom,
            paddingBottom: insets.bottom || vs(8),
            opacity: tabBarOpacity,
          },
          tabBarActiveTintColor: '#00B4D8',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: tabStyles.label,
          tabBarIconStyle: tabStyles.iconStyle,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon emoji="🏠" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="deliveries"
          options={{
            title: 'Deliveries',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon emoji="📦" focused={focused} showBadge badgeCount={myPendingCount} />
            ),
          }}
        />
        <Tabs.Screen
          name="available-orders"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon emoji="🗺️" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="returns"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon emoji="👤" focused={focused} showBadge badgeCount={unreadCount} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F0F7FF',
    borderTopColor: '#00B4D8',
    borderTopWidth: 1.5,
    paddingTop: vs(8),
    elevation: 10,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.12,
    shadowRadius: s(10),
  },
  label: { 
    fontSize: ms(10), 
    fontFamily: 'System', 
    fontWeight: '600',
    marginTop: vs(4),
    marginBottom: vs(4),
  },
  iconStyle: {
    marginBottom: vs(2),
  },
  nativeBadge: {
    backgroundColor: '#E024E3',
    color: '#FFFFFF',
    fontSize: ms(9),
    fontWeight: 'bold',
    lineHeight: vs(12),
    height: vs(16),
    minWidth: s(16),
    borderRadius: s(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
