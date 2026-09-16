import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';
import { formatINR } from '../utils/format';
import Badge from './Badge';
import AppButton from './AppButton';
import Card from './Card';

export default function PlanCard({ item, onPress, onBuy }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
        <View style={[styles.top, { backgroundColor: item.recommended ? colors.primarySoft : colors.surfaceAlt }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
            <Text style={styles.emoji}>{item.imageLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
              <Badge label={item.badge} tone={item.recommended ? 'success' : 'primary'} />
            </View>
            <Text style={[styles.frequency, { color: colors.textSoft }]}>{item.frequency}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.text }]}>{formatINR(item.price)}</Text>
              <Text style={[styles.oldPrice, { color: colors.textMuted }]}>{formatINR(item.oldPrice)}</Text>
              <Badge label={item.discount} tone="warning" />
            </View>
          </View>
        </View>
        <View style={styles.bottom}>
          <View style={styles.pills}>
            <Badge label={`${item.deliveries} deliveries`} tone="info" />
            <Badge label={item.frequencyText} tone="muted" />
          </View>
          <AppButton title="See Plan" onPress={onPress} variant="secondary" style={{ alignSelf: 'flex-end', minWidth: 130 }} />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    alignItems: 'center'
  },
  bottom: {
    paddingHorizontal: 14,
    paddingBottom: 14
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emoji: { fontSize: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between'
  },
  name: { fontSize: 18, fontWeight: '800', flex: 1, paddingRight: 10 },
  frequency: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  price: { fontSize: 18, fontWeight: '900' },
  oldPrice: { fontSize: 13, textDecorationLine: 'line-through' },
  pills: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }
});
