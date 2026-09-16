// // import Card from '../components/Card';
// // import AppButton from '../components/AppButton';
// // import SectionHeader from '../components/SectionHeader';
// // import Badge from '../components/Badge';
// // import Input from '../components/Input';
// // import QuantityStepper from '../components/QuantityStepper';
// // import PlanCard from '../components/PlanCard';
// // import ProductCard from '../components/ProductCard';
// // import DeliveryCard from '../components/DeliveryCard';
// // import TransactionRow from '../components/TransactionRow';
// // import MenuRow from '../components/MenuRow';
// // import {
// //   subscriptionPlans, basketPlans, freshVeggies, waterProducts, retailProducts,
// //   deliveries, walletTransactions, notifications, supportTickets, userProfile, menuItems,
// //   addressBook, fixedVeggies, pickupRules
// // } from '../data/mockData';
// // import { formatINR } from '../utils/format';

// // export default function WaterScreen({ navigation }) {
// //   const mode = useAppStore((s) => s.themeMode);
// //   const colors = themeTokens[mode];

// //   return (
// //     <Screen>
// //       <Text style={[s.title, { color: colors.text }]}>Alkaline Water</Text>
// //       <Text style={[s.sub, { color: colors.textSoft }]}>Premium drinking water with subscription and retail purchase options.</Text>

// //       {waterProducts.map((item) => (
// //         <Card key={item.id}>
// //           <View style={s.row}>
// //             <View style={[s.iconBox, { backgroundColor: colors.primarySoft }]}>
// //               <Text style={s.icon}>{item.icon}</Text>
// //             </View>
// //             <View style={{ flex: 1 }}>
// //               <Text style={[s.name, { color: colors.text }]}>{item.name}</Text>
// //               <Text style={[s.unit, { color: colors.textSoft }]}>{item.unit}</Text>
// //               <Text style={[s.price, { color: colors.text }]}>{formatINR(item.price)}</Text>
// //             </View>
// //             <Badge label={item.badge} tone="primary" />
// //           </View>
// //         </Card>
// //       ))}

// //       <AppButton title="Order Water" onPress={() => navigation.navigate('Checkout')} />
// //     </Screen>
// //   );
// // }

// // const s = StyleSheet.create({
// //   title: { fontSize: 26, fontWeight: '900' },
// //   sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 },
// //   row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
// //   iconBox: { width: 54, height: 54, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
// //   icon: { fontSize: 26 },
// //   name: { fontSize: 15, fontWeight: '800' },
// //   unit: { marginTop: 3, fontSize: 12 },
// //   price: { marginTop: 8, fontSize: 16, fontWeight: '900' }
// // });





import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import Badge from '../components/Badge';
import AppButton from '../components/AppButton';
import QuantityStepper from '../components/QuantityStepper';
import { waterProducts } from '../data/mockData';
import { formatINR, resolveImageUrl } from '../utils/format';

// ─── Feature highlights ────────────────────────────────────────────────────────
const HIGHLIGHTS = [
  { icon: 'water-check',    label: 'pH 8.5+',    sub: 'Alkaline balanced'  },
  { icon: 'shield-check',   label: 'Lab tested', sub: 'Every batch'        },
  { icon: 'truck-delivery', label: 'Same-day',   sub: 'Morning delivery'   },
  { icon: 'leaf',           label: 'BPA-free',   sub: 'Food-grade bottles' },
];

const TABS = ['One-time', 'Subscribe & Save'];
const WATER_IMAGES = {
  'miracle-plan': require('../../assets/miracleplan.png'),
};

