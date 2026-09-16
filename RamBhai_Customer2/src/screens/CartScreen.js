import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { formatINR } from '../utils/format';

function SkeletonLine({ width, shimmer }) {
  const shimmerLeft = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['-40%', '120%'],
  });

  return (
    <View style={[{ width, height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 8 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { left: shimmerLeft, width: '60%', backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ skewX: '-20deg' }] }]} />
    </View>
  );
}

const formatQty = (grams) => {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return Number.isInteger(kg) ? `${kg} kg` : `${kg.toFixed(1)} kg`;
  }
  return `${grams} g`;
};

const getBaseQty = (item) => {
  const unitStr = (item.unit || '').trim().toLowerCase();
  if (unitStr.includes('kg') || unitStr === 'g' || unitStr === 'gm' || unitStr === 'gram' || unitStr === 'grams') {
    if (item.min_retail_qty && parseFloat(item.min_retail_qty) > 0) {
      let raw = parseFloat(item.min_retail_qty);
      if (raw < 10) return raw * 1000;
      return raw;
    }
    return 250;
  }
  return 1;
};

const getItemPrice = (item) => {
  if (item.selling_price_per_gm) {
    return parseFloat(item.selling_price_per_gm) * item.qty;
  }
  const unitStr = (item.unit || '').trim().toLowerCase();
  if (unitStr.includes('kg')) {
    return ((item.price || 0) / 1000) * item.qty;
  }
  return (item.price || 0) * item.qty;
};

const getItemMeta = (item) => {
  const unitStr = (item.unit || '').trim().toLowerCase();
  if (unitStr.includes('kg') || unitStr === 'g' || unitStr === 'gm' || unitStr === 'gram' || unitStr === 'grams') {
    return formatQty(item.qty);
  }
  return `${item.qty} x ${item.unit}`;
};

