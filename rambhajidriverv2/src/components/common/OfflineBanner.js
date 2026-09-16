// src/components/common/OfflineBanner.js
// Persistent offline/syncing banner shown at the top of every screen

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

import { PulsingDot } from './Motion';

export default function OfflineBanner({ isOnline, pendingCount }) {
  const slideAnim = useRef(new Animated.Value(-48)).current;
  const isVisible = !isOnline || pendingCount > 0;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : -48,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [isVisible]);

  const isOffline = !isOnline;
  const isSyncing = isOnline && pendingCount > 0;

  return (
    <Animated.View
      style={[styles.banner, isOffline ? styles.offline : styles.syncing, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={{ width: 14, height: 14, justifyContent: 'center', alignItems: 'center' }}>
        {isOffline ? (
          <PulsingDot color="#E024E3" size={8} />
        ) : (
          <Text style={styles.icon}>🔄</Text>
        )}
      </View>
      <Text style={[styles.text, isOffline && styles.offlineText]}>
        {isOffline
          ? `⛔ Network offline. — ${pendingCount > 0 ? `${pendingCount} pending` : 'Check connection'}`
          : `Syncing ${pendingCount} item${pendingCount !== 1 ? 's' : ''}...`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    zIndex: 1000,
  },
  offline: { backgroundColor: '#FFE4E6' },
  syncing: { backgroundColor: '#00B4D8' },
  icon: { fontSize: 12 },
  text: { color: '#fff', fontSize: 12, fontFamily: 'System', flex: 1, fontWeight: 'bold' },
  offlineText: { color: '#9F1239' },
});