// ─── Staggered entrance animation ─────────────────────────────────────────────
function AnimatedCard({ children, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─── Single product card ───────────────────────────────────────────────────────
function WaterProductCard({ item, tab, onAdd, colors }) {
  const isSubscribe = tab === 'Subscribe & Save';
  const displayPrice = isSubscribe ? Math.round(item.price * 0.9) : item.price;

  return (
    <View
      style={[
        s.productCard,
        {
          backgroundColor: colors.surface,
          borderColor: item.popular ? colors.primary + '66' : colors.border,
          borderWidth: item.popular ? 1.5 : 1,
        },
      ]}
    >
      {/* Popular ribbon */}
      {item.popular && (
        <View style={[s.popularRibbon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="star" size={10} color="#fff" />
          <Text style={s.popularRibbonText}>Popular</Text>
        </View>
      )}

      {/* Top row: icon + info + badge */}
      <View style={s.productTop}>
        <View style={[s.productIconWrap, { backgroundColor: '#E6F4FF', overflow: 'hidden' }]}>
          {WATER_IMAGES[item.id] ? (
            <Image source={WATER_IMAGES[item.id]} style={s.productLogo} contentFit="contain" />
          ) : item.image_url ? (
            <Image source={{ uri: resolveImageUrl(item.image_url) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Text style={s.productEmoji}>{item.icon}</Text>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.productName, { color: colors.text }]}>
            {item.name}
            {item.hindi_name ? ` (${item.hindi_name})` : ''}
          </Text>
          <Text style={[s.productUnit, { color: colors.textSoft }]}>{item.unit}</Text>

          <View style={s.priceRow}>
            <Text style={[s.productPrice, { color: colors.text }]}>
              {formatINR(displayPrice)}
            </Text>
            {isSubscribe && (
              <Text style={[s.strikePrice, { color: colors.textSoft }]}>
                {formatINR(item.price)}
              </Text>
            )}
            {!isSubscribe && !!item.oldPrice && (
              <Text style={[s.strikePrice, { color: colors.textSoft }]}>
                {formatINR(item.oldPrice)}
              </Text>
            )}
            {isSubscribe && (
              <View style={[s.savePill, { backgroundColor: '#E1F5EE' }]}>
                <Text style={[s.savePillText, { color: '#0F6E56' }]}>10% off</Text>
              </View>
            )}
          </View>
        </View>

        <Badge label={item.badge} tone="info" />
      </View>

      {!!item.description && (
        <Text style={[s.productDescription, { color: colors.textSoft }]}>{item.description}</Text>
      )}

      {/* Divider */}
      <View style={[s.divider, { backgroundColor: colors.border }]} />

      {/* Bottom row: price + add button */}
      <View style={s.productBottom}>
        <View>
          <Text style={[s.totalLabel, { color: colors.textSoft }]}>Price</Text>
          <Text style={[s.totalPrice, { color: colors.text }]}>
            {formatINR(displayPrice)}
          </Text>
        </View>

        <AppButton
          title="Add"
          onPress={() => onAdd(item)}
          variant="secondary"
          style={{ minWidth: 82, minHeight: 40 }}
        />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WaterScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('One-time');
  const [serverProducts, setServerProducts] = useState([]);
  
  const cartItems = useAppStore((s) => s.cartItems);
  const addToCart = useAppStore((s) => s.addToCart);
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  useEffect(() => {
    const { productsApi } = require('../services/api/products');
    productsApi.getAllProducts().then(res => {
      const list = res.products || res.data || [];
      if (res.success && list.length > 0) {
        // Filter only 'water' category products
        const waterOnly = list.filter(p => p.category && p.category.toLowerCase() === 'water');
        
        // Map API response to match the UI product card structure
        const mapped = waterOnly.map((p) => ({
          id: p.id.toString(),
          name: p.name || 'Alkaline Water',
          unit: p.unit ? `1 ${p.unit}` : '1 Liter',
          price: parseFloat(p.selling_price_per_gm || p.price || 0) * (['gm', 'g', 'gram', 'grams'].includes((p.unit || '').trim().toLowerCase()) ? 1000 : 1),
          oldPrice: undefined,
          icon: '💧',
          image_url: p.image_url,
          description: p.description,
          badge: p.category ? p.category.toUpperCase() : 'WATER'
        }));
        setServerProducts(mapped);
      }
    }).catch(e => console.warn('Fetch products failed on Water Screen', e));
  }, []);

  const productsList = serverProducts.length > 0 ? serverProducts : waterProducts;

  const [toastMsg, setToastMsg] = useState(null);
  const toastTimeout = useRef(null);

  const handleAddProduct = (item) => {
    const finalPrice = activeTab === 'Subscribe & Save' ? Math.round(item.price * 0.9) : item.price;
    addToCart({ ...item, price: finalPrice }, 1);
    
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastMsg(`${item.name || 'Product'} added to cart!`);
    toastTimeout.current = setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  const cartTotal = cartItems.reduce((acc, p) => {
    if (p.selling_price_per_gm) return acc + (parseFloat(p.selling_price_per_gm) * p.qty);
    const u = (p.unit || '').trim().toLowerCase();
    if (u.includes('kg')) return acc + ((p.price || 0) / 1000) * p.qty;
    return acc + (p.price || 0) * p.qty;
  }, 0);
  const cartCount = cartItems.length;

  return (
    <Screen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Page header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={[s.headerIconWrap, { backgroundColor: '#E6F4FF' }]}>
            <Text style={{ fontSize: 28 }}>💧</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.title, { color: colors.text }]}>Alkaline Water</Text>
            <Text style={[s.sub, { color: colors.textSoft }]}>
              Premium drinking water, delivered fresh to your door.
            </Text>
          </View>
        </View>

        {/* ── Feature highlights ──────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.highlightRow}
        >
          {/* {HIGHLIGHTS.map((h) => (
            <View
              key={h.label}
              style={[
                s.highlightPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons name={h.icon} size={16} color={colors.primary} />
              <View style={{ marginLeft: 7 }}>
                <Text style={[s.highlightLabel, { color: colors.text }]}>{h.label}</Text>
                <Text style={[s.highlightSub, { color: colors.textSoft }]}>{h.sub}</Text>
              </View>
            </View>
          ))} */}
        </ScrollView>

        {/* ── Purchase mode tabs ──────────────────────────────────────── */}
        <View
          style={[s.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [
                  s.tabItem,
                  {
                    backgroundColor: active ? colors.primary : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={tab === 'One-time' ? 'cart-outline' : 'calendar-sync-outline'}
                  size={14}
                  color={active ? '#fff' : colors.textSoft}
                />
                <Text style={[s.tabLabel, { color: active ? '#fff' : colors.text }]}>
                  {tab}
                </Text>
                {tab === 'Subscribe & Save' && !active && (
                  <View style={[s.tabSaveBadge, { backgroundColor: '#E1F5EE' }]}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#0F6E56' }}>
                      10% OFF
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Subscription info note */}
        {activeTab === 'Subscribe & Save' && (
          <View
            style={[s.subNote, { backgroundColor: '#F0FBF6', borderColor: '#9FE1CB' }]}
          >
            <MaterialCommunityIcons name="information-outline" size={14} color="#0F6E56" />
            <Text style={[s.subNoteText, { color: '#0F6E56' }]}>
              Subscribed orders are delivered weekly. You can pause or cancel anytime.
            </Text>
          </View>
        )}

        {/* ── Product cards ───────────────────────────────────────────── */}
        <View style={s.cardList}>
          {productsList.map((item, idx) => (
            <AnimatedCard key={item.id} index={idx}>
              <WaterProductCard
                item={item}
                tab={activeTab}
                onAdd={handleAddProduct}
                colors={colors}
              />
            </AnimatedCard>
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky order bar ────────────────────────────────────────────── */}
      {cartCount > 0 && (
        <View
          style={[
            s.orderBar,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <View>
            <Text style={[s.orderBarLabel, { color: colors.textSoft }]}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
            </Text>
            <Text style={[s.orderBarTotal, { color: colors.text }]}>
              {formatINR(cartTotal)}
            </Text>
          </View>

          <AppButton
            title="View Cart"
            onPress={() => navigation.navigate('Cart')}
            style={s.orderBtn}
          />
        </View>
      )}

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toastMsg && (
        <Animated.View style={[s.toast, { backgroundColor: colors.text }]}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.surface} />
          <Text style={[s.toastText, { color: colors.surface }]}>{toastMsg}</Text>
        </Animated.View>
      )}
    </Screen>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  sub: { fontSize: 13, fontWeight: '500', marginTop: 3, lineHeight: 18 },

  highlightRow: { gap: 10, paddingBottom: 18, paddingRight: 4 },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  highlightLabel: { fontSize: 12, fontWeight: '900' },
  highlightSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },

  tabBar: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toast: {
    position: 'absolute',
    bottom: 120, // Position above the sticky order bar if it exists
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 999,
  },
  toastText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabLabel: { fontSize: 12, fontWeight: '800' },
  tabSaveBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 2,
  },

  subNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  subNoteText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },

  cardList: { gap: 14 },
  productCard: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  popularRibbon: {
    position: 'absolute',
    top: 14,
    right: -1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  popularRibbonText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  productTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  productIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  productEmoji: { fontSize: 28 },
  productLogo: { width: 50, height: 50 },
  productName: { fontSize: 15, fontWeight: '900' },
  productUnit: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  productDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  productPrice: { fontSize: 18, fontWeight: '900' },
  strikePrice: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  savePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savePillText: { fontSize: 10, fontWeight: '900' },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 12 },
  productBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 11, fontWeight: '700' },
  totalPrice: { fontSize: 17, fontWeight: '900', marginTop: 1 },

  orderBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  orderBarLabel: { fontSize: 12, fontWeight: '600' },
  orderBarTotal: { fontSize: 20, fontWeight: '900', marginTop: 1 },
  orderBtn: { minWidth: 160 },
});
