import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
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

export default function OnboardingScreen({ navigation }) {
  const complete = useAppStore((s) => s.completeOnboarding);
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const slides = [
    { title: 'Fresh veggies delivered on schedule', desc: 'Subscription-first shopping with simple weekly deliveries and clear status updates.', icon: 'truck-check' },
    { title: 'Custom plans and add-ons', desc: 'Edit delivery dates, choose veggie preferences, and manage your wallet from one place.', icon: 'cart-heart' },
    { title: 'Support for retail and alkaline water', desc: 'Buy one-time vegetables, water products, and raise support tickets without any confusion.', icon: 'bottle-tonic-plus' }
  ];
  const [index, setIndex] = useState(0);
  const item = slides[index];

  return (
    <Screen scroll={false}>
      <View style={s.wrap}>
        <ThemeHeader
          title={item.title}
          subtitle={item.desc}
          icon={item.icon}
          badge="RAM BHAJI"
        />

        <View style={s.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[s.dot, { backgroundColor: i === index ? colors.primary : colors.border }]} />
          ))}
        </View>

        <AppButton
          title={index === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={() => {
            if (index === slides.length - 1) {
              complete();
              navigation.replace('Login');
            } else {
              setIndex(index + 1);
            }
          }}
        />
        <AppButton
          title="Skip"
          onPress={() => {
            complete();
            navigation.replace('Login');
          }}
          variant="ghost"
          style={{ marginTop: 8 }}
        />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 4 },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    minHeight: 360,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24
  },
  headline: { fontSize: 23, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  body: { textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 21 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 9, height: 9, borderRadius: 99 }
});
