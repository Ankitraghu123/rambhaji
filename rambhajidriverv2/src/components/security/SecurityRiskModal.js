// src/components/security/SecurityRiskModal.js
// 3-Color Signature UI Security & Fraud Risk Modal

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../common/Motion';
import { s, vs, ms } from '../../core/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SecurityRiskModal({ visible, alert, onClose }) {
  if (!visible || !alert) return null;

  const isHighRisk = alert.level === 'HIGH' || alert.level === 'CRITICAL';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        onClose && onClose();
      }}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={isHighRisk ? ['#DC2626', '#E024E3', '#1D4ED8'] : ['#1D4ED8', '#00B4D8', '#E024E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.innerCard}>
            {/* Header Icon */}
            <View style={[styles.iconCircle, { borderColor: isHighRisk ? '#EF4444' : '#00B4D8' }]}>
              <LinearGradient
                colors={isHighRisk ? ['#EF4444', '#DC2626'] : ['#00B4D8', '#1D4ED8']}
                style={styles.iconGradient}
              >
                <MaterialCommunityIcons
                  name={isHighRisk ? 'shield-alert' : 'shield-check'}
                  size={ms(34)}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>

            {/* Title & Subtitle */}
            <Text style={[styles.title, { color: isHighRisk ? '#DC2626' : '#1D4ED8' }]}>
              {alert.title || 'Security Protection Notice'}
            </Text>
            <Text style={styles.message}>{alert.message || 'Suspicious activity detected. Session has been secured.'}</Text>

            {/* Alert Level Pill */}
            <View
              style={[
                styles.levelPill,
                {
                  backgroundColor: isHighRisk ? '#FEF2F2' : '#F0F9FF',
                  borderColor: isHighRisk ? '#FCA5A5' : '#BAE6FD',
                },
              ]}
            >
              <Ionicons
                name={isHighRisk ? 'warning' : 'information-circle'}
                size={ms(14)}
                color={isHighRisk ? '#DC2626' : '#0284C7'}
              />
              <Text
                style={[
                  styles.levelText,
                  { color: isHighRisk ? '#DC2626' : '#0284C7' },
                ]}
              >
                SECURITY STATUS: {alert.level || 'WARNING'}
              </Text>
            </View>

            {/* Acknowledge Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                triggerHaptic('medium');
                onClose && onClose();
              }}
              style={styles.btnShadow}
            >
              <LinearGradient
                colors={isHighRisk ? ['#DC2626', '#E024E3'] : ['#1D4ED8', '#00B4D8', '#E024E3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>ACKNOWLEDGE & SECURE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  gradientCard: {
    width: '100%',
    maxWidth: s(360),
    borderRadius: s(26),
    padding: 2.5,
    elevation: 16,
    shadowColor: '#E024E3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: s(20),
  },
  innerCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: s(23.5),
    padding: s(22),
    alignItems: 'center',
  },
  iconCircle: {
    width: ms(66),
    height: ms(66),
    borderRadius: ms(33),
    padding: 2.5,
    borderWidth: 2,
    marginBottom: vs(12),
  },
  iconGradient: {
    flex: 1,
    borderRadius: ms(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: ms(19),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: vs(6),
  },
  message: {
    fontSize: ms(12),
    color: '#475569',
    textAlign: 'center',
    lineHeight: vs(17),
    fontWeight: '600',
    marginBottom: vs(14),
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: s(14),
    borderWidth: 1,
    marginBottom: vs(18),
  },
  levelText: {
    fontSize: ms(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnShadow: {
    width: '100%',
    borderRadius: s(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#E024E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: s(8),
  },
  btnGradient: {
    height: vs(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: ms(13),
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
