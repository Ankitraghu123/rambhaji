import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Image, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import ThemeHeader from '../components/ThemeHeader';
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

export default function FaqScreen() {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const faqs = [
    ['How does subscription work?', 'Choose a plan, customize vegetables, and manage wallet balance.'],
    ['Can delivery dates be changed?', 'Yes, the frontend supports date customization screens and validation logic.'],
    ['Does the app support retail orders?', 'Yes, one-time vegetable purchase flows are included in the UI.']
  ];

  return (
    <Screen>
      <ThemeHeader
        title="Fresh answers"
        subtitle="Quick explanations for subscriptions, delivery changes and retail orders."
        icon="comment-question-outline"
        badge="Help center"
        compact
      />
      {faqs.map(([q, a]) => (
        <Card key={q}>
          <Text style={[s.q, { color: colors.text }]}>{q}</Text>
          <Text style={[s.a, { color: colors.textSoft }]}>{a}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900' },
  sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 },
  q: { fontSize: 15, fontWeight: '900' },
  a: { marginTop: 8, fontSize: 13, lineHeight: 20 }
});
