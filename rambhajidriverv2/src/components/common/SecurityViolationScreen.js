// src/components/common/SecurityViolationScreen.js
// Fullscreen security block shown when device integrity check fails

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BackHandler } from 'react-native';
import { useEffect } from 'react';

export default function SecurityViolationScreen() {
  // Prevent back navigation
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Security Violation</Text>
      <Text style={styles.message}>
        This device does not meet Ram Bhaji's security requirements.
        {'\n\n'}
        Rooted devices, emulators, and tampered environments are not permitted.
      </Text>
      <View style={styles.divider} />
      <Text style={styles.contact}>
        Contact your supervisor or HR department for assistance.
      </Text>
      <Text style={styles.code}>Error Code: DEVICE_INTEGRITY_VIOLATION</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'System', color: '#EF4444', marginBottom: 16 },
  message: {
    fontSize: 15, fontFamily: 'System', color: '#94A3B8',
    textAlign: 'center', lineHeight: 24,
  },
  divider: { width: 48, height: 2, backgroundColor: '#1E2940', marginVertical: 24 },
  contact: { fontSize: 14, color: '#64748B', fontFamily: 'System', textAlign: 'center' },
  code: {
    fontSize: 11, color: '#374151', fontFamily: 'System',
    marginTop: 16, letterSpacing: 0.5,
  },
});
