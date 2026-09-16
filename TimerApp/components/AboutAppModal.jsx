import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../src/utils/responsive';
import { ThemeColors, Shadows } from '../constants/theme';
import { APP_INFO } from '../constants/appConfig';

/**
 * AboutAppModal Component
 * Displays professional application branding, dynamic version information,
 * developer credentials, and engine specifications.
 */
export default function AboutAppModal({ visible, onClose }) {
    const { insets, isLandscape, isTablet, modalMaxWidth, scaleFont } = useResponsive();
    const isDialog = isTablet || isLandscape;

    return (
        <Modal
            visible={visible}
            animationType={isDialog ? "fade" : "slide"}
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.overlay, isDialog && styles.overlayDialog]}>
                <View style={[
                    styles.container,
                    isDialog && styles.containerDialog,
                    { maxWidth: modalMaxWidth, paddingBottom: Math.max(insets.bottom, 14) }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={[styles.headerTitle, { fontSize: scaleFont(19) }]} numberOfLines={1}>
                                About App
                            </Text>
                            <Text style={[styles.headerSubtitle, { fontSize: scaleFont(12) }]} numberOfLines={1}>
                                Application Information & Credentials
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close" size={20} color="#475569" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        bounces={true}
                    >
                        {/* Hero Brand Section */}
                        <View style={styles.heroCard}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../assets/images/icon.png')}
                                    style={styles.appIcon}
                                    resizeMode="cover"
                                />
                            </View>

                            <Text style={[styles.appName, { fontSize: scaleFont(22) }]}>
                                {APP_INFO.name}
                            </Text>

                            <View style={styles.versionBadge}>
                                <Text style={[styles.versionBadgeText, { fontSize: scaleFont(12) }]}>
                                    {APP_INFO.displayVersion}
                                </Text>
                            </View>

                            <Text style={[styles.developerTag, { fontSize: scaleFont(13) }]}>
                                Developed by {APP_INFO.developer}
                            </Text>

                            <Text style={[styles.heroDescription, { fontSize: scaleFont(12) }]}>
                                High-precision multi-stage kitchen timer and shift execution system with background wake alarms.
                            </Text>
                        </View>

                        {/* App Specifications Card */}
                        <View style={styles.infoCard}>
                            <Text style={[styles.sectionTitle, { fontSize: scaleFont(13) }]}>
                                SYSTEM SPECIFICATIONS
                            </Text>

                            <View style={styles.specRow}>
                                <Text style={[styles.specKey, { fontSize: scaleFont(13) }]}>Application Name</Text>
                                <Text style={[styles.specValue, { fontSize: scaleFont(13) }]}>{APP_INFO.name}</Text>
                            </View>

                            <View style={styles.specRow}>
                                <Text style={[styles.specKey, { fontSize: scaleFont(13) }]}>Software Release</Text>
                                <Text style={[styles.specValue, { fontSize: scaleFont(13), color: ThemeColors.royalBlue, fontWeight: '700' }]}>
                                    v{APP_INFO.version} ({APP_INFO.releaseName})
                                </Text>
                            </View>

                            <View style={styles.specRow}>
                                <Text style={[styles.specKey, { fontSize: scaleFont(13) }]}>Lead Developer</Text>
                                <Text style={[styles.specValue, { fontSize: scaleFont(13), color: '#0F172A', fontWeight: '700' }]}>
                                    {APP_INFO.developer}
                                </Text>
                            </View>

                            <View style={styles.specRow}>
                                <Text style={[styles.specKey, { fontSize: scaleFont(13) }]}>Alarm Engine</Text>
                                <Text style={[styles.specValue, { fontSize: scaleFont(13) }]}>
                                    Exact AlarmManager Clock
                                </Text>
                            </View>

                            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.specKey, { fontSize: scaleFont(13) }]}>Platform Environment</Text>
                                <Text style={[styles.specValue, { fontSize: scaleFont(13) }]}>
                                    {Platform.OS === 'ios' ? 'Apple iOS' : 'Google Android'}
                                </Text>
                            </View>
                        </View>

                        {/* Engineering Highlights Card */}
                        <View style={styles.featureCard}>
                            <View style={styles.featureHeader}>
                                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" style={{ marginRight: 6 }} />
                                <Text style={[styles.featureTitle, { fontSize: scaleFont(13) }]}>
                                    PRODUCTION GRADE RELIABILITY
                                </Text>
                            </View>
                            <Text style={[styles.featureBody, { fontSize: scaleFont(12) }]}>
                                Built specifically for high-intensity commercial food preparation environments. Features persistent alarm state caching, zero countdown drift, full lock-screen wake capability, and multi-user synchronized workstation tasks.
                            </Text>
                        </View>

                        {/* Copyright / Legal */}
                        <View style={styles.legalSection}>
                            <Text style={[styles.legalText, { fontSize: scaleFont(11) }]}>
                                © {new Date().getFullYear()} {APP_INFO.developer}. All rights reserved.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={onClose}
                            activeOpacity={0.88}
                        >
                            <Text style={[styles.doneBtnText, { fontSize: scaleFont(15) }]}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'flex-end',
    },
    overlayDialog: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '90%',
        paddingTop: 20,
        ...Shadows.modal,
    },
    containerDialog: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        alignSelf: 'center',
        width: '100%',
        maxHeight: '88%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flex: 1,
        minWidth: 0,
        paddingRight: 10,
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#0F172A',
    },
    headerSubtitle: {
        color: '#64748B',
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        paddingBottom: 24,
    },
    heroCard: {
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingVertical: 22,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Shadows.card,
        overflow: 'hidden',
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    appName: {
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    versionBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CCD2FC',
        marginTop: 8,
        marginBottom: 6,
    },
    versionBadgeText: {
        fontWeight: '800',
        color: ThemeColors.royalBlue,
        letterSpacing: 0.3,
    },
    developerTag: {
        fontWeight: '700',
        color: '#475569',
        marginTop: 2,
    },
    heroDescription: {
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 10,
        paddingHorizontal: 10,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
        ...Shadows.card,
    },
    sectionTitle: {
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    specKey: {
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    specValue: {
        color: '#0F172A',
        fontWeight: '600',
        textAlign: 'right',
        flexShrink: 0,
    },
    featureCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        padding: 14,
        marginBottom: 16,
    },
    featureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    featureTitle: {
        fontWeight: '800',
        color: '#166534',
        letterSpacing: 0.5,
    },
    featureBody: {
        color: '#15803D',
        lineHeight: 18,
    },
    legalSection: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    legalText: {
        color: '#94A3B8',
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    doneBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
