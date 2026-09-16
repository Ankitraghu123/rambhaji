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

export default function TicketDetailScreen({ route }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const ticket = supportTickets.find((t) => t.id === (route.params?.ticketId || 'c1')) || supportTickets[0];

  return (
    <Screen>
      <ThemeHeader
        title="Ticket detail"
        subtitle="Track the issue, category, status and creation date in one focused view."
        icon="ticket-confirmation-outline"
        badge={ticket.status}
        compact
      />
      <Card>
        <Text style={[s.line, { color: colors.text }]}>Issue: {ticket.title}</Text>
        <Text style={[s.line, { color: colors.text }]}>Category: {ticket.category}</Text>
        <Text style={[s.line, { color: colors.text }]}>Status: {ticket.status}</Text>
        <Text style={[s.line, { color: colors.text }]}>Created: {ticket.date}</Text>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900', marginBottom: 18 },
  line: { fontSize: 14, fontWeight: '700', marginBottom: 10 }
});
