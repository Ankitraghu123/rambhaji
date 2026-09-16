// import React, { useEffect, useRef } from 'react';
// import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useAppStore } from '../store/UseAppStore';
// import { themeTokens } from '../constants/theme';
// import Screen from '../components/Screen';
// import Card from '../components/Card';
// import AppButton from '../components/AppButton';
// import Badge from '../components/Badge';
// import ProductCard from '../components/ProductCard';
// import { retailProducts } from '../data/mockData';

// const categories = [
//   { label: 'Vegetables', icon: 'carrot', color: '#B87922' },
//   { label: 'Fruits', icon: 'food-apple-outline', color: '#C85A3B' },
//   { label: 'Combos', icon: 'basket-outline', color: '#267447' },
//   { label: 'Clean picks', icon: 'sprout-outline', color: '#A42A51' },
// ];

// function FloatingCrate() {
//   const anim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
//         Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
//       ])
//     ).start();
//   }, [anim]);

//   return (
//     <Animated.View
//       style={[
//         s.crate,
//         {
//           transform: [
//             { perspective: 580 },
//             {
//               rotateY: anim.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: ['-8deg', '8deg'],
//               }),
//             },
//             {
//               translateY: anim.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [0, -8],
//               }),
//             },
//           ],
//         },
//       ]}
//     >
//       <MaterialCommunityIcons name="basket" size={44} color="#FFFFFF" />
//       <View style={s.crateProduceRow}>
//         <MaterialCommunityIcons name="food-apple" size={18} color="#FFE0D7" />
//         <MaterialCommunityIcons name="carrot" size={18} color="#FFE1A0" />
//         <MaterialCommunityIcons name="leaf" size={18} color="#D9F2C8" />
//       </View>
//     </Animated.View>
//   );
// }

// export default function RetailScreen({ navigation }) {
//   const mode = useAppStore((state) => state.themeMode);
//   const colors = themeTokens[mode];

//   return (
//     <Screen>
//       <LinearGradient
//         colors={['#FFF9EA', '#E8F2D9', '#FFFDF7']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={s.hero}
//       >
//         <View style={s.heroCopy}>
//           <Badge label="Fresh market" tone="success" />
//           <Text style={[s.title, { color: colors.text }]}>Pick your produce</Text>
//           <Text style={[s.sub, { color: colors.textSoft }]}>One-time orders, clean harvests, and quick add-to-cart flow.</Text>
//         </View>
//         <FloatingCrate />
//       </LinearGradient>

//       <View style={s.categoryRow}>
//         {categories.map((item) => (
//           <Pressable key={item.label} style={({ pressed }) => [s.categoryChip, { opacity: pressed ? 0.78 : 1 }]}>
//             <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
//             <Text style={[s.categoryText, { color: colors.text }]}>{item.label}</Text>
//           </Pressable>
//         ))}
//       </View>

//       <Card style={s.ruleCard}>
//         <View style={s.ruleRow}>
//           <MaterialCommunityIcons name="clock-check-outline" size={21} color={colors.info} />
//           <View style={s.fill}>
//             <Badge label="Orders before 8 PM get next-day delivery" tone="info" />
//             <Text style={[s.helper, { color: colors.textSoft }]}>Non-subscriber orders may include a small delivery charge during checkout.</Text>
//           </View>
//         </View>
//       </Card>

//       <View style={s.grid}>
//         {retailProducts.map((item) => (
//           <ProductCard key={item.id} item={item} onAdd={() => navigation.navigate('Cart', { itemId: item.id })} />
//         ))}
//       </View>

//       <AppButton title="Go to Cart" onPress={() => navigation.navigate('Cart')} style={s.cartButton} />
//       <AppButton title="Checkout" onPress={() => navigation.navigate('Checkout')} variant="secondary" style={s.checkoutButton} />
//     </Screen>
//   );
// }

// const s = StyleSheet.create({
//   hero: {
//     minHeight: 190,
//     borderRadius: 26,
//     padding: 18,
//     marginBottom: 14,
//     overflow: 'hidden',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1,
//     borderColor: '#EAD7B2',
//     shadowColor: '#2B2112',
//     shadowOffset: { width: 0, height: 16 },
//     shadowOpacity: 0.12,
//     shadowRadius: 24,
//     elevation: 5,
//   },
//   heroCopy: {
//     flex: 1,
//     paddingRight: 10,
//   },
//   title: {
//     fontSize: 28,
//     lineHeight: 33,
//     fontWeight: '900',
//     marginTop: 12,
//   },
//   sub: {
//     marginTop: 8,
//     fontSize: 13,
//     lineHeight: 20,
//     fontWeight: '700',
//   },
//   crate: {
//     width: 98,
//     height: 112,
//     borderRadius: 28,
//     backgroundColor: '#B87922',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#7D5017',
//     shadowOffset: { width: 0, height: 16 },
//     shadowOpacity: 0.28,
//     shadowRadius: 22,
//     elevation: 8,
//   },
//   crateProduceRow: {
//     flexDirection: 'row',
//     gap: 2,
//     marginTop: 6,
//   },
//   categoryRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 12,
//   },
//   categoryChip: {
//     minHeight: 40,
//     paddingHorizontal: 12,
//     borderRadius: 999,
//     backgroundColor: '#FFFCF4',
//     borderWidth: 1,
//     borderColor: '#E7D8BE',
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 7,
//   },
//   categoryText: {
//     fontSize: 12,
//     fontWeight: '900',
//   },
//   ruleCard: {
//     borderRadius: 18,
//   },
//   ruleRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 10,
//   },
//   fill: {
//     flex: 1,
//   },
//   helper: {
//     marginTop: 8,
//     fontSize: 12,
//     lineHeight: 18,
//     fontWeight: '700',
//   },
//   grid: {
//     gap: 10,
//   },
//   cartButton: {
//     marginTop: 14,
//   },
//   checkoutButton: {
//     marginTop: 10,
//   },
// });


