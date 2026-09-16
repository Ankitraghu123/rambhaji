
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius, spacing, font } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import ProductCard from '../components/ProductCard';
import { resolveImageUrl } from '../utils/format';


export default function ProductDetailScreen({ route, navigation }) {
  // If no product is passed via route, we shouldn't render the mock Red Potato data.
  const product = route.params?.product;

  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!product) return; // Don't fetch related if no product

    const { productsApi } = require('../services/api/products');
    productsApi.getAllProducts().then(res => {
      const list = res.products || res.data || [];
      if (res.success && list.length > 0) {
        let related = list.filter(p => p.id !== product.id);
        
        if (product.category) {
          const sameCat = related.filter(p => p.category === product.category);
          if (sameCat.length > 0) {
            related = sameCat;
          }
        }
        
        // Take up to 5 items
        related = related.slice(0, 5);
        
        // Ensure image_url resolves correctly for related items
        const processed = related.map(p => ({
          ...p,
          image_url: resolveImageUrl(p.image_url || p.image)
        }));
        
        setRelatedProducts(processed);
      }
    }).catch(e => console.warn('Fetch related products failed', e));
  }, [product?.id, product?.category]);

  const mode = useAppStore((state) => state.themeMode);
  const cartItems = useAppStore((state) => state.cartItems || []);
  const colors = themeTokens[mode];

  if (!product) {
    return (
      <Screen scroll={true}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.text, marginTop: spacing.md, fontSize: font.size.lg }}>Product not found</Text>
          <AppButton 
            title="Go Back" 
            onPress={() => navigation.goBack()} 
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </Screen>
    );
  }

  let baseQty = 250;
  if (product.min_retail_qty && parseFloat(product.min_retail_qty) > 0) {
    let raw = parseFloat(product.min_retail_qty);
    const unitStr = (product.unit || '').trim().toLowerCase();
    if ((unitStr === 'gm' || unitStr === 'g' || unitStr === 'gram' || unitStr === 'grams' || unitStr.includes('kg')) && raw < 10) {
      baseQty = raw * 1000;
    } else {
      baseQty = raw;
    }
  }

  const [qty, setQty] = useState(baseQty);

  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  const showToast = () => {
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  let perGmPrice = parseFloat(product.selling_price_per_gm);
  if (isNaN(perGmPrice) && product.price) {
    let unitGrams = 1000;
    if (product.unit) {
      const u = product.unit.toLowerCase();
      if (u.includes('kg')) unitGrams = parseFloat(product.unit) * 1000 || 1000;
      else if (u.includes('g')) unitGrams = parseFloat(product.unit) || 1000;
    }
    perGmPrice = parseFloat(product.price) / unitGrams;
  }
  if (isNaN(perGmPrice)) perGmPrice = 0;

  const pricePerBase = (perGmPrice * baseQty).toFixed(0);
  const totalPrice = (perGmPrice * qty).toFixed(2);

  const formatQty = (grams) => {
    if (grams >= 1000) {
      const kg = grams / 1000;
      return `${Number.isInteger(kg) ? kg : kg.toFixed(2)} kg`;
    }
    return `${grams} g`;
  };

  const imageUrl = resolveImageUrl(product.image || product.image_url);

  return (
    <>
    <Screen scroll={true}>
      <Card style={styles.imageCard}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.mainImage, styles.placeholderImage, { backgroundColor: colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="basket-outline" size={64} color={colors.textSoft} />
          </View>
        )}
      </Card>

      <View style={styles.headerInfo}>
        <Text style={[styles.title, { color: colors.text }]}>{product.name}</Text>
        <Text style={[styles.subtitle, { color: colors.textSoft }]}>
          {product.hindi_name ? `${product.hindi_name} • ` : ''}Fresh sorted produce
        </Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.success }]}>₹{pricePerBase}</Text>
          <View style={[styles.priceForBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.priceForText}>Price for: {formatQty(baseQty)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={[styles.stepper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text
              style={[styles.stepperBtn, { color: qty > baseQty ? colors.text : colors.textMuted }]}
              onPress={() => setQty(Math.max(baseQty, qty - baseQty))}
            >
              —
            </Text>
            <Text style={[styles.stepperVal, { color: colors.text }]}>{formatQty(qty)}</Text>
            <Text
              style={[styles.stepperBtn, { color: colors.text }]}
              onPress={() => setQty(qty + baseQty)}
            >
              +
            </Text>
          </View>
          <View style={styles.addBtnWrap}>
            <AppButton
              title={`Add to Cart (₹${totalPrice})`}
              iconLeft="cart-outline"
              onPress={() => {
                const addToCart = useAppStore.getState().addToCart;
                addToCart(product, qty);
                showToast();
              }}
            />
          </View>
        </View>
      </View>

      <View style={[styles.sectionTitleRow, { marginBottom: spacing.md }]}>
        <MaterialCommunityIcons name="leaf" size={18} color={colors.success} />
        <Text style={[styles.sectionTitle, { color: colors.success, marginBottom: 0 }]}> Know Your Product</Text>
      </View>
      <Card style={styles.detailsCard}>
        <Text style={[styles.descText, { color: colors.textSoft }]}>
          {product.description || "A detailed description for this product is not available yet. Please check back soon for more product information."}
        </Text>
        <View style={styles.specsGrid}>
          <View style={[styles.specItem, { borderColor: colors.border }]}>
            <View style={styles.specLabelRow}>
              <MaterialCommunityIcons name="translate" size={12} color={colors.textMuted} />
              <Text style={[styles.specLabel, { color: colors.textMuted, marginBottom: 0, marginLeft: 4 }]}>HINDI NAME</Text>
            </View>
            <Text style={[styles.specValue, { color: colors.text }]}>{product.hindi_name || 'N/A'}</Text>
          </View>
          <View style={[styles.specItem, { borderColor: colors.border }]}>
            <View style={styles.specLabelRow}>
              <MaterialCommunityIcons name="weight" size={12} color={colors.textMuted} />
              <Text style={[styles.specLabel, { color: colors.textMuted, marginBottom: 0, marginLeft: 4 }]}>MINIMUM RETAIL QUANTITY</Text>
            </View>
            <Text style={[styles.specValue, { color: colors.text }]}>{baseQty} {product.unit === 'pc' ? 'pc' : 'g'}</Text>
          </View>
          <View style={[styles.specItem, { borderColor: colors.border }]}>
            <View style={styles.specLabelRow}>
              <MaterialCommunityIcons name="scale" size={12} color={colors.textMuted} />
              <Text style={[styles.specLabel, { color: colors.textMuted, marginBottom: 0, marginLeft: 4 }]}>UNIT</Text>
            </View>
            <Text style={[styles.specValue, { color: colors.text }]}>Gram (g)</Text>
          </View>
          <View style={[styles.specItem, { borderColor: colors.border }]}>
            <View style={styles.specLabelRow}>
              <MaterialCommunityIcons name="identifier" size={12} color={colors.textMuted} />
              <Text style={[styles.specLabel, { color: colors.textMuted, marginBottom: 0, marginLeft: 4 }]}>UNIT ID</Text>
            </View>
            <Text style={[styles.specValue, { color: colors.text }]}>{product.unit_id || 1}</Text>
          </View>
        </View>
      </Card>

      <View style={[styles.sectionTitleRow, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
        <MaterialCommunityIcons name="leaf" size={18} color={colors.success} />
        <Text style={[styles.sectionTitle, { color: colors.success, marginBottom: 0 }]}> You May like to view more</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
        {relatedProducts.map((item) => {
          return (
            <View key={item.id} style={{ width: 240 }}>
              <ProductCard
                item={item}
                onPress={() => navigation.push('ProductDetail', { product: item })}
                onAdd={() => {}}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center', marginTop: spacing.xxl }]}>
        Why Shop From Ram Bhaji?
      </Text>
      <View style={styles.featuresRow}>
        <Card style={styles.featureCard}>
          <View style={styles.featureIconWrap}>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.success} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.success }]}>Highest Assortment</Text>
          <Text style={[styles.featureDesc, { color: colors.textSoft }]}>Fresh vegetables, fruits, and seasonal specials.</Text>
        </Card>
        <Card style={styles.featureCard}>
          <View style={styles.featureIconWrap}>
            <MaterialCommunityIcons name="sprout-outline" size={24} color={colors.success} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.success }]}>Naturally Grown</Text>
          <Text style={[styles.featureDesc, { color: colors.textSoft }]}>Chemical-conscious sourcing and careful handling.</Text>
        </Card>
        <Card style={styles.featureCard}>
          <View style={styles.featureIconWrap}>
            <MaterialCommunityIcons name="headset" size={24} color={colors.success} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.success }]}>Customer Support</Text>
          <Text style={[styles.featureDesc, { color: colors.textSoft }]}>Help for orders, delivery, and subscriptions.</Text>
        </Card>
      </View> */}
    </Screen>
    
    <Pressable
      style={[styles.floatingCart, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Cart')}
    >
      <View style={[styles.cartIconBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.cartIconBadgeText}>{cartItems.length}</Text>
      </View>
      <MaterialCommunityIcons name="cart-outline" size={24} color={colors.text} />
    </Pressable>

    {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, -20],
                  }),
                },
              ],
              opacity: toastAnim,
            },
          ]}
        >
          <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
          <Text style={styles.toastText}>Item added to cart</Text>
        </Animated.View>
      )}
    </>

    
  );
}

const styles = StyleSheet.create({
  imageCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
  },
  priceForBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceForText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: spacing.sm,
  },
  stepperBtn: {
    fontSize: 22,
    paddingHorizontal: spacing.md,
    fontWeight: '600',
  },
  stepperVal: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'center',
  },
  addBtnWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  detailsCard: {
    padding: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  specItem: {
    width: '47%',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  relatedScroll: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  featuresRow: {
    gap: spacing.md,
  },
  featureCard: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  featureIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E9F7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  floatingCart: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  cartIconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cartIconBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  }
});
