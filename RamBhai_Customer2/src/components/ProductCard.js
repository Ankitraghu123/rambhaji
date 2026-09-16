import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeTokens, radius } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';
import { formatINR } from '../utils/format';
import Card from './Card';
import AppButton from './AppButton';

const produceMeta = {
  potato: { icon: 'potato', color: '#9C7134', bg: ['#FFF6D8', '#EFD08A'] },
  onion: { icon: 'circle-slice-8', color: '#9E4C61', bg: ['#FFE8EF', '#E4B0BF'] },
  tomato: { icon: 'food-apple', color: '#C83B31', bg: ['#FFE7DF', '#F3A28E'] },
  garlic: { icon: 'sprout', color: '#776B55', bg: ['#FFF9EA', '#E9DDC8'] },
  ginger: { icon: 'leaf', color: '#8A672C', bg: ['#FFF1C8', '#E5C475'] },
  coriander: { icon: 'leaf', color: '#287A49', bg: ['#E9F7D8', '#B8DFAC'] },
};

function metaFor(item) {
  const key = `${item.name || ''}`.toLowerCase();
  return produceMeta[key] || { icon: 'basket-outline', color: '#267447', bg: ['#F2F7E8', '#D9E8C8'] };
}

export default function ProductCard({ item, onPress, compact = false, onAdd }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const float = useRef(new Animated.Value(0)).current;
  const meta = useMemo(() => metaFor(item), [item]);

  let displayPrice = parseFloat(item.price) || 0;
  let displayUnit = (item.unit || item.badge || '').trim().toLowerCase();
  
  if (item.selling_price_per_gm) {
    const perGm = parseFloat(item.selling_price_per_gm);
    if (!isNaN(perGm)) {
      if (displayUnit === 'gm' || displayUnit === 'g' || displayUnit === 'gram' || displayUnit === 'grams' || displayUnit.includes('kg')) {
        displayPrice = perGm * 1000;
        displayUnit = '1 kg';
      } else {
        displayPrice = perGm;
      }
    }
  }

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [float]);

  return (
    <Card style={[styles.card, compact && styles.compact]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.press,
          {
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
      >
        <View style={styles.topRow}>
          <LinearGradient colors={meta.bg} style={styles.iconBox}>
            {item.image || item.image_url ? (
              <Animated.View
                style={[
                  styles.imageMotion,
                  {
                    transform: [
                      {
                        translateY: float.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -4],
                        }),
                      },
                      {
                        scale: float.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.04],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image source={{ uri: item.image || item.image_url }} style={styles.productImage} contentFit="cover" transition={250} />
              </Animated.View>
            ) : (
              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: float.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                    {
                      rotateZ: float.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-4deg', '5deg'],
                      }),
                    },
                  ],
                }}
              >
                <MaterialCommunityIcons name={meta.icon} size={31} color={meta.color} />
              </Animated.View>
            )}
          </LinearGradient>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>
              {item.name}
              {item.hindi_name ? ` (${item.hindi_name})` : ''}
            </Text>
            <Text style={[styles.unit, { color: colors.textSoft }]}>{displayUnit}</Text>
          </View>
          <View style={[styles.freshBadge, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="sprout-outline" size={14} color={colors.primary} />
          </View>
        </View>
        <View style={styles.footer}>
          <View>
            <Text style={[styles.price, { color: colors.text }]}>{formatINR(displayPrice)}</Text>
            <Text style={[styles.priceHint, { color: colors.textSoft }]}>Fresh stock</Text>
          </View>
          {!compact && <AppButton title="Add" onPress={onAdd} variant="secondary" style={{ minWidth: 82, minHeight: 40 }} />}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
    padding: 12,
    borderRadius: 20,
  },
  compact: {
    padding: 12
  },
  press: {
    minHeight: 112,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2B2112',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },
  imageMotion: {
    width: '100%',
    height: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  freshBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 16, fontWeight: '900' },
  unit: { marginTop: 4, fontSize: 12, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  price: { fontSize: 17, fontWeight: '900' },
  priceHint: { marginTop: 2, fontSize: 11, fontWeight: '700' }
});
