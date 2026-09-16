import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from './Card';
import Badge from './Badge';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';

export default function DeliveryCard({ item, onPress }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const tone =
    item.status === 'Delivered' ? 'success' :
    item.status === 'Failed' ? 'danger' :
    item.status === 'Upcoming' ? 'warning' :
    'primary';

  return (
    <Card>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.topRow}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="truck-delivery" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.meta, { color: colors.textSoft }]}>{item.area} • {item.date}</Text>
          </View>
          <Badge label={item.status} tone={tone} />
        </View>
        <Text style={[styles.time, { color: colors.textSoft }]}>{item.time}</Text>
        <Text style={[styles.note, { color: colors.text }]}>{item.note}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  time: { marginTop: 12, fontSize: 12, fontWeight: '700' },
  note: { marginTop: 4, fontSize: 13 }
});
