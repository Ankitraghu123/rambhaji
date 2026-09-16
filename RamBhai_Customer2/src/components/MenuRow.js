import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function MenuRow({ label, icon, onPress, right }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.row,
      { borderBottomColor: colors.border, opacity: pressed ? 0.85 : 1 }
    ]}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      <View>{right}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700'
  }
});
