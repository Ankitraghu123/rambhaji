import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function QuantityStepper({ value = 1, onChange }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} style={styles.btn}>
        <MaterialCommunityIcons name="minus" size={18} color={colors.text} />
      </Pressable>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} style={styles.btn}>
        <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden'
  },
  btn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center'
  },
  value: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800'
  }
});
