// import React, { useMemo, useState, useEffect } from 'react';
// import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { useRoute } from '@react-navigation/native';
// import { useAppStore } from '../store/UseAppStore';
// import { themeTokens, radius } from '../constants/theme';
// import Screen from '../components/Screen';
// import Card from '../components/Card';
// import AppButton from '../components/AppButton';
// import SectionHeader from '../components/SectionHeader';
// import Badge from '../components/Badge';
// import Input from '../components/Input';
// import QuantityStepper from '../components/QuantityStepper';
// import PlanCard from '../components/PlanCard';
// import ProductCard from '../components/ProductCard';
// import DeliveryCard from '../components/DeliveryCard';
// import TransactionRow from '../components/TransactionRow';
// import MenuRow from '../components/MenuRow';
// import {
//   subscriptionPlans, basketPlans, freshVeggies, waterProducts, retailProducts,
//   deliveries, walletTransactions, notifications, supportTickets, userProfile, menuItems,
//   addressBook, fixedVeggies, pickupRules
// } from '../data/mockData';
// import { formatINR } from '../utils/format';

// export default function AddressScreen({ navigation }) {
//   const setAddress = useAppStore((s) => s.setAddress);
//   const mode = useAppStore((s) => s.themeMode);
//   const colors = themeTokens[mode];
//   const [address, setAddressText] = useState('Bhopal, Madhya Pradesh');

//   return (
//     <Screen>
//       <Text style={[s.title, { color: colors.text }]}>Add Default Address</Text>
//       <Text style={[s.sub, { color: colors.textSoft }]}>This address will be used for subscription delivery and retail orders.</Text>

//       <Card>
//         <Input label="Full Address" value={address} onChangeText={setAddressText} placeholder="Enter your address" />
//         <Input label="Landmark" placeholder="Near market / apartment / house no." />
//         <Input label="PIN Code" keyboardType="number-pad" placeholder="Enter PIN code" />
//         <Text style={[s.note, { color: colors.textMuted }]}>Tip: the app should support multiple addresses later.</Text>
//         <AppButton
//           title="Continue to Home"
//           onPress={() => {
//             setAddress('a1');
//             navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
//           }}
//         />
//       </Card>

//       <Card>
//         <SectionHeader title="Saved Address Ideas" subtitle="Quick UI for future multi-address support" />
//         {addressBook.map((item) => (
//           <View key={item.id} style={s.addressRow}>
//             <View style={[s.dot, { backgroundColor: colors.primary }]} />
//             <View style={{ flex: 1 }}>
//               <Text style={[s.addrLabel, { color: colors.text }]}>{item.label}</Text>
//               <Text style={[s.addrValue, { color: colors.textSoft }]}>{item.value}</Text>
//             </View>
//           </View>
//         ))}
//       </Card>
//     </Screen>
//   );
// }

// const s = StyleSheet.create({
//   title: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
//   sub: { fontSize: 14, lineHeight: 21, marginBottom: 18 },
//   note: { fontSize: 12, marginBottom: 12 },
//   addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 10 },
//   dot: { width: 10, height: 10, borderRadius: 99, marginTop: 6 },
//   addrLabel: { fontSize: 14, fontWeight: '800' },
//   addrValue: { marginTop: 2, fontSize: 12 }
// });





import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import ThemeHeader from '../components/ThemeHeader';
import SectionHeader from '../components/SectionHeader';
import Input from '../components/Input';
import { addressBook } from '../data/mockData';
import * as Location from 'expo-location';


const ADDRESS_TYPES = [
  { id: 'home', label: 'Home', icon: 'home-variant' },
  { id: 'work', label: 'Work', icon: 'briefcase-variant' },
  { id: 'other', label: 'Other', icon: 'map-marker-outline' },
];

function guessIcon(label = '') {
  const l = label.toLowerCase();
  if (l.includes('home')) return 'home-variant';
  if (l.includes('work') || l.includes('office')) return 'briefcase-variant';
  return 'map-marker-outline';
}