function CartSkeleton({ colors }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: false,
      })
    ).start();
  }, [shimmer]);

  return (
    <Card style={s.cartCard}>
      {[1, 2].map((i) => (
        <View key={i} style={[s.itemRow, i === 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <View style={[s.itemIcon, { backgroundColor: colors.primarySoft }]} />
          <View style={s.fill}>
            <SkeletonLine width="50%" shimmer={shimmer} />
            <SkeletonLine width="30%" shimmer={shimmer} />
          </View>
          <SkeletonLine width="20%" shimmer={shimmer} />
        </View>
      ))}
    </Card>
  );
}

export default function CartScreen({ navigation }) {
  const mode = useAppStore((state) => state.themeMode);
  const colors = themeTokens[mode];
  const cartItems = useAppStore((state) => state.cartItems);
  const updateCartQty = useAppStore((state) => state.updateCartQty);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const deliveryFee = 0;
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + getItemPrice(item), 0),
    [cartItems]
  );
  const total = subtotal + deliveryFee;

  const float = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    Animated.spring(enter, {
      toValue: 1,
      speed: 12,
      bounciness: 8,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setLoading(false), 620);
    return () => {
      clearTimeout(timer);
      floatLoop.stop();
    };
  }, [enter, float]);

  function handleCheckout() {
    if (checkingOut) return;
    setCheckingOut(true);
    setTimeout(() => {
      setCheckingOut(false);
      navigation.navigate('Checkout', { fromCart: true, items: cartItems, displayPrice: total });
    }, 520);
  }

  return (
    <Screen>
      <Animated.View
        style={{
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        }}
      >
        <View style={s.hero}>
          <View style={s.copy}>
            <Text style={[s.title, { color: colors.text }]}>Cart</Text>
            <Text style={[s.sub, { color: colors.textSoft }]}>
              Fresh items are ready for checkout.
            </Text>
          </View>
          <Animated.View
            style={[
              s.cartOrb,
              {
                backgroundColor: colors.primarySoft,
                transform: [
                  {
                    translateY: float.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                  {
                    rotate: float.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-3deg', '4deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient colors={['#FFFFFF', '#E9F1DD']} style={s.cartIconBg}>
              <MaterialCommunityIcons name="basket-outline" size={33} color={colors.primary} />
            </LinearGradient>
            <View style={[s.cartCount, { backgroundColor: colors.warning }]}>
              <Text style={s.cartCountText}>{cartItems.length}</Text>
            </View>
          </Animated.View>
        </View>

        {loading ? (
          <CartSkeleton colors={colors} />
        ) : cartItems.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <MaterialCommunityIcons name="cart-off" size={48} color={colors.textMuted} />
            <Text style={{ marginTop: 12, color: colors.textSoft, fontSize: 16 }}>Your cart is empty.</Text>
          </View>
        ) : (
          <Card style={s.cartCard}>
            {cartItems.map((item, index) => {
              const baseQty = getBaseQty(item);
              return (
                <View
                  key={item.id}
                  style={[
                    s.itemRow,
                    index < cartItems.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={[s.itemIcon, { backgroundColor: colors.primarySoft }]}>
                    {item.image || item.image_url ? (
                      <Image source={{ uri: item.image || item.image_url }} style={{ width: '100%', height: '100%', borderRadius: 15 }} />
                    ) : (
                      <MaterialCommunityIcons name="basket" size={22} color={colors.primary} />
                    )}
                  </View>
                  <View style={s.fill}>
                    <Text style={[s.itemName, { color: colors.text }]}>
                      {item.name}
                      {item.hindi_name ? ` (${item.hindi_name})` : ''}
                    </Text>
                    <Text style={[s.itemMeta, { color: colors.textSoft }]}>
                      {getItemMeta(item)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Text style={[s.itemPrice, { color: colors.text }]}>
                      {formatINR(getItemPrice(item))}
                    </Text>
                    <View style={[s.stepper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <Text
                        style={[s.stepperBtn, { color: colors.error || '#ef4444' }]}
                        onPress={() => updateCartQty(item.id, item.qty - baseQty)}
                      >
                        -
                      </Text>
                      <Text
                        style={[s.stepperBtn, { color: colors.text }]}
                        onPress={() => updateCartQty(item.id, item.qty + baseQty)}
                      >
                        +
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <Card style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: colors.textSoft }]}>Subtotal</Text>
            <Text style={[s.summaryValue, { color: colors.text }]}>{formatINR(subtotal)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: colors.textSoft }]}>Delivery</Text>
            <Text style={[s.summaryValue, { color: colors.success }]}>Free</Text>
          </View>
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.summaryRow}>
            <Text style={[s.totalLabel, { color: colors.text }]}>Estimated total</Text>
            <Text style={[s.total, { color: colors.text }]}>{formatINR(total)}</Text>
          </View>
        </Card>

        <AppButton
          title={checkingOut ? 'Preparing checkout' : 'Proceed to Checkout'}
          loading={checkingOut}
          onPress={handleCheckout}
          iconRight={<MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />}
        />
      </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  copy: {
    flex: 1,
  },
  title: { fontSize: 28, fontWeight: '900' },
  sub: { marginTop: 6, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  cartOrb: {
    width: 82,
    height: 82,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B2112',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 6,
  },
  cartIconBg: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  cartCountText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  cartCard: { borderRadius: 22, marginBottom: 14 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '900' },
  itemMeta: { marginTop: 3, fontSize: 12, fontWeight: '700' },
  itemPrice: { fontSize: 14, fontWeight: '900' },
  summaryCard: { borderRadius: 22, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 13, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '900' },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '900' },
  total: { fontSize: 20, fontWeight: '900' },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
  },
  skeleton: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#EFE4CF',
    overflow: 'hidden',
    marginVertical: 4,
  },
  skeletonShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '38%',
    backgroundColor: 'rgba(255,255,255,0.48)',
    transform: [{ skewX: '-18deg' }],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 32,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    fontSize: 18,
    paddingHorizontal: 8,
    fontWeight: '600',
  },
});
