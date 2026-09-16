import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themeTokens } from '../constants/theme';
import { useAppStore } from '../store/UseAppStore';
import { formatINR } from '../utils/format';

export default function TransactionRow({ item }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  // API returns "type" as 'credit' or 'debit' and amount as string
  // If type is not explicitly 'credit', we check if it's explicitly 'debit'
  // If no type is provided, we default to checking the amount sign
  let isCredit = true;
  if (item.type) {
    isCredit = item.type.toLowerCase() === 'credit';
  } else {
    isCredit = Number(item.amount) >= 0;
  }
  
  // Apply business logic based on transaction title
  // 1. Buying a package/plan adds to the wallet (credit)
  // 2. A completed delivery deducts from the wallet (debit)
  const titleLower = (item.reason || item.title || '').toLowerCase();
  if (titleLower.includes('purchase') || titleLower.includes('package') || titleLower.includes('recharge') || titleLower.includes('refund') || titleLower.includes('add')) {
    isCredit = true;
  }
  if (titleLower.includes('delivery') || titleLower.includes('deduction')) {
    isCredit = false;
  }

  const tone = isCredit ? colors.success : colors.danger;
  
  const title = item.reason || item.title || 'Transaction';
  
  // Format API date
  const dateStr = item.created_at 
    ? new Date(item.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : item.date;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{title}</Text>
        <Text style={[styles.date, { color: colors.textSoft }]}>{dateStr}</Text>
      </View>
      <Text style={[styles.amount, { color: tone }]}>
        {isCredit ? '+' : '-'}{formatINR(Math.abs(Number(item.amount)))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10
  },
  title: { fontSize: 14, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 14, fontWeight: '900' }
});
