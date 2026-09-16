import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens } from '../constants/theme';
import { packagesApi } from '../services/api/packages';
import { formatINR, resolveImageUrl } from '../utils/format';
import { subscriptionsApi } from '../services/api/subscriptions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const THEMES = [
  { // Nano / Green
    main: '#27AE60',
    light: '#E8F8F5',
    gradient: ['#1E8449', '#27AE60', '#2ECC71'],
    // badge: 'Starter',
    logo: require('../../assets/nanologo.png')
  },
  { // Silver / Grey
    main: '#7F8C8D',
    light: '#F2F3F4',
    gradient: ['#515A5A', '#7F8C8D', '#95A5A6'],
    // badge: 'Best value',
    logo: require('../../assets/silver.png')
  },
  { // Gold / Yellow
    main: '#D4AF37',
    light: '#FEF9E7',
    gradient: ['#9A7B2C', '#C19A36', '#E4B849'],
    // badge: 'Premium',
    logo: require('../../assets/goldlogo.png')
  },
  { // Miracle / Blue
    main: '#3498DB',
    light: '#EBF5FB',
    gradient: ['#21618C', '#2874A6', '#3498DB'],
    // badge: 'Premium Plan',
    logo: require('../../assets/miracleplan.png')
  }
];

export default function PlanDetailScreen({ navigation, route }) {
  const { planId, billingCycle = 'monthly', isViewOnly: initialViewOnly = false } = route.params || {};
  const [isViewOnly, setIsViewOnly] = useState(initialViewOnly);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  
  // Seasonal selection state
  const [selectedSeasonal, setSelectedSeasonal] = useState([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  const insets = useSafeAreaInsets();
  
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  useEffect(() => {
    fetchPlanDetails();
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      const res = await packagesApi.getPackages();
      const list = res.packages || [];
      // Find the specific plan based on ID passed in route
      const foundPlan = list.find(p => p.id === planId);
      
      if (foundPlan) {
        setPlan(foundPlan);
      } else {
        Alert.alert("Error", "Plan not found.");
        navigation.goBack();
      }

      const state = useAppStore.getState();
      if (state.token) {
        const subRes = await subscriptionsApi.getMySubscriptions();
        if (subRes.success && subRes.subscriptions) {
          const active = subRes.subscriptions.some(
            s => s.package_id === planId && (s.status === 'active' || s.status === 'paused')
          );
          setHasActiveSubscription(active);
        }
      }
    } catch (error) {
      console.warn('Fetch package failed', error);
      Alert.alert("Error", "Failed to load plan details.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeasonal = (itemId) => {
    const maxSelect = plan?.SeasonalConfig?.max_select_count || 3;
    
    if (selectedSeasonal.includes(itemId)) {
      // Deselect
      setSelectedSeasonal(prev => prev.filter(id => id !== itemId));
    } else {
      // Select if under limit
      if (selectedSeasonal.length < maxSelect) {
        setSelectedSeasonal(prev => [...prev, itemId]);
      } else {
        Alert.alert("Limit Reached", `You can only select up to ${maxSelect} seasonal items.`);
      }
    }
  };

  const handleBottomAction = () => {
    if (isViewOnly) {
      if (plan.SeasonalPool && plan.SeasonalPool.length > 0) {
        setIsViewOnly(false);
      } else {
        handleSubscribe();
      }
    } else {
      handleSubscribe();
    }
  };

  const handleSubscribe = () => {
    navigation.navigate('Checkout', { 
      planId: plan.id,
      plan,
      billingCycle,
      selectedSeasonal,
      displayPrice
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#27AE60" />
      </View>
    );
  }

  if (!plan) return null;

  // Determine theme based on ID (or index if ID is predictable, we'll use a hash of the name for fallback)
  const themeIndex = typeof plan.id === 'number' ? (plan.id - 1) % THEMES.length : 0;
  const theme = THEMES[themeIndex] || THEMES[0];
  
  const isYearly = billingCycle === 'yearly';
  const basePrice = plan.price;
  const displayPrice = isYearly ? (basePrice * 12) * 0.75 : basePrice;

  // const displayPerDelivery = plan.services_per_month 
  //   ? Math.round(displayPrice / (isYearly ? plan.services_per_month * 12 : plan.services_per_month)) 
  //   : null;
    
  const maxSelect = plan.SeasonalConfig?.max_select_count || 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER BAR */}
      <View style={styles.appBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.appBarTitle, { color: colors.text }]}>Plan Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 120 }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* HERO CARD */}
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={[styles.badge,]}>
              {/* <Text style={styles.badgeText}>{theme.badge}</Text> */}
            </View>
            {plan.image_url ? (
              <Image source={{ uri: resolveImageUrl(plan.image_url) }} style={styles.heroLogo} contentFit="contain" transition={300} />
            ) : (
              <View style={[styles.heroLogo, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 }]}>
                <MaterialCommunityIcons name="leaf-circle" size={32} color="#fff" />
              </View>
            )}
          </View>
          
          <Text style={styles.heroTitle}>{plan.name}</Text>
          <Text style={styles.heroSubtitle}>
            For {plan.num_persons} {plan.num_persons > 1 ? 'persons' : 'person'} • {plan.services_per_month} deliveries / month
          </Text>
          
          <View style={styles.heroPriceRow}>
            <Text style={styles.heroPrice}>{formatINR(displayPrice)}</Text>
            {isYearly && (
               <Text style={[styles.heroPerMonth, { textDecorationLine: 'line-through', opacity: 0.6 }]}>{formatINR(basePrice * 12)}</Text>
            )}
            <Text style={styles.heroPerMonth}>/ {isYearly ? 'year' : 'month'}</Text>
          </View>
          
          {/* {displayPerDelivery && (
            <Text style={styles.heroPerDelivery}>Just {formatINR(displayPerDelivery)} per delivery</Text>
          )} */}
        </LinearGradient>

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What's Included</Text>
          
          <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.light }]}>
                <MaterialCommunityIcons name="leaf" size={18} color={theme.main} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>Pesticide & chemical free vegetables</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.light }]}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={18} color={theme.main} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>{plan.services_per_month} doorstep deliveries / month</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.light }]}>
                <MaterialCommunityIcons name="calendar-check" size={18} color={theme.main} />
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>Flexible scheduling ( Pause feature )</Text>
            </View>
          </View>
        </View>

        {/* FIXED VEGGIES */}
        {plan.FixedItems && plan.FixedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Fixed Items</Text>
              <Text style={styles.sectionSubtitle}>Included in every delivery</Text>
            </View>
            
            <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {plan.FixedItems.map((item, index) => (
                <View key={item.product_id} style={[styles.listItem, index !== plan.FixedItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={styles.listItemLeft}>
                    <View style={[styles.listItemIcon, { backgroundColor: theme.main + '15' }]}>
                      <MaterialCommunityIcons name="check" size={16} color={theme.main} />
                    </View>
                    <Text style={[styles.listItemName, { color: colors.text }]}>
                      {item.Product?.name || 'Veggie'}
                      {item.Product?.hindi_name ? ` (${item.Product.hindi_name})` : ''}
                    </Text>
                  </View>
                  <View style={[styles.weightBadge, { backgroundColor: colors.background }]}>
                    <Text style={[styles.weightText, { color: colors.textSoft }]}>{item.default_qty_gm} {item.Product?.unit || 'gm'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SEASONAL VEGGIES SELECTOR */}
        {plan.SeasonalPool && plan.SeasonalPool.length > 0 && (
          <View style={styles.section}>
            {isViewOnly ? (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Seasonal Options</Text>
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Seasonal Options</Text>
                <View style={[styles.counterBadge, { backgroundColor: selectedSeasonal.length === maxSelect ? theme.main : theme.light }]}>
                  <Text style={[styles.counterText, { color: selectedSeasonal.length === maxSelect ? '#fff' : theme.main }]}>
                    {selectedSeasonal.length} / {maxSelect} Selected
                  </Text>
                </View>
              </View>
            )}
            {!isViewOnly && (
              <Text style={styles.sectionSubtitle}>Select up to {maxSelect} seasonal items for your first serving.</Text>
            )}

            {/* Seasonal Quantities Info */}
            {plan.SeasonalConfig?.seasonal_quantities && plan.SeasonalConfig.seasonal_quantities.length > 0 && (
              <View style={styles.seasonalQuantitiesCard}>
                <View style={styles.sqHeader}>
                  <MaterialCommunityIcons name="scale-balance" size={18} color={theme.main} />
                  <Text style={[styles.sqTitle, { color: colors.text }]}>Quantity per selection</Text>
                </View>
                <View style={styles.sqChipsRow}>
                  {plan.SeasonalConfig.seasonal_quantities.map((qty, idx) => (
                    <View key={idx} style={[styles.sqChip, { backgroundColor: theme.main + '12', borderColor: theme.main + '30' }]}> 
                      <Text style={[styles.sqChipLabel, { color: colors.textSoft }]}>Item {idx + 1}</Text>
                      <Text style={[styles.sqChipValue, { color: theme.main }]}>{qty >= 1000 ? `${qty / 1000} kg` : `${qty} gm`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.seasonalGrid}>
              {plan.SeasonalPool.map((item, itemIndex) => {
                const isSelected = selectedSeasonal.includes(item.product_id);
                const selIndex = selectedSeasonal.indexOf(item.product_id);
                const seasonalQtys = plan.SeasonalConfig?.seasonal_quantities || [];
                const assignedQty = selIndex >= 0 && selIndex < seasonalQtys.length ? seasonalQtys[selIndex] : null;
                
                return (
                  <Pressable 
                    key={item.product_id} 
                    onPress={() => !isViewOnly && handleToggleSeasonal(item.product_id)}
                    style={[
                      styles.seasonalCard, 
                      { 
                        backgroundColor: colors.surface, 
                        borderColor: (!isViewOnly && isSelected) ? theme.main : colors.border,
                        borderWidth: (!isViewOnly && isSelected) ? 2 : 1,
                        opacity: isViewOnly ? 0.9 : 1
                      }
                    ]}
                  >
                    <View style={styles.seasonalTop}>
                      {!isViewOnly ? (
                        <View style={[styles.checkbox, { 
                          borderColor: isSelected ? theme.main : colors.border,
                          backgroundColor: isSelected ? theme.main : 'transparent'
                        }]}>
                          {isSelected && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                        </View>
                      ) : (
                        <View style={[styles.checkbox, { borderColor: 'transparent' }]}>
                          <MaterialCommunityIcons name="leaf" size={16} color={theme.main + '80'} />
                        </View>
                      )}
                      {!isViewOnly && isSelected && assignedQty !== null && (
                        <View style={[styles.seasonalQtyBadge, { backgroundColor: theme.main }]}>
                          <Text style={styles.seasonalQtyText}>{assignedQty >= 1000 ? `${assignedQty / 1000} kg` : `${assignedQty} gm`}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.seasonalName, { color: colors.text }]} numberOfLines={1}>
                      {item.Product?.name || 'Seasonal Item'}
                      {item.Product?.hindi_name ? ` (${item.Product.hindi_name})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        
      </ScrollView>

      {/* STICKY BOTTOM ACTION */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarLeft}>
          <Text style={[styles.bottomTotalLabel, { color: colors.textSoft }]}>Total Price {isYearly && '(Yearly)'}</Text>
          <Text style={[styles.bottomTotalPrice, { color: colors.text }]}>{formatINR(displayPrice)}</Text>
        </View>
        
        <Pressable 
          style={({pressed}) => [
            styles.subscribeBtn, 
            { 
              backgroundColor: hasActiveSubscription ? colors.surface : theme.main,
              borderWidth: hasActiveSubscription ? 1.5 : 0,
              borderColor: hasActiveSubscription ? colors.textMuted : 'transparent',
              opacity: pressed && !hasActiveSubscription ? 0.9 : 1 
            }
          ]}
          onPress={hasActiveSubscription ? undefined : handleBottomAction}
          disabled={hasActiveSubscription}
        >
          <Text style={[styles.subscribeBtnText, hasActiveSubscription && { color: colors.textMuted }]}>
            {hasActiveSubscription ? 'Already Purchased' : (isViewOnly && plan?.SeasonalPool?.length > 0 ? 'Select Veggies & Subscribe' : 'Subscribe Now')}
          </Text>
          <MaterialCommunityIcons 
            name={hasActiveSubscription ? "check-circle" : "arrow-right"} 
            size={18} 
            color={hasActiveSubscription ? colors.textMuted : "#fff"} 
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroLogo: {
    width: 60,
    height: 60,
    marginTop: -10,
    marginRight: -10,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 20,
  },
  heroPrice: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroPerMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  heroPerDelivery: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
    marginBottom: 16,
  },
  counterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '800',
  },
  featureCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  weightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '800',
  },
  seasonalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seasonalCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
  },
  seasonalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonalName: {
    fontSize: 14,
    fontWeight: '700',
  },
  seasonalQuantitiesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FAFCFE',
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  sqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sqTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sqChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sqChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sqChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sqChipValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  seasonalQtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  seasonalQtyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  bottomTotalPrice: {
    fontSize: 22,
    fontWeight: '900',
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});