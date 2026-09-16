import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    BackHandler,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../src/utils/responsive';
import { ThemeColors, Shadows } from '../constants/theme';
import {
    PRIVACY_POLICY_SECTIONS,
    TERMS_OF_SERVICE_SECTIONS,
    OPEN_SOURCE_LICENSES,
} from '../constants/legalData';

/**
 * PrivacyLegalModal Component
 * Provides a clean, multi-view legal browser for Privacy Policy,
 * Terms of Service, and Open-Source Licenses.
 */
export default function PrivacyLegalModal({ visible, onClose }) {
    const { insets, isLandscape, isTablet, modalMaxWidth, scaleFont } = useResponsive();
    const isDialog = isTablet || isLandscape;

    // View state: 'menu' | 'privacy' | 'terms' | 'licenses'
    const [currentView, setCurrentView] = useState('menu');
    const [licenseSearch, setLicenseSearch] = useState('');
    const [expandedLicense, setExpandedLicense] = useState(null);

    // Reset view to menu when modal opens/closes
    useEffect(() => {
        if (visible) {
            setCurrentView('menu');
            setLicenseSearch('');
            setExpandedLicense(null);
        }
    }, [visible]);

    // Hardware back press handler
    useEffect(() => {
        if (!visible) return;

        const onBackPress = () => {
            if (currentView !== 'menu') {
                setCurrentView('menu');
                return true;
            }
            onClose();
            return true;
        };

        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
    }, [visible, currentView, onClose]);

    // Filtered licenses
    const filteredLicenses = useMemo(() => {
        if (!licenseSearch.trim()) return OPEN_SOURCE_LICENSES;
        const q = licenseSearch.toLowerCase().trim();
        return OPEN_SOURCE_LICENSES.filter(
            (l) =>
                l.name.toLowerCase().includes(q) ||
                l.license.toLowerCase().includes(q) ||
                l.description.toLowerCase().includes(q)
        );
    }, [licenseSearch]);

    // Render Menu Screen
    const renderMenuView = () => (
        <View style={styles.menuContainer}>
            <View style={styles.menuHero}>
                <View style={styles.menuHeroIconCircle}>
                    <Ionicons name="shield-checkmark" size={32} color={ThemeColors.royalBlue} />
                </View>
                <Text style={[styles.menuHeroTitle, { fontSize: scaleFont(18) }]}>
                    Privacy & Legal Center
                </Text>
                <Text style={[styles.menuHeroSubtitle, { fontSize: scaleFont(12) }]}>
                    Review operational policies, user responsibilities, and third-party software credits.
                </Text>
            </View>

            {/* Menu Options */}
            <View style={styles.menuList}>
                {/* 1. Privacy Policy */}
                <TouchableOpacity
                    style={styles.menuOptionCard}
                    onPress={() => setCurrentView('privacy')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.optionIconCircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                        <Ionicons name="lock-closed-outline" size={20} color="#059669" />
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={[styles.optionTitle, { fontSize: scaleFont(15) }]}>Privacy Policy</Text>
                        <Text style={[styles.optionSub, { fontSize: scaleFont(12) }]}>
                            Data storage, alarm permissions, and zero tracking policy
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* 2. Terms of Service */}
                <TouchableOpacity
                    style={styles.menuOptionCard}
                    onPress={() => setCurrentView('terms')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.optionIconCircle, { backgroundColor: '#EEF2FF', borderColor: '#CCD2FC' }]}>
                        <Ionicons name="document-text-outline" size={20} color={ThemeColors.royalBlue} />
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={[styles.optionTitle, { fontSize: scaleFont(15) }]}>Terms of Service</Text>
                        <Text style={[styles.optionSub, { fontSize: scaleFont(12) }]}>
                            Permitted use, operator duties, and timing advisory terms
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* 3. Open-Source Licenses */}
                <TouchableOpacity
                    style={styles.menuOptionCard}
                    onPress={() => setCurrentView('licenses')}
                    activeOpacity={0.8}
                >
                    <View style={[styles.optionIconCircle, { backgroundColor: '#FDF0FF', borderColor: '#F5B8FC' }]}>
                        <Ionicons name="code-slash-outline" size={20} color="#EA33FF" />
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={[styles.optionTitle, { fontSize: scaleFont(15) }]}>Open-Source Licenses</Text>
                        <Text style={[styles.optionSub, { fontSize: scaleFont(12) }]}>
                            Software credits and licenses for {OPEN_SOURCE_LICENSES.length} installed libraries
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render Privacy Policy Screen
    const renderPrivacyView = () => (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.textScrollContent} showsVerticalScrollIndicator={true}>
            <View style={styles.legalNoticeBanner}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.legalNoticeText}>Effective Date: September 2026 • Verified Production Policy</Text>
            </View>

            {PRIVACY_POLICY_SECTIONS.map((sec, idx) => (
                <View key={idx} style={styles.legalSection}>
                    <Text style={[styles.legalSectionTitle, { fontSize: scaleFont(14) }]}>{sec.title}</Text>
                    <Text style={[styles.legalSectionBody, { fontSize: scaleFont(13) }]}>{sec.content}</Text>
                </View>
            ))}
        </ScrollView>
    );

    // Render Terms of Service Screen
    const renderTermsView = () => (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.textScrollContent} showsVerticalScrollIndicator={true}>
            <View style={[styles.legalNoticeBanner, { backgroundColor: '#EEF2FF', borderColor: '#CCD2FC' }]}>
                <Ionicons name="information-circle-outline" size={16} color={ThemeColors.royalBlue} style={{ marginRight: 6 }} />
                <Text style={[styles.legalNoticeText, { color: ThemeColors.royalBlue }]}>
                    Effective Date: September 2026 • Commercial Production Terms
                </Text>
            </View>

            {TERMS_OF_SERVICE_SECTIONS.map((sec, idx) => (
                <View key={idx} style={styles.legalSection}>
                    <Text style={[styles.legalSectionTitle, { fontSize: scaleFont(14) }]}>{sec.title}</Text>
                    <Text style={[styles.legalSectionBody, { fontSize: scaleFont(13) }]}>{sec.content}</Text>
                </View>
            ))}
        </ScrollView>
    );

    // Render Open-Source Licenses Screen
    const renderLicensesView = () => (
        <View style={styles.licensesContainer}>
            {/* Search filter for licenses */}
            <View style={styles.licenseSearchWrapper}>
                <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <TextInput
                    style={styles.licenseSearchInput}
                    placeholder="Search installed libraries..."
                    placeholderTextColor="#94A3B8"
                    value={licenseSearch}
                    onChangeText={setLicenseSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {licenseSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setLicenseSearch('')}>
                        <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.licensesScrollContent} showsVerticalScrollIndicator={true}>
                {filteredLicenses.length === 0 ? (
                    <Text style={styles.noLicensesText}>No matching library found.</Text>
                ) : (
                    filteredLicenses.map((lib) => {
                        const isExpanded = expandedLicense === lib.name;
                        return (
                            <View key={lib.name} style={styles.licenseCard}>
                                <View style={styles.licenseCardHeader}>
                                    <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                                        <Text style={[styles.libName, { fontSize: scaleFont(15) }]}>{lib.name}</Text>
                                        <Text style={[styles.libDesc, { fontSize: scaleFont(12) }]}>{lib.description}</Text>
                                        <Text style={[styles.libAuthor, { fontSize: scaleFont(11) }]}>By {lib.author}</Text>
                                    </View>
                                    <View style={styles.badgeCol}>
                                        <View style={styles.licenseTypeBadge}>
                                            <Text style={styles.licenseTypeText}>{lib.license}</Text>
                                        </View>
                                        <Text style={styles.libVersion}>{lib.version}</Text>
                                    </View>
                                </View>

                                {/* Toggle full license text */}
                                <TouchableOpacity
                                    style={styles.toggleLicenseBtn}
                                    onPress={() => setExpandedLicense(isExpanded ? null : lib.name)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={styles.toggleLicenseText}>
                                        {isExpanded ? 'Hide License Notice ▲' : 'View License Notice ▼'}
                                    </Text>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.licenseTextBox}>
                                        <Text style={styles.licensePreText}>{lib.licenseText}</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );

    // Title resolution based on current view
    const getHeaderTitle = () => {
        switch (currentView) {
            case 'privacy':
                return 'Privacy Policy';
            case 'terms':
                return 'Terms of Service';
            case 'licenses':
                return 'Open-Source Licenses';
            default:
                return 'Privacy & Legal';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType={isDialog ? 'fade' : 'slide'}
            transparent={true}
            onRequestClose={() => {
                if (currentView !== 'menu') {
                    setCurrentView('menu');
                } else {
                    onClose();
                }
            }}
        >
            <View style={[styles.overlay, isDialog && styles.overlayDialog]}>
                <View
                    style={[
                        styles.container,
                        isDialog && styles.containerDialog,
                        { maxWidth: modalMaxWidth, paddingBottom: Math.max(insets.bottom, 12) },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        {currentView !== 'menu' ? (
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => setCurrentView('menu')}
                                activeOpacity={0.7}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="arrow-back" size={20} color="#0F172A" />
                                <Text style={[styles.backBtnText, { fontSize: scaleFont(13) }]}>Legal Menu</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.headerTitleWrap}>
                                <Text style={[styles.headerTitle, { fontSize: scaleFont(18) }]} numberOfLines={1}>
                                    {getHeaderTitle()}
                                </Text>
                            </View>
                        )}

                        {currentView !== 'menu' && (
                            <View style={styles.headerCenterTitle}>
                                <Text style={[styles.headerSubViewTitle, { fontSize: scaleFont(15) }]} numberOfLines={1}>
                                    {getHeaderTitle()}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close" size={20} color="#475569" />
                        </TouchableOpacity>
                    </View>

                    {/* Dynamic View Body */}
                    <View style={styles.body}>
                        {currentView === 'menu' && renderMenuView()}
                        {currentView === 'privacy' && renderPrivacyView()}
                        {currentView === 'terms' && renderTermsView()}
                        {currentView === 'licenses' && renderLicensesView()}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => {
                                if (currentView !== 'menu') {
                                    setCurrentView('menu');
                                } else {
                                    onClose();
                                }
                            }}
                            activeOpacity={0.88}
                        >
                            <Text style={styles.doneBtnText}>
                                {currentView !== 'menu' ? '← Back to Legal Menu' : 'Done & Close'}
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
        height: '92%',
        maxHeight: '92%',
        paddingTop: 16,
        ...Shadows.modal,
    },
    containerDialog: {
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        alignSelf: 'center',
        width: '100%',
        height: '88%',
        maxHeight: '88%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitleWrap: {
        flex: 1,
        minWidth: 0,
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#0F172A',
    },
    headerCenterTitle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    headerSubViewTitle: {
        fontWeight: '700',
        color: '#0F172A',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    backBtnText: {
        fontWeight: '700',
        color: '#0F172A',
        marginLeft: 4,
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    body: {
        flex: 1,
        width: '100%',
    },
    menuContainer: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 20,
    },
    menuHero: {
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    menuHeroIconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#CCD2FC',
    },
    menuHeroTitle: {
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
    },
    menuHeroSubtitle: {
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 17,
        marginTop: 4,
        paddingHorizontal: 12,
    },
    menuList: {
        width: '100%',
        gap: 10,
    },
    menuOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    optionIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        flexShrink: 0,
    },
    optionInfo: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    optionTitle: {
        fontWeight: '700',
        color: '#0F172A',
    },
    optionSub: {
        color: '#64748B',
        marginTop: 2,
        lineHeight: 16,
    },
    scrollArea: {
        flex: 1,
    },
    textScrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 24,
    },
    legalNoticeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    legalNoticeText: {
        fontSize: 11,
        color: '#065F46',
        fontWeight: '700',
        flex: 1,
    },
    legalSection: {
        marginBottom: 18,
    },
    legalSectionTitle: {
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        lineHeight: 20,
    },
    legalSectionBody: {
        color: '#334155',
        lineHeight: 20,
    },
    licensesContainer: {
        flex: 1,
    },
    licenseSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 18,
        marginTop: 10,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    licenseSearchInput: {
        flex: 1,
        fontSize: 13,
        color: '#0F172A',
        padding: 0,
    },
    licensesScrollContent: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        paddingBottom: 24,
    },
    licenseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 13,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadows.card,
    },
    licenseCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    libName: {
        fontWeight: '800',
        color: '#0F172A',
    },
    libDesc: {
        color: '#64748B',
        marginTop: 2,
    },
    libAuthor: {
        color: '#94A3B8',
        marginTop: 2,
    },
    badgeCol: {
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    licenseTypeBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#CCD2FC',
    },
    licenseTypeText: {
        fontSize: 10,
        fontWeight: '800',
        color: ThemeColors.royalBlue,
    },
    libVersion: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '600',
    },
    toggleLicenseBtn: {
        marginTop: 8,
        paddingVertical: 4,
    },
    toggleLicenseText: {
        fontSize: 12,
        fontWeight: '700',
        color: ThemeColors.royalBlue,
    },
    licenseTextBox: {
        marginTop: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    licensePreText: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: '#475569',
        lineHeight: 16,
    },
    noLicensesText: {
        color: '#64748B',
        textAlign: 'center',
        paddingVertical: 30,
        fontSize: 13,
    },
    footer: {
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 18 : 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    doneBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
