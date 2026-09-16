import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Easing
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { themeTokens } from "../constants/theme";
import { packagesApi } from "../services/api/packages";
import { useAppStore } from "../store/UseAppStore";
import { formatINR, resolveImageUrl } from "../utils/format";
import { subscriptionsApi } from "../services/api/subscriptions";

// --- THEMES FOR MAIN PLANS ---
const THEMES = [
  { // Nano / Green
    main: '#27AE60',
    light: '#E8F8F5',
    badge: 'Starter',
    logo: require('../../assets/nanologo.png')
  },
  { // Silver / Grey
    main: '#7F8C8D',
    light: '#F2F3F4',
    badge: 'Best value',
    logo: require('../../assets/silver.png')
  },
  { // Gold / Yellow
    main: '#D4AF37',
    light: '#FEF9E7',
    badge: 'Premium',
    logo: require('../../assets/goldlogo.png')
  },
  { // Miracle / Blue
    main: '#3498DB',
    light: '#EBF5FB',
    badge: 'Premium Plan',
    logo: require('../../assets/miracleplan.png')
  }
];

function CollapsibleVeggies({ items, color }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    setExpanded(!expanded);
    Animated.timing(anim, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false
    }).start();
  };

  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (items.length * 40) + 24]
  });

  return (
    <View style={mainStyles.collapsibleWrap}>
      <Pressable onPress={toggle} style={[mainStyles.veggieHeader, { backgroundColor: color + '10' }]}>
        <View style={mainStyles.veggieIconBox}>
          <MaterialCommunityIcons name="leaf" size={16} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[mainStyles.veggieTitle, { color }]}>Customize your veggies</Text>
          <Text style={mainStyles.veggieSub}>{items.length} items selected</Text>
        </View>
        <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={color} />
      </Pressable>
      
      <Animated.View style={[mainStyles.veggieContent, { height, opacity: anim, borderColor: color + '20', borderWidth: expanded ? 1 : 0 }]}>
        <View style={{ padding: 12 }}>
          {items.map((item, i) => (
            <View key={i} style={mainStyles.veggieItem}>
              <View style={mainStyles.veggieItemLeft}>
                <View style={[mainStyles.checkCircle, { backgroundColor: color }]}>
                  <MaterialCommunityIcons name="check" size={10} color="#fff" />
                </View>
                <Text style={mainStyles.veggieName}>{item.Product?.name || 'Item'}</Text>
              </View>
              <Text style={[mainStyles.veggieWeight, { color }]}>{item.default_qty_gm}gm</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// --- MAIN PLANS VIEW (Attractive UI) ---
function MainPlansView({ 
  navigation, packages, loading, mySubscriptions,
  isOnboarding, selectedPlanId, handleSelectPlan, handleSkip, handleContinue
}) {
  const insets = useSafeAreaInsets();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const isYearly = billingCycle === 'yearly';

  // Dynamic clearance to ensure bottom content & cards are fully visible above the floating bottom tab bar
  const bottomPadding = isOnboarding
    ? Math.max(insets.bottom, 16) + 130
    : Math.max(64 + Math.max(insets.bottom, 10) + 48, 156);
  const topPadding = Math.max(insets.top + 16, 52);

  return (
    <View style={mainStyles.container}>
      <View style={mainStyles.bgBlobTopRight} />
      <View style={mainStyles.bgBlobBottomLeft} />
      
      <ScrollView 
        style={mainStyles.scrollView}
        contentContainerStyle={[
          mainStyles.scrollContent, 
          { paddingTop: topPadding, paddingBottom: bottomPadding }
        ]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[mainStyles.header, isOnboarding && { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={mainStyles.title}>{isOnboarding ? "Choose Your Plan" : "Subscription Plans"}</Text>
            <Text style={mainStyles.subtitle}>{isOnboarding ? "Pick the plan that fits your family. You can change it anytime." : "Premium weekly veggie bag plans for every need."}</Text>
          </View>
          {isOnboarding && (
            <Pressable onPress={handleSkip} hitSlop={12} style={s.skipBtn}>
              <Text style={s.skipText}>Skip</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#27AE60" />
            </Pressable>
          )}
        </View>

        <LinearGradient
          colors={['#7E520D', '#C18826', '#E9B54A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={mainStyles.heroCard}
        >
          <Text style={mainStyles.heroEyebrow}>PESTICIDE & CHEMICAL FREE SUBSCRIPTION PLANS</Text>
          <Text style={mainStyles.heroTitle}>Choose your perfect{"\n"}RAM BHAJI plan</Text>
          <Text style={mainStyles.heroDesc}>NANO, SILVER, GOLD & SENIOR PLANS with easy customization.</Text>
        </LinearGradient>

        {/* BILLING TOGGLE */}
        <View style={mainStyles.toggleContainer}>
          <Pressable 
            style={[mainStyles.toggleBtn, !isYearly && mainStyles.toggleBtnActive]} 
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[mainStyles.toggleText, !isYearly && mainStyles.toggleTextActive]}>Monthly</Text>
          </Pressable>
          <Pressable 
            style={[mainStyles.toggleBtn, isYearly && mainStyles.toggleBtnActive]} 
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[mainStyles.toggleText, isYearly && mainStyles.toggleTextActive]}>Yearly</Text>
            <View style={mainStyles.discountBadge}>
              <Text style={mainStyles.discountText}>25% OFF</Text>
            </View>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#27AE60" style={{ marginTop: 40 }} />
        ) : (
          <View style={mainStyles.plansList}>
              {packages.map((plan, i) => {
              const theme = THEMES[i % THEMES.length];
              
              const basePrice = plan.price;
              const displayPrice = isYearly ? (basePrice * 12) * 0.75 : basePrice;
              
              const perDelivery = plan.services_per_month 
                ? Math.round(displayPrice / (isYearly ? plan.services_per_month * 12 : plan.services_per_month))
                : null;
              
              const activeSub = mySubscriptions?.find(s => s.package_id === plan.id && (s.status === 'active' || s.status === 'paused'));
              
              return (
                <View key={plan.id} style={[
                  mainStyles.planCard, 
                  { borderColor: (isOnboarding && selectedPlanId === plan.id) ? theme.main : theme.main + '30' },
                  (isOnboarding && selectedPlanId === plan.id) && { borderWidth: 2 }
                ]}>
                  <View style={mainStyles.cardTop}>
                    <View style={mainStyles.badgeWrap}>
                      <View style={[mainStyles.badge, { backgroundColor: theme.light }]}>
                        <Text style={[mainStyles.badgeText, { color: theme.main }]}>{theme.badge}</Text>
                      </View>
                      {i === 0 && (
                        <View style={[mainStyles.checkBadge, { backgroundColor: theme.main }]}>
                          <MaterialCommunityIcons name="check" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    {plan.image_url ? (
                      <Image 
                        source={{ uri: resolveImageUrl(plan.image_url) }} 
                        style={mainStyles.planLogo} 
                        contentFit="contain" 
                        transition={300}
                      />
                    ) : (
                      <View style={[mainStyles.planLogo, { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.light, borderRadius: 16 }]}>
                        <MaterialCommunityIcons name="leaf-circle" size={36} color={theme.main} />
                      </View>
                    )}
                  </View>

                  <Text style={mainStyles.planName}>{plan.name}</Text>
                  <Text style={mainStyles.planTagline}>For {plan.num_persons} {plan.num_persons > 1 ? 'persons' : 'person'} • {plan.services_per_month} deliveries / month</Text>

                  <View style={mainStyles.priceRow}>
                    <Text style={mainStyles.priceAmount}>{formatINR(displayPrice)}</Text>
                    {isYearly && (
                       <Text style={mainStyles.oldPriceAmount}>{formatINR(basePrice * 12)}</Text>
                    )}
                    {perDelivery && !isYearly && (
                      <View style={[mainStyles.priceBadge, { backgroundColor: theme.light }]}>
                        <Text style={[mainStyles.priceBadgeText, { color: theme.main }]}>{theme.badge}</Text>
                      </View>
                    )}
                  </View>
                  {perDelivery && (
                    <Text style={mainStyles.perDeliveryTxt}>
                      {formatINR(perDelivery)} per delivery • {isYearly ? plan.services_per_month * 12 : plan.services_per_month} deliveries / {isYearly ? 'year' : 'month'}
                    </Text>
                  )}

                  <View style={mainStyles.divider} />

                  <Text style={mainStyles.includesLabel}>WHAT IS INCLUDED</Text>
                  <View style={mainStyles.featuresList}>
                    <View style={mainStyles.featureRow}>
                      <MaterialCommunityIcons name="leaf" size={16} color={theme.main} />
                      <Text style={mainStyles.featureText}>Pesticide & chemical free vegetables</Text>
                    </View>
                    <View style={mainStyles.featureRow}>
                      <MaterialCommunityIcons name="truck-delivery-outline" size={16} color={theme.main} />
                      <Text style={mainStyles.featureText}>{plan.services_per_month} doorstep deliveries / month</Text>
                    </View>
                    <View style={mainStyles.featureRow}>
                      <MaterialCommunityIcons name="calendar-check" size={16} color={theme.main} />
                      <Text style={mainStyles.featureText}>Flexible scheduling ( Pause feature )</Text>
                    </View>
                  </View>

                  {plan.FixedItems && plan.FixedItems.length > 0 && (
                    <CollapsibleVeggies items={plan.FixedItems} color={theme.main} />
                  )}

                  {isOnboarding ? (
                    <View style={mainStyles.actionRow}>
                      <Pressable 
                        style={[mainStyles.subscribeBtn, { backgroundColor: selectedPlanId === plan.id ? theme.main : '#fff', borderWidth: 2, borderColor: theme.main }]} 
                        onPress={() => handleSelectPlan(plan)}
                      >
                        {selectedPlanId === plan.id && <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />}
                        <Text style={[mainStyles.subscribeBtnText, { color: selectedPlanId === plan.id ? '#fff' : theme.main }]}>
                          {selectedPlanId === plan.id ? `${plan.name} Selected` : `Select ${plan.name}`}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={mainStyles.actionRow}>
                      <Pressable style={[mainStyles.detailBtn, { borderColor: theme.main }]} onPress={() => navigation.navigate('PlanDetail', { planId: plan.id, billingCycle, isViewOnly: true })}>
                        <Text style={[mainStyles.detailBtnText, { color: theme.main }]}>View Detail</Text>
                      </Pressable>
                      
                      {activeSub ? (
                        <View style={{ flex: 1.5, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.light, borderRadius: 14 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.main }}>Already Bought</Text>
                          {!activeSub.start_date && (
                            <Text style={{ fontSize: 9, color: '#E74C3C', fontWeight: '800', marginTop: 2 }}>* Start date not confirmed</Text>
                          )}
                        </View>
                      ) : (
                        <Pressable style={[mainStyles.subscribeBtn, { backgroundColor: theme.main }]} onPress={() => navigation.navigate('PlanDetail', { planId: plan.id, billingCycle, isViewOnly: false })}>
                          <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                          <Text style={mainStyles.subscribeBtnText}>Subscribe</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {isOnboarding && (
        <BlurView intensity={80} tint="light" style={s.bottomBar}>
          <Pressable onPress={handleSkip} hitSlop={10} style={s.doLaterBtn}>
            <Text style={s.doLaterText}>Do this later</Text>
          </Pressable>
          <Pressable
            onPress={handleContinue}
            disabled={selectedPlanId == null}
            style={[s.continueBtn, selectedPlanId == null && s.continueBtnDisabled]}
          >
            <Text style={s.continueBtnText}>Continue</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
          </Pressable>
        </BlurView>
      )}
    </View>
  );
}


// --- MAIN EXPORT COMPONENT ---
export default function PlansScreen({ navigation, route }) {
  const [packages, setPackages] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const isOnboarding = route?.params?.isOnboarding ?? false;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await packagesApi.getPackages();
      if (res.success && res.packages) {
        setPackages(res.packages);
      }
      
      const state = useAppStore.getState();
      if (state.token) {
        const subRes = await subscriptionsApi.getMySubscriptions();
        if (subRes.success && subRes.subscriptions) {
          setMySubscriptions(subRes.subscriptions);
        }
      }
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.replace("Address");
  };

  const handleSelectPlan = (plan) => {
    if (isOnboarding) {
      setSelectedPlanId((prev) => (prev === plan.id ? null : plan.id));
    }
  };

  const handleContinue = () => {
    navigation.replace("Address");
  };

  return (
    <MainPlansView
      navigation={navigation}
      packages={packages}
      loading={loading}
      mySubscriptions={mySubscriptions}
      isOnboarding={isOnboarding}
      selectedPlanId={selectedPlanId}
      handleSelectPlan={handleSelectPlan}
      handleSkip={handleSkip}
      handleContinue={handleContinue}
    />
  );
}

// --- STYLESHEETS ---
const s = StyleSheet.create({
  skipBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: 'transparent', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skipText: { fontSize: 14, fontWeight: "800", color: '#3498DB' },
  
  bottomBar: { 
    position: "absolute", 
    bottom: 0, left: 0, right: 0, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 32, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  doLaterBtn: { paddingVertical: 10 },
  doLaterText: { fontSize: 14, fontWeight: "700", color: '#34495E' },
  continueBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 99,
    backgroundColor: '#00B87C',
    shadowColor: '#00B87C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  continueBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0
  },
  continueBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

const mainStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFCFE' },
  bgBlobTopRight: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#35BDF215' },
  bgBlobBottomLeft: { position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E52DF30A' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#101026', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#4E5172', marginTop: 6, fontWeight: '500', paddingRight: 20 },
  heroCard: { padding: 24, borderRadius: 24, marginBottom: 24, shadowColor: '#C18826', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  heroEyebrow: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1, opacity: 0.9, marginBottom: 8 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 30, marginBottom: 10 },
  heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  plansList: { gap: 20 },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 2, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '900' },
  checkBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planLogo: { width: 70, height: 70, marginTop: -10, marginRight: -10 },
  planName: { fontSize: 24, fontWeight: '900', color: '#101026' },
  planTagline: { fontSize: 13, color: '#7F8C8D', marginTop: 4, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16, gap: 4 },
  priceSymbol: { fontSize: 18, fontWeight: '900', color: '#101026' },
  priceAmount: { fontSize: 32, fontWeight: '900', color: '#101026', letterSpacing: -1 },
  priceBadge: { marginLeft: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  priceBadgeText: { fontSize: 10, fontWeight: '900' },
  perDeliveryTxt: { fontSize: 12, color: '#4E5172', marginTop: 8, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F5', marginVertical: 20 },
  includesLabel: { fontSize: 11, fontWeight: '900', color: '#7F8C8D', letterSpacing: 1, marginBottom: 14 },
  featuresList: { gap: 12, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, fontWeight: '600', color: '#101026' },
  collapsibleWrap: { marginBottom: 20 },
  veggieHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  veggieIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  veggieTitle: { fontSize: 14, fontWeight: '800' },
  veggieSub: { fontSize: 11, color: '#7F8C8D', marginTop: 2, fontWeight: '500' },
  veggieContent: { overflow: 'hidden', borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -4 },
  veggieItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F5' },
  veggieItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCircle: { width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  veggieName: { fontSize: 13, fontWeight: '600', color: '#101026' },
  veggieWeight: { fontSize: 12, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 12 },
  detailBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailBtnText: { fontSize: 14, fontWeight: '800' },
  subscribeBtn: { flex: 1.5, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800'
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 99,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 99,
  },
  toggleBtnActive: {
    backgroundColor: '#0c194dff', // Darker purple from the theme
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7F8C8D',
  },
  toggleTextActive: {
    color: '#fff',
  },
  discountBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  oldPriceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#95A5A6',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  }
});
