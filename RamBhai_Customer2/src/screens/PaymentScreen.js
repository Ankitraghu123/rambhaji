import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { paymentApi } from '../services/api/payment';
import { formatINR } from '../utils/format';

/**
 * PaymentScreen now supports two flows:
 * 
 * 1. PhonePe flow (new spec): Receives `redirectUrl` and/or `txnId` in route params.
 *    Opens the redirect URL in an in-app browser, then polls payment status.
 * 
 * 2. Direct initiation: Receives payment `data` (type, package_id, etc.) in route params.
 *    Calls the PhonePe initiate endpoint first, then opens the redirect URL.
 * 
 * Route params:
 *   - redirectUrl (string, optional): PhonePe redirect URL to open directly
 *   - txnId (string, optional): Transaction ID for status checking
 *   - amount (number, optional): Display amount
 *   - type (string, optional): 'package' | 'retail' | 'wallet'
 *   - data (object, optional): Payment initiation data for PhonePe
 */
export default function PaymentScreen({ navigation, route }) {
  const { redirectUrl, txnId, amount, type, data } = route.params || {};
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'failed' | 'pending'
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];

  // If we have a redirectUrl, open the browser automatically
  useEffect(() => {
    if (redirectUrl) {
      openPaymentBrowser(redirectUrl);
    }
  }, [redirectUrl]);

  async function openPaymentBrowser(url) {
    try {
      setProcessing(true);
      setStatusMsg('Opening payment gateway...');
      await WebBrowser.openBrowserAsync(url);
      // After returning from browser, check status if we have a txnId
      if (txnId) {
        await checkStatus(txnId);
      } else {
        setProcessing(false);
        setStatusMsg('Payment browser closed. Please check your payment status.');
      }
    } catch (e) {
      setProcessing(false);
      setStatusMsg(null);
      Alert.alert('Error', 'Could not open payment gateway');
    }
  }

  async function checkStatus(transactionId) {
    setStatusMsg('Verifying payment...');
    try {
      const res = await paymentApi.checkPaymentStatus(transactionId);
      setProcessing(false);
      if (res.success) {
        setPaymentStatus(res.status);
        if (res.status === 'success') {
          setStatusMsg('Payment successful!');
        } else if (res.status === 'pending') {
          setStatusMsg('Payment is still processing. Please wait...');
        } else {
          setStatusMsg(res.message || 'Payment failed');
        }
      } else {
        setStatusMsg(res.message || 'Could not verify payment');
      }
    } catch (e) {
      setProcessing(false);
      setStatusMsg('Could not verify payment status');
    }
  }

  async function handleInitiatePayment() {
    if (data) {
      // Initiate a new PhonePe payment
      setProcessing(true);
      try {
        const res = await paymentApi.initiatePhonePe(data);
        if (res.success && res.redirectUrl) {
          // Extract txnId from the redirect URL if possible
          const urlTxnId = res.txnId || extractTxnId(res.redirectUrl);
          navigation.setParams({ txnId: urlTxnId });
          await openPaymentBrowser(res.redirectUrl);
        } else {
          setProcessing(false);
          Alert.alert('Error', res.message || 'Failed to initiate payment');
        }
      } catch (e) {
        setProcessing(false);
        Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to initiate payment');
      }
    } else if (redirectUrl) {
      await openPaymentBrowser(redirectUrl);
    }
  }

  function extractTxnId(url) {
    // Try to extract transaction ID from PhonePe redirect URL
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('txnId') || urlObj.searchParams.get('transactionId') || null;
    } catch {
      return null;
    }
  }

  function handleDone() {
    if (paymentStatus === 'success') {
      if (type === 'wallet') {
        navigation.replace('Wallet');
      } else {
        navigation.navigate('MainTabs');
      }
    } else {
      navigation.goBack();
    }
  }

  const statusIcon = paymentStatus === 'success' ? 'check-circle' 
    : paymentStatus === 'failed' ? 'close-circle' 
    : 'credit-card-outline';

  const statusColor = paymentStatus === 'success' ? (colors.success || '#16A34A')
    : paymentStatus === 'failed' ? (colors.danger || '#EF4444')
    : colors.primary;

  return (
    <Screen>
      <View style={s.container}>
        <Card style={s.card}>
          <View style={[s.iconWrap, { backgroundColor: paymentStatus ? `${statusColor}15` : colors.primarySoft }]}>
            <MaterialCommunityIcons name={statusIcon} size={48} color={statusColor} />
          </View>
          <Text style={[s.title, { color: colors.text }]}>
            {paymentStatus === 'success' ? 'Payment Successful' 
              : paymentStatus === 'failed' ? 'Payment Failed'
              : 'PhonePe Payment'}
          </Text>
          <Text style={[s.sub, { color: colors.textSoft }]}>
            {statusMsg || 'Tap the button below to proceed with payment via PhonePe.'}
          </Text>

          {amount ? (
            <View style={[s.details, { borderColor: colors.border, backgroundColor: colors.surfaceSoft }]}>
              {txnId ? (
                <View style={s.detailRow}>
                  <Text style={[s.detailLabel, { color: colors.textSoft }]}>Transaction ID:</Text>
                  <Text style={[s.detailValue, { color: colors.text }]} numberOfLines={1}>{txnId}</Text>
                </View>
              ) : null}
              <View style={s.detailRow}>
                <Text style={[s.detailLabel, { color: colors.textSoft }]}>Amount:</Text>
                <Text style={[s.detailValue, { color: colors.text, fontSize: 18, fontWeight: '900' }]}>
                  {formatINR(amount)}
                </Text>
              </View>
            </View>
          ) : null}

          {processing ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : paymentStatus ? (
            <>
              <AppButton
                title="Done"
                onPress={handleDone}
                style={s.payBtn}
              />
              {paymentStatus === 'pending' && (
                <AppButton
                  title="Check Status Again"
                  onPress={() => txnId && checkStatus(txnId)}
                  variant="secondary"
                  style={s.cancelBtn}
                />
              )}
            </>
          ) : (
            <>
              <AppButton
                title="Pay with PhonePe"
                onPress={handleInitiatePayment}
                loading={processing}
                disabled={processing}
                style={s.payBtn}
              />
              <AppButton
                title="Cancel"
                onPress={() => navigation.goBack()}
                disabled={processing}
                variant="secondary"
                style={s.cancelBtn}
              />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: radius?.xl ?? 24,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  details: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius?.md ?? 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: '60%',
  },
  payBtn: {
    width: '100%',
  },
  cancelBtn: {
    width: '100%',
    marginTop: 12,
  }
});
