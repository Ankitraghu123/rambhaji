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

// export default function WalletScreen({ navigation }) {
//   const mode = useAppStore((s) => s.themeMode);
//   const colors = themeTokens[mode];
//   const balance = useAppStore((s) => s.walletBalance);
//   const recharge = useAppStore((s) => s.rechargeWallet);
//   const [amount, setAmount] = useState('1000');

//   return (
//     <Screen>
//       <Text style={[s.title, { color: colors.text }]}>Wallet</Text>
//       <Text style={[s.sub, { color: colors.textSoft }]}>Recharge, auto-deduction, and transaction history.</Text>

//       <Card>
//         <View style={s.balanceRow}>
//           <View>
//             <Text style={[s.label, { color: colors.textSoft }]}>Available balance</Text>
//             <Text style={[s.balance, { color: colors.text }]}>{formatINR(balance)}</Text>
//           </View>
//           <View style={[s.balanceIcon, { backgroundColor: colors.primarySoft }]}>
//             <MaterialCommunityIcons name="wallet" size={28} color={colors.primary} />
//           </View>
//         </View>
//         <View style={s.rechargeRow}>
//           <AppButton title="₹500" variant="secondary" onPress={() => recharge(500)} style={{ flex: 1 }} />
//           <AppButton title="₹1,000" variant="secondary" onPress={() => recharge(1000)} style={{ flex: 1 }} />
//           <AppButton title="₹2,000" variant="secondary" onPress={() => recharge(2000)} style={{ flex: 1 }} />
//         </View>
//         <View style={s.rechargeInputRow}>
//           <Input label="Custom recharge amount" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Enter amount" />
//           <AppButton title="Recharge" onPress={() => recharge(amount)} />
//         </View>
//       </Card>

//       <Card>
//         <SectionHeader title="Auto deduction" subtitle="Delivery success triggers planned wallet deduction." />
//         <Badge label="Insufficient balance → notify user" tone="danger" />
//       </Card>

//       <Card>
//         <SectionHeader title="Transactions" actionLabel="View all" onAction={() => navigation.navigate('Notifications')} />
//         {walletTransactions.map((item) => <TransactionRow key={item.id} item={item} />)}
//       </Card>
//     </Screen>
//   );
// }

// const s = StyleSheet.create({
//   title: { fontSize: 26, fontWeight: '900' },
//   sub: { marginTop: 6, marginBottom: 18, fontSize: 13, lineHeight: 20 },
//   balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   label: { fontSize: 12, fontWeight: '700' },
//   balance: { marginTop: 5, fontSize: 26, fontWeight: '900' },
//   balanceIcon: { width: 58, height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
//   rechargeRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
//   rechargeInputRow: { marginTop: 16 }
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import Badge from "../components/Badge";
import Card from "../components/Card";
import Screen from "../components/Screen";
import SectionHeader from "../components/SectionHeader";
import TransactionRow from "../components/TransactionRow";
import { radius, themeTokens } from "../constants/theme";
import { paymentApi } from "../services/api/payment";
import { useAppStore } from "../store/UseAppStore";
import { formatINR } from "../utils/format";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const TX_FILTERS = [
  { id: "all", label: "All" },
  { id: "credit", label: "Credit" },
  { id: "debit", label: "Debit" },
];

const MIN_RECHARGE = 100;
const MAX_RECHARGE = 25000;