/**
 * VeggiesScreen.jsx
 * Vegetables-only retail screen with real product images,
 * animated category cards, subcategory sidebar & qty controls.
 *
 * Drop-in replacement for RetailScreen — rename the export if needed.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import Screen from '../components/Screen';
import { formatINR, resolveImageUrl } from '../utils/format';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2; // 2-column card width (16 side pad × 2 + 16 gap)

/* ═══════════════════════════════════════════════════════════════════
   IMAGES  –  Unsplash CDN (requires internet connection in dev)
═══════════════════════════════════════════════════════════════════ */
const U = (id, w = 320, h = 320) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=75`;

const IMG = {
  // Hero banner
  hero: U('1590779033100-9f60a05a013d', 900, 420),

  // Category card covers  (landscape)
  catLeafy:    U('1512621776951-a57141f2eefd', 520, 290),
  catRoot:     U('1447175008436-054170c2e979', 520, 290),
  catTomato:   U('1546094096-0df4bcaaa337',  520, 290),
  catAromatics: U('1618512496248-a07fe83aa8cb', 520, 290),
  catBeans:    U('1587735243615-c03f25aaff15', 520, 290),
  catGourd:    U('1604977042946-1eecc30f269e', 520, 290),
  catExotic:   U('1459411621453-7b03977f4bfc', 520, 290),
  catHerbs:    U('1503140799974-14e285abcced', 520, 290),
  catMushroom: U('1504945005722-33670dcaf685', 520, 290),
  catOrganic:  U('1444731961956-751ed90465a5', 520, 290),

  // Product images (square)
  spinach:     U('1576045057995-568f588f82fb'),
  methi:       U('1622206151226-18ca2c9ab4a1'),
  cabbage:     U('1551754655-cd27e38d2076'),
  cauliflower: U('1568584711075-3d021a7c3ca3'),
  broccoli:    U('1459411621453-7b03977f4bfc'),
  lettuce:     U('1622206151226-18ca2c9ab4a1'),
  carrot:      U('1447175008436-054170c2e979'),
  radish:      U('1597362925123-77861d3fbac7'),
  beetroot:    U('1593105544559-ecb03bf76f82'),
  potato:      U('1518977676601-b53f82aba655'),
  sweetPotato: U('1596097635121-14b38c5d7a53'),
  tomato:      U('1546094096-0df4bcaaa337'),
  brinjal:     U('1615484477778-ca3b77940c25'),
  capsicum:    U('1563565375-f3fdfdbefa83'),
  redPepper:   U('1563565375-f3fdfdbefa83'),
  onion:       U('1618512496248-a07fe83aa8cb'),
  garlic:      U('1540148426945-6cf22a6b2383'),
  ginger:      U('1615485500704-8e990f9900f7'),
  greenChilli: U('1583454122935-4ab5c41c6f50'),
  peas:        U('1587735243615-c03f25aaff15'),
  greenBeans:  U('1567529684892-09290a1b2d05'),
  cucumber:    U('1604977042946-1eecc30f269e'),
  pumpkin:     U('1570586437263-ab629fccc818'),
  babyCorn:    U('1551754655-cd27e38d2076'),
  zucchini:    U('1596591868231-a4f8c1a2fa7e'),
  coriander:   U('1600788907416-456578634209'),
  mint:        U('1628556270448-4d4e4148e1b1'),
  basil:       U('1503140799974-14e285abcced'),
  mushroom:    U('1504945005722-33670dcaf685'),
};

/* ═══════════════════════════════════════════════════════════════════
   CATALOG  –  Vegetables only
═══════════════════════════════════════════════════════════════════ */
const CATALOG = [
  /* 1 ── Leafy Greens */
  {
    id: 'leafy', label: 'Leafy Greens',
    cover: IMG.catLeafy, color: '#1B6B1B', tint: '#E8F5E9',
    gradient: ['#43A047', '#1B5E20'], icon: 'leaf', count: 18,
    subcategories: [
      {
        id: 'spinach-more', label: 'Spinach & Greens', cover: IMG.spinach,
        banner: { title: 'Power-packed greens', sub: 'Rich in iron, vitamins & antioxidants' },
        products: [
          { id: 'lg1', name: 'Baby Spinach', unit: '250 g', price: 35, mrp: 42, image: IMG.spinach, tags: ['Washed & Ready'], badge: 'Farm Fresh' },
          { id: 'lg2', name: 'Palak (Spinach)', unit: '500 g', price: 28, mrp: 35, image: IMG.spinach, tags: [] },
          { id: 'lg3', name: 'Methi (Fenugreek)', unit: '200 g', price: 18, mrp: 22, image: IMG.methi, tags: ['Aromatic'] },
          { id: 'lg4', name: 'Iceberg Lettuce', unit: '1 pc', price: 59, mrp: 72, image: IMG.lettuce, tags: ['Imported'], badge: 'Imported' },
        ],
      },
      {
        id: 'cabbage-flower', label: 'Cabbage & Cauliflower', cover: IMG.cabbage,
        banner: { title: 'Crisp & hearty', sub: 'Perfect for curries, salads & stir-fries' },
        products: [
          { id: 'lg5', name: 'Green Cabbage', unit: '500 g', price: 28, mrp: 35, image: IMG.cabbage, tags: [] },
          { id: 'lg6', name: 'Cauliflower', unit: '1 pc', price: 30, mrp: 38, image: IMG.cauliflower, tags: [] },
          { id: 'lg7', name: 'Broccoli', unit: '250 g', price: 49, mrp: 60, image: IMG.broccoli, tags: ['Imported'], badge: 'Imported' },
        ],
      },
    ],
  },

  /* 2 ── Root Vegetables */
  {
    id: 'roots', label: 'Root Vegetables',
    cover: IMG.catRoot, color: '#BF360C', tint: '#FBE9E7',
    gradient: ['#EF6C00', '#BF360C'], icon: 'carrot', count: 12,
    subcategories: [
      {
        id: 'carrot-radish', label: 'Carrot & Radish', cover: IMG.carrot,
        banner: { title: 'Earthy & nutritious', sub: 'Freshly harvested, full of goodness' },
        products: [
          { id: 'r1', name: 'Carrot - Ooty', unit: '500 g', price: 35, mrp: 42, image: IMG.carrot, tags: ['Sweet', 'Crunchy'] },
          { id: 'r2', name: 'White Radish (Mooli)', unit: '500 g', price: 25, mrp: 30, image: IMG.radish, tags: [] },
          { id: 'r3', name: 'Beetroot', unit: '500 g', price: 38, mrp: 46, image: IMG.beetroot, tags: ['Superfood'] },
        ],
      },
      {
        id: 'potato-yam', label: 'Potato & Yam', cover: IMG.potato,
        banner: { title: 'Your kitchen staples', sub: 'Versatile, filling & always fresh' },
        products: [
          { id: 'r4', name: 'Potato', unit: '1 kg', price: 24, mrp: 30, image: IMG.potato, tags: [] },
          { id: 'r5', name: 'Baby Potato', unit: '500 g', price: 35, mrp: 42, image: IMG.potato, tags: ['Tender'], badge: 'Popular' },
          { id: 'r6', name: 'Sweet Potato', unit: '500 g', price: 42, mrp: 52, image: IMG.sweetPotato, tags: ['Healthy', 'Sweet'] },
        ],
      },
    ],
  },

  /* 3 ── Tomato & Capsicum */
  {
    id: 'tomato-cap', label: 'Tomato & Capsicum',
    cover: IMG.catTomato, color: '#B71C1C', tint: '#FFEBEE',
    gradient: ['#E53935', '#B71C1C'], icon: 'food-apple-outline', count: 10,
    subcategories: [
      {
        id: 'tomatoes', label: 'Tomatoes', cover: IMG.tomato,
        banner: { title: 'Red, ripe & ready', sub: 'Freshly sorted every morning' },
        products: [
          { id: 'tc1', name: 'Tomato - Hybrid', unit: '1 kg', price: 32, mrp: 40, image: IMG.tomato, tags: ['Farm Fresh'] },
          { id: 'tc2', name: 'Cherry Tomato', unit: '250 g', price: 55, mrp: 68, image: IMG.tomato, tags: ['Sweet'], badge: 'Popular' },
          { id: 'tc3', name: 'Tomato - Desi', unit: '500 g', price: 22, mrp: 28, image: IMG.tomato, tags: [] },
          { id: 'tc4', name: 'Brinjal - Purple Long', unit: '500 g', price: 29, mrp: 35, image: IMG.brinjal, tags: [] },
        ],
      },
      {
        id: 'capsicums', label: 'Capsicum & Peppers', cover: IMG.capsicum,
        banner: { title: 'Vibrant & versatile', sub: 'Colour up your plate' },
        products: [
          { id: 'tc5', name: 'Capsicum - Green', unit: '250 g', price: 26, mrp: 32, image: IMG.capsicum, tags: [] },
          { id: 'tc6', name: 'Red Bell Pepper', unit: '250 g', price: 39, mrp: 49, image: IMG.redPepper, tags: [], badge: 'Imported' },
          { id: 'tc7', name: 'Yellow Bell Pepper', unit: '250 g', price: 39, mrp: 49, image: IMG.capsicum, tags: ['Imported'], badge: 'Imported' },
          { id: 'tc8', name: 'Green Chilli', unit: '100 g', price: 11, mrp: 14, image: IMG.greenChilli, tags: ['Spicy'] },
        ],
      },
    ],
  },

  /* 4 ── Onion, Garlic & Ginger */
  {
    id: 'aromatics', label: 'Onion, Garlic & Ginger',
    cover: IMG.catAromatics, color: '#6A1B9A', tint: '#F3E5F5',
    gradient: ['#9C27B0', '#6A1B9A'], icon: 'circle-outline', count: 8,
    subcategories: [
      {
        id: 'onion-group', label: 'Onion & Shallots', cover: IMG.onion,
        banner: { title: 'The kitchen trinity', sub: 'Starts every great dish' },
        products: [
          { id: 'o1', name: 'Onion', unit: '1 kg', price: 28, mrp: 34, image: IMG.onion, tags: [] },
          { id: 'o2', name: 'Small Onion (Shallots)', unit: '250 g', price: 32, mrp: 40, image: IMG.onion, tags: ['Flavorful'] },
          { id: 'o3', name: 'Spring Onion', unit: '100 g', price: 18, mrp: 22, image: IMG.coriander, tags: ['Fresh Cut'] },
        ],
      },
      {
        id: 'garlic-ginger', label: 'Garlic & Ginger', cover: IMG.garlic,
        banner: { title: 'Immunity powerhouses', sub: 'Packed with health-boosting goodness' },
        products: [
          { id: 'o4', name: 'Garlic', unit: '100 g', price: 25, mrp: 30, image: IMG.garlic, tags: ['Strong Aroma'] },
          { id: 'o5', name: 'Ginger', unit: '100 g', price: 22, mrp: 28, image: IMG.ginger, tags: ['Fresh'] },
          { id: 'o6', name: 'Ginger-Garlic Paste', unit: '200 g', price: 38, mrp: 46, image: IMG.garlic, tags: ['Ready to Use'] },
        ],
      },
    ],
  },

  /* 5 ── Beans & Peas */
  {
    id: 'beans-peas', label: 'Beans & Peas',
    cover: IMG.catBeans, color: '#1565C0', tint: '#E3F2FD',
    gradient: ['#1E88E5', '#1565C0'], icon: 'seed-outline', count: 10,
    subcategories: [
      {
        id: 'fresh-peas', label: 'Fresh Peas', cover: IMG.peas,
        banner: { title: 'Sweet & tender', sub: 'Freshly shelled or ready-to-cook' },
        products: [
          { id: 'bp1', name: 'Green Peas (Matar)', unit: '500 g', price: 42, mrp: 52, image: IMG.peas, tags: ['Sweet', 'Tender'], badge: 'Seasonal' },
          { id: 'bp2', name: 'Snow Peas', unit: '200 g', price: 65, mrp: 78, image: IMG.peas, tags: ['Imported'], badge: 'Imported' },
        ],
      },
      {
        id: 'beans', label: 'Beans', cover: IMG.greenBeans,
        banner: { title: 'Fresh from the fields', sub: 'Hand-sorted green & cluster beans' },
        products: [
          { id: 'bp3', name: 'French Beans', unit: '250 g', price: 35, mrp: 42, image: IMG.greenBeans, tags: ['Crisp'] },
          { id: 'bp4', name: 'Cluster Beans (Guar)', unit: '250 g', price: 28, mrp: 35, image: IMG.greenBeans, tags: [] },
          { id: 'bp5', name: 'Broad Beans (Sem)', unit: '250 g', price: 30, mrp: 38, image: IMG.greenBeans, tags: ['Seasonal'] },
          { id: 'bp6', name: 'Flat Beans (Valor)', unit: '250 g', price: 32, mrp: 40, image: IMG.greenBeans, tags: [] },
        ],
      },
    ],
  },

  /* 6 ── Gourds & Squash */
  {
    id: 'gourds', label: 'Gourds & Squash',
    cover: IMG.catGourd, color: '#2E7D32', tint: '#E8F5E9',
    gradient: ['#66BB6A', '#2E7D32'], icon: 'food-variant', count: 9,
    subcategories: [
      {
        id: 'cucumber-group', label: 'Cucumber & Zucchini', cover: IMG.cucumber,
        banner: { title: 'Cool & hydrating', sub: 'Perfect for salads & raitas' },
        products: [
          { id: 'g1', name: 'Cucumber', unit: '500 g', price: 22, mrp: 28, image: IMG.cucumber, tags: ['Hydrating'] },
          { id: 'g2', name: 'Zucchini - Green', unit: '300 g', price: 45, mrp: 58, image: IMG.zucchini, tags: [], badge: 'Imported' },
          { id: 'g3', name: 'Yellow Zucchini', unit: '300 g', price: 49, mrp: 62, image: IMG.zucchini, tags: ['Imported'], badge: 'Imported' },
        ],
      },
      {
        id: 'desi-gourds', label: 'Desi Gourds', cover: IMG.pumpkin,
        banner: { title: 'Indian kitchen favourites', sub: 'Lauki, karela & more' },
        products: [
          { id: 'g4', name: 'Bottle Gourd (Lauki)', unit: '500 g', price: 20, mrp: 26, image: IMG.cucumber, tags: ['Light'] },
          { id: 'g5', name: 'Bitter Gourd (Karela)', unit: '250 g', price: 35, mrp: 42, image: IMG.cucumber, tags: ['Diabetic Friendly'] },
          { id: 'g6', name: 'Ridge Gourd (Tori)', unit: '500 g', price: 25, mrp: 32, image: IMG.cucumber, tags: [] },
          { id: 'g7', name: 'Pumpkin', unit: '500 g', price: 22, mrp: 28, image: IMG.pumpkin, tags: [] },
        ],
      },
    ],
  },

  /* 7 ── Exotic Vegetables */
  {
    id: 'exotics', label: 'Exotic Vegetables',
    cover: IMG.catExotic, color: '#0D47A1', tint: '#E3F2FD',
    gradient: ['#1976D2', '#0D47A1'], icon: 'star-outline', count: 14,
    subcategories: [
      {
        id: 'european-vegs', label: 'European Exotics', cover: IMG.broccoli,
        banner: { title: 'Chef-grade exotics', sub: 'Handpicked from European farms' },
        products: [
          { id: 'e1', name: 'Broccoli', unit: '250 g', price: 49, mrp: 60, image: IMG.broccoli, tags: ['Imported'], badge: 'Imported' },
          { id: 'e2', name: 'Baby Corn - Packet', unit: '200 g', price: 55, mrp: 66, image: IMG.babyCorn, tags: [] },
          { id: 'e3', name: 'Red Bell Pepper', unit: '250 g', price: 39, mrp: 49, image: IMG.redPepper, tags: [], badge: 'Imported' },
          { id: 'e4', name: 'Zucchini - Green', unit: '300 g', price: 45, mrp: 58, image: IMG.zucchini, tags: ['Imported'], badge: 'Imported' },
        ],
      },
      {
        id: 'asian-exotics', label: 'Asian Exotics', cover: IMG.babyCorn,
        banner: { title: 'Asian kitchen favourites', sub: 'Perfect for wok cooking & noodles' },
        products: [
          { id: 'e5', name: 'Bok Choy', unit: '200 g', price: 65, mrp: 80, image: IMG.cabbage, tags: ['Imported'], badge: 'Imported' },
          { id: 'e6', name: 'Edamame (Frozen)', unit: '200 g', price: 99, mrp: 120, image: IMG.peas, tags: ['Protein-Rich'], badge: 'Imported' },
        ],
      },
    ],
  },

  /* 8 ── Fresh Herbs */
  {
    id: 'herbs', label: 'Fresh Herbs',
    cover: IMG.catHerbs, color: '#1B5E20', tint: '#E8F5E9',
    gradient: ['#81C784', '#2E7D32'], icon: 'sprout-outline', count: 10,
    subcategories: [
      {
        id: 'coriander-mint', label: 'Coriander & Mint', cover: IMG.coriander,
        banner: { title: 'Fresh aromatics', sub: 'Elevate every dish with herbs' },
        products: [
          { id: 'h1', name: 'Coriander Leaves', unit: '100 g', price: 12, mrp: 15, image: IMG.coriander, tags: ['Fresh Cut'] },
          { id: 'h2', name: 'Mint Leaves (Pudina)', unit: '100 g', price: 14, mrp: 18, image: IMG.mint, tags: [] },
          { id: 'h3', name: 'Curry Leaves', unit: '50 g', price: 10, mrp: 12, image: IMG.coriander, tags: [] },
        ],
      },
      {
        id: 'basil-others', label: 'Basil & Gourmet', cover: IMG.basil,
        banner: { title: 'Gourmet herbs', sub: 'Premium herbs for special recipes' },
        products: [
          { id: 'h4', name: 'Italian Basil Leaves', unit: '25 g', price: 28, mrp: 33, image: IMG.basil, tags: [], badge: 'Imported' },
          { id: 'h5', name: 'Dill (Shepu)', unit: '50 g', price: 16, mrp: 20, image: IMG.coriander, tags: [] },
          { id: 'h6', name: 'Thyme', unit: '25 g', price: 35, mrp: 42, image: IMG.basil, tags: ['Imported'], badge: 'Imported' },
        ],
      },
    ],
  },

  /* 9 ── Mushrooms */
  {
    id: 'mushrooms', label: 'Mushrooms',
    cover: IMG.catMushroom, color: '#4E342E', tint: '#EFEBE9',
    gradient: ['#8D6E63', '#4E342E'], icon: 'mushroom-outline', count: 6,
    subcategories: [
      {
        id: 'all-mushrooms', label: 'All Mushrooms', cover: IMG.mushroom,
        banner: { title: 'Umami magic', sub: 'From everyday to gourmet varieties' },
        products: [
          { id: 'm1', name: 'Button Mushroom', unit: '200 g', price: 55, mrp: 68, image: IMG.mushroom, tags: ['Farm Fresh'] },
          { id: 'm2', name: 'Oyster Mushroom', unit: '150 g', price: 75, mrp: 90, image: IMG.mushroom, tags: ['Gourmet'] },
          { id: 'm3', name: 'Shiitake Mushroom', unit: '100 g', price: 120, mrp: 145, image: IMG.mushroom, tags: ['Imported', 'Superfood'], badge: 'Imported' },
          { id: 'm4', name: 'Portobello Mushroom', unit: '150 g', price: 135, mrp: 165, image: IMG.mushroom, tags: ['Gourmet'], badge: 'Imported' },
        ],
      },
    ],
  },

  /* 10 ── Certified Organics */
  {
    id: 'organics', label: 'Trusted Organics',
    cover: IMG.catOrganic, color: '#33691E', tint: '#F1F8E9',
    gradient: ['#8BC34A', '#33691E'], icon: 'leaf-circle-outline', count: 12,
    subcategories: [
      {
        id: 'org-veggies', label: 'Organic Veggies', cover: IMG.tomato,
        banner: { title: 'Chemical-free goodness', sub: 'Certified organic, grown with care' },
        products: [
          { id: 'og1', name: 'Organic Tomato', unit: '500 g', price: 42, mrp: 52, image: IMG.tomato, tags: ['Certified Organic'], badge: 'Organic' },
          { id: 'og2', name: 'Organic Spinach', unit: '200 g', price: 30, mrp: 38, image: IMG.spinach, tags: ['Certified Organic'], badge: 'Organic' },
          { id: 'og3', name: 'Organic Potato', unit: '500 g', price: 35, mrp: 44, image: IMG.potato, tags: ['Certified Organic'], badge: 'Organic' },
          { id: 'og4', name: 'Organic Carrot', unit: '500 g', price: 45, mrp: 56, image: IMG.carrot, tags: ['Certified Organic'], badge: 'Organic' },
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   FADE + SLIDE ANIMATION WRAPPER
═══════════════════════════════════════════════════════════════════ */
function FadeSlide({ children, trigger, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(22);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 300, delay, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration: 380, delay,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY CARD  –  image background + gradient overlay
═══════════════════════════════════════════════════════════════════ */
function CategoryCard({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to) =>
    Animated.spring(scale, {
      toValue: to, useNativeDriver: true, speed: 28, bounciness: 8,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: CARD_W, marginBottom: 16 }}>
      <Pressable
        onPressIn={() => press(0.94)}
        onPressOut={() => press(1)}
        onPress={onPress}
        style={s.categoryCard}
      >
        {/* Background image */}
        <Image source={{ uri: item.cover }} style={s.categoryCardImage} />

        {/* Dark gradient overlay from bottom */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.78)']}
          style={s.categoryCardOverlay}
        >
          {/* Count chip at top-left */}
          <View style={[s.countChip, { backgroundColor: item.color + 'DD' }]}>
            <MaterialCommunityIcons name={item.icon} size={11} color="#fff" />
            <Text style={s.countChipText}>{item.count}+ items</Text>
          </View>

          <View style={s.categoryCardBottom}>
            <Text style={s.categoryCardLabel} numberOfLines={2}>{item.label}</Text>
            <View style={s.categoryCardArrowRow}>
              <Text style={s.categoryCardExplore}>Explore</Text>
              <View style={[s.categoryCardArrowCircle, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name="arrow-right" size={12} color="#fff" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUBCATEGORY PILL  –  circular image + label
═══════════════════════════════════════════════════════════════════ */
function SubPill({ item, active, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.subPill, active && { backgroundColor: color + '12' }]}
    >
      <View style={[s.subPillRing, active && { borderColor: color, borderWidth: 2.5 }]}>
        <Image source={{ uri: item.cover }} style={s.subPillImage} />
      </View>
      <Text
        style={[s.subPillLabel, { color: active ? color : '#6E664F', fontWeight: active ? '900' : '700' }]}
        numberOfLines={2}
      >
        {item.label}
      </Text>
      {active && <View style={[s.subPillDot, { backgroundColor: color }]} />}
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QTY CONTROL  –  ADD → stepper
═══════════════════════════════════════════════════════════════════ */
function QtyAdd({ color, qty, onChange, onAdd }) {
  const scale = useRef(new Animated.Value(1)).current;

  const bump = () => {
    scale.setValue(0.82);
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, speed: 24, bounciness: 14,
    }).start();
  };

  if (qty === 0) {
    return (
      <Pressable
        style={[s.addBtn, { borderColor: color }]}
        onPress={() => { bump(); onAdd?.(); }}
      >
        <MaterialCommunityIcons name="plus" size={13} color={color} />
        <Text style={[s.addBtnText, { color }]}>ADD</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[s.addBtn, { backgroundColor: color, borderColor: color }]}
      onPress={() => { bump(); onAdd?.(); }}
    >
      <MaterialCommunityIcons name="check" size={13} color="#fff" />
      <Text style={[s.addBtnText, { color: '#fff' }]}>ADDED</Text>
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════════════════ */
function ProductCard({ item, color, qty, onChange, onAdd, onPress }) {
  const discount = item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
    : 0;

  return (
    <Pressable onPress={onPress} style={s.productCard}>
      {/* Image */}
      <View style={s.productImageWrap}>
        <Image source={{ uri: item.image }} style={s.productImage} />
        {item.badge && (
          <View style={[s.productBadge, { backgroundColor: color }]}>
            <Text style={s.productBadgeText}>{item.badge}</Text>
          </View>
        )}
        <Pressable style={s.heartBtn}>
          <MaterialCommunityIcons name="heart-outline" size={14} color="#8A8068" />
        </Pressable>
      </View>

      {/* Unit + ADD row */}
      <View style={s.productMetaRow}>
        <Text style={s.productUnit}>{item.unit}</Text>
        <QtyAdd color={color} qty={qty} onChange={onChange} onAdd={onAdd} />
      </View>

      {/* Price + discount */}
      <View style={s.priceRow}>
        <Text style={s.productPrice}>₹{item.price}</Text>
        {item.mrp > item.price && (
          <Text style={s.productMrp}>₹{item.mrp}</Text>
        )}
        {discount > 0 && (
          <View style={[s.discountChip, { backgroundColor: color + '18' }]}>
            <Text style={[s.discountText, { color }]}>{discount}% OFF</Text>
          </View>
        )}
      </View>

      <Text style={s.productName} numberOfLines={2}>
        {item.name}
        {item.hindi_name ? ` (${item.hindi_name})` : ''}
      </Text>

      {item.tags?.length > 0 && (
        <View style={s.tagRow}>
          {item.tags.slice(0, 2).map(tag => (
            <View key={tag} style={[s.tagChip, { backgroundColor: color + '14' }]}>
              <Text style={[s.tagText, { color }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════════════════════════ */
export default function RetailScreen({ navigation }) {
  const mode = useAppStore((state) => state.themeMode);
  const colors = themeTokens[mode];
  const cartItems = useAppStore((state) => state.cartItems || []);
  const cartCount = useAppStore((state) => state.cartCount || 0);
  const updateCartQty = useAppStore((state) => state.updateCartQty);
  const addToCart = useAppStore((state) => state.addToCart);

  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [search, setSearch] = useState('');
  const [serverProducts, setServerProducts] = useState([]);

  useEffect(() => {
    const { productsApi } = require('../services/api/products');
    productsApi.getAllProducts().then(res => {
      // Backend returns either { success: true, data: [...] } or { success: true, products: [...] }
      const list = res.products || res.data || [];
      if (res.success && list.length > 0) {
        const mapped = list.map(p => {
          let rawUnit = (p.unit || '1 pc').trim().toLowerCase();
          let baseQty = 1;
          let isMass = rawUnit === 'gm' || rawUnit === 'g' || rawUnit === 'gram' || rawUnit === 'grams' || rawUnit.includes('kg');
          
          if (isMass) {
            baseQty = 1000;
          } else {
             if (p.min_retail_qty && parseFloat(p.min_retail_qty) > 0) {
                 baseQty = parseFloat(p.min_retail_qty);
             } else {
                 baseQty = 1;
             }
          }

          let unitStr = rawUnit;
          if (isMass) {
            unitStr = '1 kg';
          }

          let perGmPrice = parseFloat(p.selling_price_per_gm);
          if (isNaN(perGmPrice) && p.price) {
            let unitGrams = 1000;
            if (rawUnit.includes('kg')) unitGrams = parseFloat(rawUnit) * 1000 || 1000;
            else if (rawUnit.includes('g')) unitGrams = parseFloat(rawUnit) || 1000;
            perGmPrice = parseFloat(p.price) / unitGrams;
          }
          if (isNaN(perGmPrice)) perGmPrice = 0;

          let parsedPrice = parseFloat(p.price) || 0;
          let finalPrice = parsedPrice > 0 ? parsedPrice : (perGmPrice * baseQty);

          let calcPrice = isMass ? Math.round(perGmPrice * baseQty) : finalPrice;
          let calcMrp = isMass ? Math.round(calcPrice * 1.2) : (parseFloat(p.mrp) || Math.round(calcPrice * 1.2));

          return {
            ...p,
            id: p.id.toString(),
            name: p.name,
            unit: unitStr,
            baseQty: baseQty,
            price: calcPrice || 0,
            image: resolveImageUrl(p.image_url || p.image),
            mrp: calcMrp || 0
          };
        });
        setServerProducts(mapped);
      }
    }).catch(e => console.warn('Fetch products failed', e));
  }, []);

  const dynamicCatalog = useMemo(() => {
    const catMap = {};

    serverProducts.forEach(p => {
      const catName = p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : 'Other';
      const subName = p.sub_category ? (p.sub_category.charAt(0).toUpperCase() + p.sub_category.slice(1)) : 'All';

      if (!catMap[catName]) {
        catMap[catName] = { subMap: {} };
      }
      if (!catMap[catName].subMap[subName]) {
        catMap[catName].subMap[subName] = [];
      }
      catMap[catName].subMap[subName].push(p);
    });

    const colorPalettes = [
      { color: '#1B6B1B', tint: '#E8F5E9', gradient: ['#43A047', '#1B5E20'], icon: 'leaf', cover: IMG.catLeafy },
      { color: '#BF360C', tint: '#FBE9E7', gradient: ['#EF6C00', '#BF360C'], icon: 'carrot', cover: IMG.catRoot },
      { color: '#B71C1C', tint: '#FFEBEE', gradient: ['#E53935', '#B71C1C'], icon: 'food-apple-outline', cover: IMG.catTomato },
      { color: '#6A1B9A', tint: '#F3E5F5', gradient: ['#9C27B0', '#6A1B9A'], icon: 'circle-outline', cover: IMG.catAromatics },
      { color: '#1565C0', tint: '#E3F2FD', gradient: ['#1E88E5', '#1565C0'], icon: 'seed-outline', cover: IMG.catBeans },
      { color: '#2E7D32', tint: '#E8F5E9', gradient: ['#66BB6A', '#2E7D32'], icon: 'food-variant', cover: IMG.catGourd },
      { color: '#0D47A1', tint: '#E3F2FD', gradient: ['#1976D2', '#0D47A1'], icon: 'star-outline', cover: IMG.catExotic },
    ];

    let catIndex = 0;

    const built = Object.keys(catMap).map(catName => {
      const palette = colorPalettes[catIndex % colorPalettes.length];
      catIndex++;

      const subcategories = Object.keys(catMap[catName].subMap).map(subName => {
        const products = catMap[catName].subMap[subName];
        return {
          id: subName.toLowerCase(),
          label: subName,
          cover: products[0]?.image || palette.cover,
          banner: { title: subName },
          products: products
        };
      });

      // Use the first subcategory's first product image as the category cover if available
      let catCover = palette.cover;
      if (subcategories.length > 0 && subcategories[0].products.length > 0 && subcategories[0].products[0].image) {
          catCover = subcategories[0].products[0].image;
      }

      return {
        id: catName.toLowerCase(),
        label: catName,
        cover: catCover, // use real product image as category cover
        color: palette.color,
        tint: palette.tint,
        gradient: palette.gradient,
        icon: palette.icon,
        count: subcategories.reduce((acc, sub) => acc + sub.products.length, 0),
        subcategories
      };
    });

    return built;
  }, [serverProducts]);

  const activeCategory = useMemo(() =>
    dynamicCatalog.find(c => c.id === activeCategoryId) ?? null,
  [dynamicCatalog, activeCategoryId]);

  const subcats = activeCategory?.subcategories ?? [];
  const currentSub = useMemo(
    () => subcats.find(sc => sc.id === activeSub) ?? subcats[0],
    [subcats, activeSub]
  );

  const filteredCatalog = useMemo(() =>
    search.trim()
      ? dynamicCatalog.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
      : dynamicCatalog,
    [search, dynamicCatalog]
  );

  const openCategory = (cat) => {
    setActiveCategoryId(cat.id);
    setActiveSub(cat.subcategories[0]?.id ?? null);
  };

  const goBack = () => {
    setActiveCategoryId(null);
    setActiveSub(null);
  };

  const filteredSubProducts = useMemo(() => {
    if (!search.trim()) return currentSub?.products ?? [];
    const lower = search.toLowerCase();
    
    const allProducts = subcats.flatMap(sc => sc.products);
    const uniqueProducts = [];
    const seen = new Set();
    
    for (const p of allProducts) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        uniqueProducts.push(p);
      }
    }

    return uniqueProducts.filter(p => 
      p.name?.toLowerCase().includes(lower) || 
      p.hindi_name?.toLowerCase().includes(lower)
    );
  }, [currentSub, subcats, search]);

  /* ──────────────────────────────────────────────────────────────
     LEVEL 1  –  Categories Grid
  ────────────────────────────────────────────────────────────── */
  if (!activeCategory) {
    return (
      <Screen>
        {/* ── Hero Banner ── */}
        <View style={s.hero}>
          <Image source={{ uri: IMG.hero }} style={s.heroImage} />
          <LinearGradient
            colors={['rgba(15,60,15,0.92)', 'rgba(27,110,27,0.60)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.heroGradient}
          >
            <View style={s.heroBadge}>
              <MaterialCommunityIcons name="leaf" size={11} color="#A8E6A3" />
              <Text style={s.heroBadgeText}>100% Farm Fresh</Text>
            </View>
            <Text style={s.heroTitle}>Fresh{'\n'}Vegetables</Text>
            <Text style={s.heroSubtitle}>Delivered same-day to your door</Text>

            <View style={s.heroStatsRow}>
              {[['10+', 'Categories'], ['100+', 'Varieties'], ['Daily', 'Fresh Stock']].map(([num, lbl], i) => (
                <React.Fragment key={lbl}>
                  {i > 0 && <View style={s.heroStatDivider} />}
                  <View style={s.heroStat}>
                    <Text style={s.heroStatNum}>{num}</Text>
                    <Text style={s.heroStatLabel}>{lbl}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* ── Search Bar ── */}
        {/* <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#8A8068" />
          <TextInput
            style={s.searchInput}
            placeholder="Search spinach, carrot, broccoli…"
            placeholderTextColor="#B0A898"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#A39C8A" />
            </Pressable>
          )}
        </View> */}

        {/* ── Delivery Notice ── */}
        <View style={s.noticeRow}>
          <View style={s.noticeDot} />
          <Text style={s.noticeText}>
            Order before{' '}
            <Text style={s.noticeBold}>8 PM</Text>
            {' '}for next-day delivery
          </Text>
        </View>

        {/* ── Category Grid ── */}
        <FadeSlide trigger="grid">
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            Shop by category
          </Text>
          <View style={s.categoryGrid}>
            {filteredCatalog.map((cat, idx) => (
              <FadeSlide key={cat.id} trigger={cat.id} delay={idx * 45}>
                <CategoryCard item={cat} onPress={() => openCategory(cat)} />
              </FadeSlide>
            ))}
          </View>
        </FadeSlide>

        {/* ── Floating Cart Button ── */}
        {cartCount > 0 && (
          <Pressable
            style={s.floatingCart}
            onPress={() => navigation.navigate('Cart')}
          >
            <LinearGradient
              colors={['#43A047', '#1B5E20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.floatingCartInner}
            >
              <MaterialCommunityIcons name="cart-outline" size={20} color="#fff" />
              <Text style={s.floatingCartText}>View Cart</Text>
              <View style={s.floatingCartBadge}>
                <Text style={s.floatingCartBadgeNum}>{cartCount}</Text>
              </View>
            </LinearGradient>
          </Pressable>
        )}
      </Screen>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     LEVEL 2 / 3  –  Subcategory Sidebar + Products
  ────────────────────────────────────────────────────────────── */
  return (
    <Screen scroll={false}>
      {/* Header */}
      <View style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4, gap: 10 }}>

          <View style={{ 
            flex: 1, flexDirection: 'row', alignItems: 'center', 
            backgroundColor: colors.surface, 
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
            borderWidth: 1, borderColor: colors.border
          }}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSoft} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, color: colors.text, fontSize: 14, padding: 0 }}
              placeholder={`Search in ${activeCategory.label}...`}
              placeholderTextColor={colors.textSoft}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSoft} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={s.subHeader}>
          <View style={s.fill}>
            <Text style={[s.subHeaderTitle, { color: colors.text }]}>
              {activeCategory.label}
            </Text>
            <Text style={[s.subHeaderSub, { color: colors.textSoft }]} numberOfLines={1}>
              {activeCategory.subcategories.length} sections · {activeCategory.count}+ items
            </Text>
          </View>
          {cartCount > 0 && (
            <Pressable
              style={[s.cartChip, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Cart')}
            >
              <View style={[s.cartIconBadge, { backgroundColor: colors.primary }]}>
                <Text style={s.cartIconBadgeText}>{cartCount}</Text>
              </View>
              <MaterialCommunityIcons name="cart-outline" size={24} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={s.bodyRow}>
        {/* ── Sidebar ── */}
        <ScrollView
          style={s.sidebar}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {subcats.map(sc => (
            <SubPill
              key={sc.id}
              item={sc}
              color={activeCategory.color}
              active={sc.id === currentSub?.id}
              onPress={() => setActiveSub(sc.id)}
            />
          ))}
        </ScrollView>

        {/* ── Product grid ── */}
        <FlatList
          key={currentSub?.id}
          style={s.productPane}
          contentContainerStyle={s.productPaneContent}
          data={filteredSubProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={s.productRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <FadeSlide trigger={currentSub?.id}>
              <View style={[s.subBanner, { backgroundColor: activeCategory.tint }]}>
                <View style={s.fill}>
                  <Text style={s.subBannerTitle}>{currentSub?.banner?.title}</Text>
                  <Text style={s.subBannerSub}>{currentSub?.banner?.sub}</Text>
                </View>
                <Image
                  source={{ uri: currentSub?.cover }}
                  style={s.subBannerImage}
                />
              </View>
            </FadeSlide>
          }
          renderItem={({ item }) => {
            const cartItem = cartItems.find(c => c.id === item.id);
            return (
              <ProductCard
                item={item}
                color={activeCategory.color}
                qty={cartItem ? cartItem.qty : 0}
                onChange={(newQty) => updateCartQty(item.id, newQty)}
                onAdd={() => addToCart(item, item.baseQty)}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              />
            );
          }}
          // ListFooterComponent={
          //   <Pressable style={[s.seeAllBtn, { borderColor: activeCategory.color }]}>
          //     <Text style={[s.seeAllText, { color: activeCategory.color }]}>
          //       See all products
          //     </Text>
          //     <MaterialCommunityIcons
          //       name="arrow-right" size={15} color={activeCategory.color}
          //     />
          //   </Pressable>
          // }
        />
      </View>
    </Screen>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({

  /* ── Hero ── */
  hero: {
    height: 210, borderRadius: 24, overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0A3D0A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22, shadowRadius: 22, elevation: 7,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: 20, justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF20',
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 10,
    borderWidth: 1, borderColor: '#FFFFFF30',
  },
  heroBadgeText: { color: '#A8E6A3', fontSize: 11, fontWeight: '700' },
  heroTitle: {
    color: '#fff', fontSize: 30, fontWeight: '900',
    lineHeight: 34, marginBottom: 6,
  },
  heroSubtitle: { color: '#FFFFFFBB', fontSize: 13, fontWeight: '600', marginBottom: 18 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { alignItems: 'center', paddingHorizontal: 12 },
  heroStatNum: { color: '#fff', fontSize: 15, fontWeight: '900' },
  heroStatLabel: { color: '#FFFFFFAA', fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  heroStatDivider: { width: 1, height: 26, backgroundColor: '#FFFFFF35' },

  /* ── Search ── */
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F0E8',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 12,
    borderWidth: 1.5, borderColor: '#EAE0D0',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#241C12', fontWeight: '600' },

  /* ── Delivery notice ── */
  noticeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FAFFF5',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 22,
    borderWidth: 1, borderColor: '#D4EFC0',
  },
  noticeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#43A047' },
  noticeText: { fontSize: 12.5, color: '#4A7A2E', fontWeight: '600' },
  noticeBold: { fontWeight: '900', color: '#2E5C1A' },

  /* ── Section title ── */
  sectionTitle: { fontSize: 19, fontWeight: '900', marginBottom: 14 },

  /* ── Category grid ── */
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 16, justifyContent: 'space-between',
  },
  categoryCard: {
    width: CARD_W, height: 158,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16, shadowRadius: 14, elevation: 4,
  },
  categoryCardImage: {
    ...StyleSheet.absoluteFillObject, width: '100%', height: '100%',
  },
  categoryCardOverlay: {
    flex: 1, padding: 11,
    justifyContent: 'space-between',
  },
  countChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  countChipText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
  categoryCardBottom: {},
  categoryCardLabel: {
    color: '#fff', fontSize: 14.5, fontWeight: '900',
    lineHeight: 18, marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryCardArrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
  },
  categoryCardExplore: { color: '#FFFFFFCC', fontSize: 11.5, fontWeight: '700' },
  categoryCardArrowCircle: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  /* ── Floating Cart ── */
  floatingCart: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32, shadowRadius: 18, elevation: 10,
  },
  floatingCartInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, gap: 10,
  },
  floatingCartText: { color: '#fff', fontSize: 15, fontWeight: '900', flex: 1 },
  floatingCartBadge: {
    backgroundColor: '#fff', width: 28, height: 28,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  floatingCartBadgeNum: { color: '#1B5E20', fontSize: 12, fontWeight: '900' },

  /* ── Sub-header ── */
  subHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EBDD',
    marginBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3EFE4',
    alignItems: 'center', justifyContent: 'center',
  },
  subHeaderTitle: { fontSize: 17, fontWeight: '900' },
  subHeaderSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  cartChip: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  cartIconBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff', zIndex: 10,
  },
  cartIconBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  fill: { flex: 1 },
  bodyRow: { flex: 1, flexDirection: 'row' },

  /* ── Sidebar ── */
  sidebar: {
    width: '23%',
    // backgroundColor: '#fff',
  },
  subPill: {
    alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 4, marginBottom: 6, marginRight: 8,
    borderRadius: 14, gap: 5,
  },
  subPillRing: {
    width: 48, height: 48, borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2, borderColor: '#F0EBDD',
  },
  subPillImage: { width: '100%', height: '100%' },
  subPillLabel: { fontSize: 9.5, textAlign: 'center', lineHeight: 12 },
  subPillDot: {
    width: 5, height: 5, borderRadius: 2.5,
  },

  /* ── Product pane ── */
productPane: {
  width: '77%',
  paddingLeft: 8,
},  productPaneContent: { paddingBottom: 24 },
  productRow: { justifyContent: 'space-between', marginBottom: 14 },

  /* ── Sub-banner ── */
  subBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 14, marginBottom: 14,
  },
  subBannerTitle: { fontSize: 15, fontWeight: '900', color: '#241C12' },
  subBannerSub: {
    fontSize: 11, fontWeight: '600', color: '#6E664F', marginTop: 3,
  },
  subBannerImage: {
    width: 58, height: 58, borderRadius: 14, marginLeft: 12,
  },

  /* ── Product card ── */
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18, padding: 10,
    borderWidth: 1, borderColor: '#F0EBDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055, shadowRadius: 10, elevation: 2,
  },
  productImageWrap: {
    height: 108, borderRadius: 12, overflow: 'hidden', marginBottom: 8,
  },
  productImage: { width: '100%', height: '100%' },
  productBadge: {
    position: 'absolute', top: 6, left: 6,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, zIndex: 1,
  },
  productBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },

  productMetaRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  productUnit: { fontSize: 10.5, color: '#8A8068', fontWeight: '700' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 9, borderWidth: 1.5, backgroundColor: '#fff',
  },
  addBtnText: { fontSize: 11, fontWeight: '900' },

  qtyStepper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 9, overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 7, paddingVertical: 5 },
  qtyVal: { fontSize: 12, fontWeight: '900', minWidth: 16, textAlign: 'center' },

  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 4, flexWrap: 'wrap',
  },
  productPrice: { fontSize: 14.5, fontWeight: '900', color: '#241C12' },
  productMrp: {
    fontSize: 11.5, color: '#B0A898', textDecorationLine: 'line-through',
  },
  discountChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  discountText: { fontSize: 9.5, fontWeight: '900' },

  productName: {
    fontSize: 12.5, fontWeight: '700', color: '#241C12', lineHeight: 16,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  tagChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: '800' },

  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 12, marginTop: 4, marginBottom: 12,
  },
  seeAllText: { fontSize: 13, fontWeight: '800' },
});
