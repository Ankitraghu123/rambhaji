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

export default function SupportScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const [issue, setIssue] = useState('Partial delivery');
  const [desc, setDesc] = useState("Missing coriander in today's bag.");

  return (
    <Screen>
      <ThemeHeader
        title="Support studio"
        subtitle="Raise issues, track tickets and get quick help for deliveries, wallet and plans."
        icon="lifebuoy"
        badge="Always on"
        compact
      />

      <Card>
        <Input label="Issue type" value={issue} onChangeText={setIssue} placeholder="Select complaint type" />
        <Input label="Describe issue" value={desc} onChangeText={setDesc} multiline placeholder="Write your complaint" />
        <Badge label="Photo upload placeholder ready" tone="info" />
        <AppButton title="Submit Ticket" onPress={() => navigation.navigate('TicketDetail', { ticketId: 'c1' })} style={{ marginTop: 12 }} />
      </Card>

      <SectionHeader title="Recent tickets" />
      {supportTickets.map((ticket) => (
        <Card key={ticket.id}>
          <View style={s.ticketRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.ticketTitle, { color: colors.text }]}>{ticket.title}</Text>
              <Text style={[s.ticketSub, { color: colors.textSoft }]}>{ticket.category} • {ticket.date}</Text>
            </View>
            <Badge label={ticket.status} tone={ticket.status === 'Resolved' ? 'success' : ticket.status === 'In progress' ? 'warning' : 'primary'} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '900' },
  sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketTitle: { fontSize: 15, fontWeight: '800' },
  ticketSub: { marginTop: 3, fontSize: 12 }
});
