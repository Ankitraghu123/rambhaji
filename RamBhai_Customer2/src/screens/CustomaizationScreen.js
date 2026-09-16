import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import ThemeHeader from '../components/ThemeHeader';
import SectionHeader from '../components/SectionHeader';
import Badge from '../components/Badge';
import Input from '../components/Input';
import QuantityStepper from '../components/QuantityStepper';
import PlanCard from '../components/PlanCard';
import ProductCard from '../components/ProductCard';
import DeliveryCard from '../components/DeliveryCard';
import TransactionRow from '../components/TransactionRow';
import MenuRow from '../components/MenuRow';
import {
  subscriptionPlans, basketPlans, freshVeggies, waterProducts, retailProducts,
  deliveries, walletTransactions, notifications, supportTickets, userProfile, menuItems,
  addressBook, fixedVeggies, pickupRules
} from '../data/mockData';
import { formatINR } from '../utils/format';

const CollapsibleSubCategory = ({ subCategory, items, dislikedProductIds, setDislikedProductIds, colors, s, isCollapsible }) => {
  const [expanded, setExpanded] = useState(!isCollapsible);

  return (
    <View style={{ marginTop: 8 }}>
      {subCategory !== 'Other' && (
        <Pressable 
          onPress={() => isCollapsible && setExpanded(!expanded)} 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 12 : 4, paddingVertical: 4 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {subCategory}
          </Text>
          {isCollapsible && (
            <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSoft} />
          )}
        </Pressable>
      )}
      
      {(!isCollapsible || expanded) && (
        <View style={s.chipWrap}>
          {items.map((item) => {
            const isDisliked = dislikedProductIds.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setDislikedProductIds((current) =>
                    current.includes(item.id) ? current.filter((x) => x !== item.id) : [...current, item.id]
                  );
                }}
                style={[
                  s.chip,
                  { 
                    backgroundColor: isDisliked ? colors.dangerSoft : colors.surfaceAlt, 
                    borderColor: isDisliked ? colors.danger : colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    gap: 8
                  }
                ]}
              >
                {item.image_url && (
                  <Image 
                    source={{ uri: `https://rambhaji.backend.shreenari.com${item.image_url}` }}
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                  />
                )}
                <Text style={{ color: isDisliked ? colors.danger : colors.text, fontWeight: '800', fontSize: 13 }}>
                  {item.name}
                  {item.hindi_name ? ` (${item.hindi_name})` : ''}
                </Text>
                <MaterialCommunityIcons 
                  name={isDisliked ? "close-circle" : "plus-circle-outline"} 
                  size={18} 
                  color={isDisliked ? colors.danger : colors.textSoft} 
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default function CustomizationScreen({ navigation, route }) {
  const { planId = 'quarterly', subscriptionId, isGlobalPrefs } = route.params || {};
  const selected = basketPlans.find((b) => b.id === planId) || basketPlans[0];
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const [remarks, setRemarks] = useState('No onion, extra coriander');
  const [serverFixedVeggies, setServerFixedVeggies] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [veggiePrefs, setVeggiePrefs] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [allProducts, setAllProducts] = useState([]);
  const [dislikedProductIds, setDislikedProductIds] = useState([]);

  useEffect(() => {
    if (isGlobalPrefs) {
      const loadGlobalPrefs = async () => {
        try {
          const { productsApi } = require('../services/api/products');
          const { authApi } = require('../services/api/auth');
          
          const [prodRes, userRes] = await Promise.all([
            productsApi.getAllProducts(),
            authApi.getCurrentUser()
          ]);
          
          if (prodRes.success && prodRes.products) {
            setAllProducts(prodRes.products);
          }
          if (userRes.success && userRes.user) {
            setDislikedProductIds(userRes.user.disliked_products || []);
          }
        } catch (e) {
          console.warn('Failed to load global prefs data', e);
        }
      };
      loadGlobalPrefs();
    } else {
      const { productsApi } = require('../services/api/products');
      productsApi.getFixedVeggies().then(res => {
        if (res.success && res.data) {
          setServerFixedVeggies(res.data);
        }
      }).catch(e => console.warn('Fetch fixed veggies failed', e));

      const loadPrefs = async () => {
        try {
          const stored = await AsyncStorage.getItem(`@veggie_prefs_${planId}`);
          if (stored) setVeggiePrefs(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to load veggie prefs', e);
        }
      };
      loadPrefs();
    }
  }, [planId, isGlobalPrefs]);

  const veggiesList = serverFixedVeggies.length > 0 ? serverFixedVeggies : fixedVeggies;

  const toggleVeggie = async (name) => {
    const newPrefs = { ...veggiePrefs, [name]: veggiePrefs[name] === false ? true : false };
    setVeggiePrefs(newPrefs);
    try {
      await AsyncStorage.setItem(`@veggie_prefs_${planId}`, JSON.stringify(newPrefs));
    } catch (e) {
      console.error('Failed to save veggie prefs', e);
    }
  };

  const handleSave = async () => {
    if (subscriptionId) {
      setIsSaving(true);
      try {
        const { subscriptionsApi } = require('../services/api/subscriptions');
        const payload = {
          subscription_id: subscriptionId,
          items: veggiesList
            .filter(item => selectedItems.includes(item))
            .map(item => ({
              product_id: typeof item === 'object' ? item.id : item,
              qty_gm: typeof item === 'object' ? (item.default_qty_gm || 100) : 100
            })),
          fixed_items: veggiesList
            .filter(item => veggiePrefs[typeof item === 'string' ? item : item.name] !== false)
            .map(item => ({
              product_id: typeof item === 'object' ? item.id : item,
              qty_gm: typeof item === 'object' ? (item.default_qty_gm || 100) : 100
            })),
        };
        await subscriptionsApi.selectSeasonalItems(payload);
        setIsSaving(false);
        import('react-native').then(rn => rn.Alert.alert('Success', 'Preferences updated'));
        navigation.goBack();
      } catch (e) {
        setIsSaving(false);
        import('react-native').then(rn => rn.Alert.alert('Error', 'Failed to update preferences'));
      }
    } else {
      navigation.goBack();
    }
  };

  const handleSaveGlobal = async () => {
    setIsSaving(true);
    try {
      const { authApi } = require('../services/api/auth');
      await authApi.updateDislikes({ disliked_products: dislikedProductIds });
      setIsSaving(false);
      import('react-native').then(rn => rn.Alert.alert('Success', 'Preferences updated'));
      navigation.goBack();
    } catch (e) {
      setIsSaving(false);
      import('react-native').then(rn => rn.Alert.alert('Error', 'Failed to update preferences'));
    }
  };

  if (isGlobalPrefs) {
    const groupedProducts = {};
    allProducts.forEach(p => {
      const cat = p.category || 'Other';
      const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      
      const subCat = p.sub_category || 'Other';
      const formattedSubCat = subCat.charAt(0).toUpperCase() + subCat.slice(1).toLowerCase();

      if (!groupedProducts[formattedCat]) {
        groupedProducts[formattedCat] = {};
      }
      if (!groupedProducts[formattedCat][formattedSubCat]) {
        groupedProducts[formattedCat][formattedSubCat] = [];
      }
      groupedProducts[formattedCat][formattedSubCat].push(p);
    });

    return (
      <Screen scroll={false}>
        <ThemeHeader
          title="Veggie Preferences"
          subtitle="Select the items you do not want in your deliveries."
          icon="carrot"
          compact
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {Object.keys(groupedProducts).sort().map(category => (
            <Card key={category} style={{ marginBottom: 16 }}>
              <SectionHeader title={category} subtitle="Tap items to add to dislikes" />
              
              {Object.keys(groupedProducts[category]).sort().map((subCategory) => {
                const isCollapsible = true;
                return (
                  <CollapsibleSubCategory
                    key={subCategory}
                    subCategory={subCategory}
                    items={groupedProducts[category][subCategory]}
                    dislikedProductIds={dislikedProductIds}
                    setDislikedProductIds={setDislikedProductIds}
                    colors={colors}
                    s={s}
                    isCollapsible={isCollapsible}
                  />
                );
              })}
            </Card>
          ))}
        </ScrollView>
        <View style={{ 
          paddingHorizontal: 24, 
          paddingBottom: 24, 
          paddingTop: 16, 
          backgroundColor: colors.surface, 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)'
        }}>
          <View>
            <Text style={{ fontSize: 13, color: colors.textSoft, fontWeight: '600', marginBottom: 4 }}>Disliked items</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{dislikedProductIds.length}</Text>
          </View>
          <AppButton title="Save Preferences" onPress={handleSaveGlobal} loading={isSaving} disabled={isSaving} style={{ minWidth: 150 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ThemeHeader
        title="Veggie customization"
        subtitle="Tune your bag, remarks and delivery preferences with a lively fresh-plan workspace."
        icon="carrot"
        badge={selected.name}
        compact
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card>
          <SectionHeader title={selected.name} subtitle={`Total weight: ${selected.totalWeight}`} />
          <View style={s.grid}>
            {selected.items.map(([name, weight]) => {
              const isChecked = veggiePrefs[name] !== false;
              return (
              <Pressable 
                key={name} 
                onPress={() => toggleVeggie(name)}
                style={[s.weightBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              >
                <View>
                  <Text style={[s.weightName, { color: colors.text }]}>{name}</Text>
                  <Text style={[s.weightValue, { color: colors.textSoft }]}>{weight}</Text>
                </View>
                <MaterialCommunityIcons 
                  name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={24} 
                  color={isChecked ? colors.primary : colors.textSoft} 
                />
              </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <SectionHeader title="Choose vegetables" subtitle="Tap items to simulate selection" />
          <View style={s.chipWrap}>
            {veggiesList.map((item) => {
              const active = selectedItems.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    setSelectedItems((current) =>
                      current.includes(item) ? current.filter((x) => x !== item) : [...current, item]
                    );
                  }}
                  style={[
                    s.chip,
                    { backgroundColor: active ? colors.primary : colors.surfaceAlt, borderColor: active ? colors.primary : colors.border }
                  ]}
                >
                  <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '800', fontSize: 12 }}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <SectionHeader title="Special remarks" />
          <Input
            label="Delivery instructions"
            value={remarks}
            onChangeText={setRemarks}
            placeholder="No onion / no garlic / 4 pieces lemon..."
            multiline
            style={{ minHeight: 120 }}
          />
          <Text style={[s.rules, { color: colors.textSoft }]}>Rules shown in the proposal can be enforced later via backend validation.</Text>
          <View style={s.rulesList}>
            {pickupRules.map((rule) => (
              <Badge key={rule} label={rule} tone="muted" />
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={[s.actions, { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16, backgroundColor: colors.surface, marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>
        <AppButton title="Save Customization" onPress={handleSave} loading={isSaving} disabled={isSaving} variant="secondary" style={{ flex: 1 }} />
        {!subscriptionId && (
          <AppButton title="Buy Now" onPress={() => navigation.navigate('Checkout', { planId })} style={{ flex: 1 }} />
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  sub: { fontSize: 14, lineHeight: 21, marginBottom: 18 },
  grid: { gap: 10 },
  weightBox: { borderWidth: 1, borderRadius: 16, padding: 12 },
  weightName: { fontSize: 14, fontWeight: '800' },
  weightValue: { marginTop: 4, fontSize: 12, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 99 },
  rules: { marginTop: 10, fontSize: 12, lineHeight: 18 },
  rulesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8 }
});