import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function Badge({ label, tone = 'primary' }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const bgMap = {
    primary: colors.primarySoft,
    success: '#E8F7EF',
    warning: '#FFF3D8',
    danger: '#FCE9E9',
    info: '#E8F1FF',
    muted: colors.surfaceAlt
  };
  const textMap = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    muted: colors.textSoft
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[tone] || bgMap.muted }]}>
      <Text style={[styles.text, { color: textMap[tone] || textMap.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.xl,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 11,
    fontWeight: '800'
  }
});
