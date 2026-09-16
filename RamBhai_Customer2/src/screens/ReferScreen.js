import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Share, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/UseAppStore';
import { themeTokens, radius } from '../constants/theme';
import Screen from '../components/Screen';
import ThemeHeader from '../components/ThemeHeader';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { referralApi } from '../services/api/referral';
import AppButton from '../components/AppButton';

export default function ReferScreen() {
  const mode = useAppStore((s) => s.themeMode);
  const colors = themeTokens[mode];
  const [code, setCode] = useState('');
  const [freeServings, setFreeServings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        const res = await referralApi.getMyCode();
        if (res.referral_code) {
          setCode(res.referral_code);
          if (res.total_free_servings !== undefined) {
            setFreeServings(res.total_free_servings);
          }
        } else {
          setCode('REF-' + Math.floor(1000 + Math.random() * 9000));
        }
      } catch (err) {
        console.log('Error fetching referral code:', err);
        setCode('FRESH-2026'); // Fallback in case of error
      } finally {
        setLoading(false);
      }
    };
    fetchReferralCode();
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Ram Bhaji with my referral code: ${code}\nInstall the app to get fresh veggies and free deliveries!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <Screen>
      <ThemeHeader
        title="Refer & Earn"
        subtitle="Share the freshness and get rewarded with free deliveries!"
        icon="gift-outline"
        badge="Rewards"
        compact
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card style={{ backgroundColor: colors.primary, marginTop: 10 }}>
          <View style={s.codeContainer}>
            <Text style={s.codeLabel}>Your Referral Code</Text>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 10 }} />
            ) : (
              <Pressable onPress={handleCopy} style={s.codeBox}>
                <Text style={[s.code, { color: colors.primary }]}>{code}</Text>
                <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} style={s.copyIcon} />
              </Pressable>
            )}
            
            {copied && (
              <Text style={s.copiedText}>✓ Code copied to clipboard!</Text>
            )}
            
            {freeServings > 0 && (
              <View style={[s.servingsBadge, { backgroundColor: colors.success + '20' }]}>
                <MaterialCommunityIcons name="star-circle" size={16} color={colors.success} />
                <Text style={[s.servingsText, { color: colors.success }]}>
                  You have {freeServings} free serving{freeServings > 1 ? 's' : ''} available!
                </Text>
              </View>
            )}
            
            <Text style={s.codeMessage}>Share this code with friends and family to unlock rewards.</Text>
            <AppButton
              title="Share Code"
              onPress={handleShare}
              style={s.shareButton}
              variant="secondary"
            />
          </View>
        </Card>

        <SectionHeader title="How it works" subtitle="Rules & Rewards" />

        <Card>
          <View style={s.ruleRow}>
            <View style={[s.iconBox, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialCommunityIcons name="truck-fast-outline" size={24} color={colors.primary} />
            </View>
            <View style={s.ruleTextContainer}>
              <Text style={[s.ruleTitle, { color: colors.text }]}>Free Deliveries</Text>
              <Text style={[s.ruleDesc, { color: colors.textSoft }]}>
                Get maximum 3 free deliveries in a month when you share through the referral to 3 people. 1 free delivery for 1 referral.
              </Text>
            </View>
          </View>

          <View style={s.ruleRow}>
            <View style={[s.iconBox, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialCommunityIcons name="basket-outline" size={24} color={colors.primary} />
            </View>
            <View style={s.ruleTextContainer}>
              <Text style={[s.ruleTitle, { color: colors.text }]}>Valid on Plans</Text>
              <Text style={[s.ruleDesc, { color: colors.textSoft }]}>
                The referred person must buy a plan or package for the referral to be successful.
              </Text>
            </View>
          </View>

          <View style={s.ruleRow}>
            <View style={[s.iconBox, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={s.ruleTextContainer}>
              <Text style={[s.ruleTitle, { color: colors.text }]}>Reward Addition</Text>
              <Text style={[s.ruleDesc, { color: colors.textSoft }]}>
                Free servings will be added to the package which you bought first. Note: Not applicable to water packages.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  codeContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius?.md ?? 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  code: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  copyIcon: {
    opacity: 0.7,
  },
  copiedText: {
    color: '#A7F3D0', // light green
    fontSize: 14,
    fontWeight: '700',
    marginTop: -8,
    marginBottom: 16,
  },
  servingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 14,
  },
  servingsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  codeMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  shareButton: {
    width: '80%',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius?.md ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: 13,
    lineHeight: 20,
  }
});