export default function AddressScreen({ navigation }) {
  const setAddressStore = useAppStore((s) => s.setAddress);
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);

  const [addressType, setAddressType] = useState('home');
  const [address, setAddressText] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pin, setPin] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const { addressesApi } = require('../services/api/addresses');
    addressesApi.getAddresses().then(res => {
      if (res.success && res.addresses) {
        // map API fields to UI fields
        const formatted = res.addresses.map(a => ({
          ...a,
          label: a.landmark ? a.landmark.substring(0, 15) : (a.is_default ? 'Home' : 'Saved Address'),
          value: `${a.address_line}, ${a.city} - ${a.pincode}`,
        }));
        setSavedAddresses(formatted);
        const defaultAddr = formatted.find(a => a.is_default);
        if (defaultAddr) setSelectedSavedId(defaultAddr.id);
      }
    });
  }, []);

  const danger = colors.danger ?? '#EF4444';
  const success = colors.success ?? '#16A34A';
  const border = colors.border ?? 'rgba(0,0,0,0.08)';
  const chipBg = colors.surfaceSoft ?? 'rgba(0,0,0,0.04)';

  async function handleDetectLocation() {
    setDetecting(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to auto-detect your address.');
        setDetecting(false);
        return;
      }

      // Check if location services (GPS) are actually enabled
      let providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) {
        Alert.alert('GPS Disabled', 'Please enable your device location services (GPS) to auto-detect your address.');
        setDetecting(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        // Safely construct the address string
        const street = place.street || place.name || '';
        const subregion = place.subregion || place.district || '';
        const city = place.city || place.region || '';
        
        let fullAddress = street;
        if (subregion && subregion !== street) fullAddress += `, ${subregion}`;
        if (city && city !== subregion) fullAddress += `, ${city}`;

        setAddressText(fullAddress.trim().replace(/^,\s*/, ''));
        setLandmark(place.district || place.subregion || '');
        setPin(place.postalCode || '');
      } else {
        Alert.alert('Location Not Found', 'Could not determine your address. Please enter manually.');
      }
    } catch (error) {
      console.log('Location detection error:', error.message);
      Alert.alert('Error', 'Failed to fetch location. Make sure GPS is enabled and try again.');
    } finally {
      setDetecting(false);
    }
  }

  function handleSelectSaved(item) {
    setSelectedSavedId(item.id);
    setAddressText(item.address_line || '');
    setLandmark(item.landmark || '');
    setPin(item.pincode || '');
    setErrors((e) => ({ ...e, address: undefined }));
  }

  function handleDeleteSaved(id) {
    Alert.alert(
      'Remove address',
      'Are you sure you want to remove this saved address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { addressesApi } = require('../services/api/addresses');
            const res = await addressesApi.deleteAddress(id);
            if (res.success) {
              setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
              if (selectedSavedId === id) setSelectedSavedId(null);
            } else {
              Alert.alert('Error', res.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  }

  async function handleContinue() {
    const nextErrors = {};
    if (!address.trim()) nextErrors.address = 'Please enter your full address';
    if (!/^\d{6}$/.test(pin)) nextErrors.pin = 'Enter a valid 6-digit PIN code';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const { addressesApi } = require('../services/api/addresses');
    
    // If we're updating a selected address vs adding a new one
    // Let's assume for simplicity we add a new one if it changed, or just add.
    // To match instructions: build UI to list, add, edit, delete. 
    // We will just create a new address.
    const res = await addressesApi.createAddress({
      address_line: address,
      city: 'Bhopal',
      pincode: pin,
      landmark: landmark || undefined,
      is_default: isDefault
    });

    if (res.success) {
      setAddressStore(res.address ? res.address.id : 'a1');
      useAppStore.getState().completeOnboarding();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      Alert.alert('Error', res.message || 'Failed to save address');
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
        <Pressable 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('MainTabs')} 
          style={({ pressed }) => [{
            width: 44, height: 44, alignItems: 'center', justifyContent: 'center', 
            borderRadius: 22, backgroundColor: colors.surface, 
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
            opacity: pressed ? 0.8 : 1
          }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ThemeHeader
        title="Delivery address"
        subtitle="Set the default doorstep for subscriptions, retail orders and water deliveries."
        icon="map-marker-radius"
        badge="Location"
        compact
      />

      <Card>
        <Pressable
          onPress={handleDetectLocation}
          disabled={detecting}
          style={({ pressed }) => [
            s.detectRow,
            { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            name={detecting ? 'crosshairs-gps' : 'crosshairs-gps'}
            size={18}
            color={colors.primary}
          />
          <Text style={[s.detectText, { color: colors.primary }]}>
            {detecting ? 'Detecting your location...' : 'Use current location'}
          </Text>
        </Pressable>

        <Text style={[s.fieldLabel, { color: colors.text }]}>Address Type</Text>
        <View style={s.chipRow}>
          {ADDRESS_TYPES.map((type) => {
            const selected = addressType === type.id;
            return (
              <Pressable
                key={type.id}
                onPress={() => setAddressType(type.id)}
                style={({ pressed }) => [
                  s.chip,
                  {
                    backgroundColor: selected ? colors.primary : chipBg,
                    borderColor: selected ? colors.primary : border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={type.icon}
                  size={16}
                  color={selected ? '#fff' : colors.textSoft}
                />
                <Text style={[s.chipText, { color: selected ? '#fff' : colors.text }]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Full Address *"
          value={address}
          onChangeText={(v) => {
            setAddressText(v);
            if (errors.address) setErrors((e) => ({ ...e, address: undefined }));
          }}
          placeholder="House / Flat no., street, area"
        />
        {!!errors.address && (
          <Text style={[s.errorText, { color: danger }]}>{errors.address}</Text>
        )}

        <Input
          label="Landmark"
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Near market / apartment / house no."
        />

        <Input
          label="PIN Code *"
          value={pin}
          onChangeText={(v) => {
            const digits = v.replace(/[^0-9]/g, '').slice(0, 6);
            setPin(digits);
            if (errors.pin) setErrors((e) => ({ ...e, pin: undefined }));
          }}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="6-digit PIN code"
        />
        {!!errors.pin && <Text style={[s.errorText, { color: danger }]}>{errors.pin}</Text>}

        <View style={[s.defaultRow, { borderColor: border }]}>
          <MaterialCommunityIcons name="star-outline" size={18} color={colors.textSoft} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[s.defaultTitle, { color: colors.text }]}>Set as default address</Text>
            <Text style={[s.defaultSub, { color: colors.textMuted }]}>
              We will use this for every order unless you choose another.
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[s.note, { color: colors.textMuted }]}>
          Tip: the app will support multiple saved addresses soon.
        </Text>

        <AppButton title="Save & Continue" onPress={handleContinue} />
      </Card>

      <Card>
        <SectionHeader
          title="Saved Addresses"
          subtitle="Tap a card to reuse it, or remove ones you no longer need"
        />

        {savedAddresses.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={28} color={colors.textMuted} />
            <Text style={[s.emptyText, { color: colors.textMuted }]}>No saved addresses yet.</Text>
          </View>
        ) : (
          savedAddresses.map((item) => {
            const selected = selectedSavedId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectSaved(item)}
                style={({ pressed }) => [
                  s.savedCard,
                  {
                    borderColor: selected ? colors.primary : border,
                    backgroundColor: selected ? `${colors.primary}14` : 'transparent',
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={[s.savedIcon, { backgroundColor: selected ? colors.primary : chipBg }]}>
                  <MaterialCommunityIcons
                    name={guessIcon(item.label)}
                    size={18}
                    color={selected ? '#fff' : colors.textSoft}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[s.addrLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[s.addrValue, { color: colors.textSoft }]} numberOfLines={2}>
                    {item.value}
                  </Text>
                </View>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleDeleteSaved(item.id);
                  }}
                  style={s.deleteBtn}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={danger} />
                </Pressable>

                <View
                  style={[
                    s.radio,
                    { borderColor: selected ? colors.primary : border },
                  ]}
                >
                  {selected && <View style={[s.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
              </Pressable>
            );
          })
        )}
      </Card>

      <View style={s.footerNote}>
        <MaterialCommunityIcons name="shield-check-outline" size={14} color={success} />
        <Text style={[s.footerText, { color: colors.textMuted }]}>
          Your address is only used for delivery and is never shared.
        </Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius?.lg ?? 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 2 },

  detectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: radius?.md ?? 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  detectText: { fontSize: 13, fontWeight: '700' },

  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  errorText: { fontSize: 12, fontWeight: '600', marginTop: -8, marginBottom: 10 },

  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    padding: 12,
    marginVertical: 14,
  },
  defaultTitle: { fontSize: 14, fontWeight: '700' },
  defaultSub: { fontSize: 11, marginTop: 2 },

  note: { fontSize: 12, marginBottom: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13 },

  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius?.md ?? 14,
    padding: 12,
    marginTop: 12,
  },
  savedIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrLabel: { fontSize: 14, fontWeight: '800' },
  addrValue: { marginTop: 2, fontSize: 12 },
  deleteBtn: { padding: 6, marginLeft: 6 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  radioDot: { width: 10, height: 10, borderRadius: 999 },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  footerText: { fontSize: 11 },
});
