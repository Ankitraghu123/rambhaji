import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { themeTokens } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function SectionHeader({ title, actionLabel, onAction, subtitle }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSoft }]}>{subtitle}</Text>}
      </View>
      {!!actionLabel && (
        <Pressable onPress={onAction}>
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { marginTop: 3, fontSize: 12 },
  action: { fontSize: 13, fontWeight: '700' }
});
