import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
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

export default function SplashScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  useEffect(() => {
    const timer = setTimeout(() => {
      const state = useAppStore.getState();
      // Temporarily skip the Onboarding screen after the loader.
      // Restore this block when you want to show Onboarding again.
      // if (!state.onboarded) {
      //   navigation.reset({
      //     index: 0,
      //     routes: [{ name: 'AppLoader', params: { nextRoute: 'Onboarding' } }],
      //   });
      //   return;
      // }
      if (!state.loggedIn) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AppLoader', params: { nextRoute: 'Login' } }],
        });
        return;
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'AppLoader', params: { nextRoute: 'MainTabs' } }],
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <Screen scroll={false}>
      <View style={s.center}>
        <View style={[s.logo, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="leaf" size={58} color={colors.primary} />
        </View>
        <Text style={[s.title, { color: colors.text }]}>VSMS</Text>
        <Text style={[s.subtitle, { color: colors.textSoft }]}>Vegetable Subscription Management System</Text>
        <Text style={[s.note, { color: colors.textMuted }]}>Fresh delivery • Wallet payments • Easy subscriptions</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  logo: { width: 118, height: 118, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 14 },
  subtitle: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, marginTop: 4 }
});