function MockPhonePeModal({ visible, onClose, onSuccess, amount, colors }) {
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  if (!visible) return null;

  return (
    <View style={s.modalOverlay}>
      <View
        style={[s.mockPhonePeContainer, { backgroundColor: colors.surface }]}
      >
        <View style={s.mockHeader}>
          <MaterialCommunityIcons
            name="shield-check"
            size={24}
            color="#6739B7"
          />
          <Text style={s.mockTitle}>PhonePe (Test Mode)</Text>
        </View>

        <View style={s.mockContent}>
          <Text style={[s.mockLabel, { color: colors.textSoft }]}>
            Recharging Wallet
          </Text>
          <Text style={[s.mockMerchant, { color: colors.text }]}>
            Rambhaji 
          </Text>
          <Text style={[s.mockAmount, { color: colors.text }]}>
            {formatINR(amount)}
          </Text>

          <Text style={[s.mockNote, { color: colors.textSoft }]}>
            This is a dummy payment gateway for testing purposes. No real money
            will be deducted.
          </Text>
        </View>

        <AppButton
          title={processing ? "Processing..." : `Pay ${formatINR(amount)}`}
          loading={processing}
          onPress={handlePay}
          style={{ backgroundColor: "#6739B7", marginTop: 20 }}
        />
        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={onClose}
          disabled={processing}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

export default function WalletScreen({ navigation }) {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const balance = useAppStore((s) => s.walletBalance);
  const recharge = useAppStore((s) => s.rechargeWallet);

  const [amount, setAmount] = useState("1000");
  const [amountError, setAmountError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [autoDeduct, setAutoDeduct] = useState(true);
  const [txFilter, setTxFilter] = useState("all");

  // Mock PhonePe state
  const [mockPhonePeVisible, setMockPhonePeVisible] = useState(false);
  const [currentTxnId, setCurrentTxnId] = useState(null);
  const [currentRechargeAmount, setCurrentRechargeAmount] = useState(0);

  const border = colors.border ?? "rgba(0,0,0,0.08)";
  const chipBg = colors.surfaceSoft ?? "rgba(0,0,0,0.04)";
  const danger = colors.danger ?? "#EF4444";
  const success = colors.success ?? "#16A34A";

  const [serverTransactions, setServerTransactions] = useState([]);

  useEffect(() => {
    const { walletApi } = require("../services/api/wallet");
    walletApi
      .getWalletBalance()
      .then((res) => {
        if (res.success && res.wallet_balance !== undefined) {
          useAppStore
            .getState()
            .setWallet(res.wallet_balance, res.due_amount || 0);
        }
      })
      .catch((e) => console.warn("Fetch balance failed", e));

    // Refresh transaction list
    walletApi
      .getTransactionHistory()
      .then((res) => {
        if (res.success)
          setServerTransactions(res.transactions || res.data || []);
      })
      .catch((e) => console.warn("Fetch transactions failed", e));
  }, []);

  const filteredTransactions = useMemo(() => {
    const dataToUse = serverTransactions;
    if (txFilter === "all") return dataToUse;
    return dataToUse.filter((t) => (t.type ?? "").toLowerCase() === txFilter);
  }, [txFilter, serverTransactions]);

  function handleQuickAmount(value) {
    setAmount(String(value));
    setAmountError(null);
  }

  async function completeRecharge() {
    setMockPhonePeVisible(false);
    try {
      const statusRes = await paymentApi.checkPaymentStatus(currentTxnId);

      if (statusRes.success && statusRes.status === "success") {
        const { walletApi } = require("../services/api/wallet");
        const walletRes = await walletApi.getTransactionHistory();

        useAppStore
          .getState()
          .setWallet(
            useAppStore.getState().walletBalance + currentRechargeAmount,
            useAppStore.getState().dueAmount || 0,
          );

        setSuccessMsg(
          `${formatINR(currentRechargeAmount)} added to wallet successfully!`,
        );
        setTimeout(() => setSuccessMsg(null), 3000);

        if (walletRes.success) {
          setServerTransactions(walletRes.transactions || walletRes.data || []);
        }
      } else {
        Alert.alert(
          "Payment Pending/Failed",
          statusRes.message || "Your payment could not be verified.",
        );
      }
    } catch (e) {
      console.warn("Recharge verification error:", e);
      Alert.alert("Recharge failed", "Could not verify payment.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRecharge() {
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value < MIN_RECHARGE) {
      setAmountError(`Minimum recharge amount is ${formatINR(MIN_RECHARGE)}`);
      return;
    }
    if (value > MAX_RECHARGE) {
      setAmountError(`Maximum recharge amount is ${formatINR(MAX_RECHARGE)}`);
      return;
    }
    setAmountError(null);
    setProcessing(true);
    try {
      // 1. Initiate PhonePe Payment
      const initiateRes = await paymentApi.initiatePhonePe({
        type: "wallet",
        amount: value,
        redirectUrl: "http://localhost:8081"
      });

      if (initiateRes.success) {
        console.log("Initiate Response:", initiateRes);
        let txnId = "dummy_txn_123";
        
        if (initiateRes.txnId || initiateRes.transactionId || initiateRes.merchantTransactionId || initiateRes.data?.merchantTransactionId) {
          txnId = initiateRes.txnId || initiateRes.transactionId || initiateRes.merchantTransactionId || initiateRes.data?.merchantTransactionId;
        } else if (initiateRes.redirectUrl && initiateRes.redirectUrl.includes("txnId=")) {
          const match = initiateRes.redirectUrl.match(/txnId=([^&]+)/);
          if (match) txnId = match[1];
        }
        setCurrentTxnId(txnId);
        setCurrentRechargeAmount(value);
        setMockPhonePeVisible(true);
      } else {
        Alert.alert("Initiate Failed", "Could not initiate PhonePe payment.");
        setProcessing(false);
      }
    } catch (e) {
      console.warn("Recharge error:", e);
      Alert.alert(
        "Recharge failed",
        e?.response?.data?.message || "Something went wrong.",
      );
      setProcessing(false);
    }
  }

  return (
    <Screen>
      <View style={s.headerRow}>
        <View style={[s.heroIcon, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={26}
            color="#fff"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Wallet</Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            Recharge, auto-deduction, and transaction history.
          </Text>
        </View>
      </View>

      <Card>
        <View style={s.balanceRow}>
          <View style={{ flex: 1 }}>
            <View style={s.balanceLabelRow}>
              <Text style={[s.label, { color: colors.textSoft }]}>
                Available balance
              </Text>
              <Pressable
                onPress={() => setBalanceHidden((v) => !v)}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name={balanceHidden ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
            <Text style={[s.balance, { color: colors.text }]}>
              {balanceHidden ? "₹ ••••••" : formatINR(balance)}
            </Text>
            <View style={s.autoPayPill}>
              <View
                style={[
                  s.statusDot,
                  { backgroundColor: autoDeduct ? success : colors.textMuted },
                ]}
              />
              <Text style={[s.autoPayText, { color: colors.textMuted }]}>
                Auto-deduction {autoDeduct ? "on" : "off"}
              </Text>
            </View>
          </View>
          <View
            style={[s.balanceIcon, { backgroundColor: colors.primarySoft }]}
          >
            <MaterialCommunityIcons
              name="wallet"
              size={28}
              color={colors.primary}
            />
          </View>
        </View>

        {/* <Text style={[s.fieldLabel, { color: colors.text }]}>Quick recharge</Text> */}
        {/* <View style={s.rechargeRow}>
          {QUICK_AMOUNTS.map((value) => {
            const selected = amount === String(value);
            return (
              <Pressable
                key={value}
                onPress={() => handleQuickAmount(value)}
                style={({ pressed }) => [
                  s.amountChip,
                  {
                    backgroundColor: selected ? colors.primary : chipBg,
                    borderColor: selected ? colors.primary : border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[s.amountChipText, { color: selected ? '#fff' : colors.text }]}>
                  ₹{value.toLocaleString('en-IN')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.rechargeInputRow}>
          <Input
            label="Custom recharge amount"
            value={amount}
            onChangeText={(v) => {
              setAmount(v.replace(/[^0-9]/g, ''));
              if (amountError) setAmountError(null);
            }}
            keyboardType="number-pad"
            placeholder="Enter amount"
          />
        </View>
        {!!amountError && (
          <Text style={[s.errorText, { color: danger }]}>{amountError}</Text>
        )}
        {!!successMsg && (
          <View style={s.successRow}>
            <MaterialCommunityIcons name="check-circle" size={15} color={success} />
            <Text style={[s.successText, { color: success }]}>{successMsg}</Text>
          </View>
        )}

        <AppButton
          title={
            processing && !mockPhonePeVisible ? "Processing…" : `Recharge ₹${amount || 0}`
          }
          onPress={handleRecharge}
          disabled={processing}
        /> */}
      </Card>

      <MockPhonePeModal
        visible={mockPhonePeVisible}
        onClose={() => {
          setMockPhonePeVisible(false);
          setProcessing(false);
        }}
        onSuccess={completeRecharge}
        amount={currentRechargeAmount}
        colors={colors}
      />

      {/* <Card>
        <SectionHeader
          title="Auto deduction"
          subtitle="Delivery success triggers planned wallet deduction."
        />
        <View style={[s.autoRow, { borderColor: border }]}>
          <MaterialCommunityIcons
            name="autorenew"
            size={18}
            color={colors.textSoft}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[s.autoTitle, { color: colors.text }]}>
              Enable auto-deduction on delivery
            </Text>
            <Text style={[s.autoSub, { color: colors.textMuted }]}>
              Charges your wallet automatically when an order is delivered.
            </Text>
          </View>
          <Switch
            value={autoDeduct}
            onValueChange={setAutoDeduct}
            trackColor={{ false: border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        <Badge label="Insufficient balance → notify user" tone="danger" />
      </Card> */}

      <Card>
        <SectionHeader
          title="Transactions"
          actionLabel="View all"
          onAction={() => navigation.navigate("Notifications")}
        />

        <View style={s.filterRow}>
          {TX_FILTERS.map((f) => {
            const selected = txFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setTxFilter(f.id)}
                style={({ pressed }) => [
                  s.filterChip,
                  {
                    backgroundColor: selected ? colors.primary : chipBg,
                    borderColor: selected ? colors.primary : border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    s.filterChipText,
                    { color: selected ? "#fff" : colors.textSoft },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={26}
              color={colors.textMuted}
            />
            <Text style={[s.emptyText, { color: colors.textMuted }]}>
              No {txFilter !== "all" ? txFilter : ""} transactions yet.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((item) => (
            <TransactionRow key={item.id} item={item} />
          ))
        )}
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius?.lg ?? 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "900" },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 2 },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  balanceLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 12, fontWeight: "700" },
  balance: { marginTop: 5, fontSize: 28, fontWeight: "900" },
  balanceIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  autoPayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 99 },
  autoPayText: { fontSize: 11, fontWeight: "600" },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
  },
  rechargeRow: { flexDirection: "row", gap: 8 },
  amountChip: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    paddingVertical: 10,
  },
  amountChipText: { fontSize: 13, fontWeight: "700" },

  rechargeInputRow: { marginTop: 16 },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: -8,
    marginBottom: 10,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  successText: { fontSize: 12, fontWeight: "700" },

  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    padding: 12,
    marginBottom: 14,
  },
  autoTitle: { fontSize: 14, fontWeight: "700" },
  autoSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  filterChipText: { fontSize: 12, fontWeight: "700" },

  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13 },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    zIndex: 100,
  },
  mockPhonePeContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    alignSelf: "center",
  },
  mockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  mockTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6739B7",
  },
  mockContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  mockLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  mockMerchant: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 16,
  },
  mockAmount: {
    fontSize: 42,
    fontWeight: "900",
    marginBottom: 24,
  },
  mockNote: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
