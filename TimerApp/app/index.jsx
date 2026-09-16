import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from '../src/utils/storage';
import { login } from '../src/api/workerTask.api';
import { ThemeColors, Shadows } from '../constants/theme';
import { useResponsive } from '../src/utils/responsive';

export default function LoginScreen() {
    const router = useRouter();
    const { height, insets, isLandscape, isTablet, isSmallPhone, scaleFont } = useResponsive();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    const scrollViewRef = useRef(null);
    const passwordInputRef = useRef(null);

    const isCompact = isSmallPhone || height < 720 || isLandscape;

    useEffect(() => {
        const showListener = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideListener = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showListener, (e) => {
            setKeyboardVisible(true);
            setKeyboardHeight(e.endCoordinates?.height || 280);
        });
        const hideSub = Keyboard.addListener(hideListener, () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await SecureStore.getItemAsync('worker_token');
                const role = await SecureStore.getItemAsync('user_role');
                if (token && role === 'delivery') {
                    router.replace('/dashboard');
                }
            } catch (e) {
                // ignore
            } finally {
                setChecking(false);
            }
        };
        checkToken();
    }, []);

    const handlePhoneChange = (text) => {
        const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
        setPhone(cleaned);
    };

    const handleLogin = async () => {
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
        const cleanPass = password ? password.trim() : '';

        if (!cleanPhone || !cleanPass) {
            Alert.alert('आवश्यक विवरण', 'कृपया अपना फोन नंबर और पासवर्ड दर्ज करें।');
            return;
        }

        if (cleanPhone.length !== 10) {
            Alert.alert('अमान्य फोन नंबर', 'कृपया 10 अंकों का मान्य फोन नंबर दर्ज करें।');
            return;
        }

        setLoading(true);
        try {
            const data = await login(cleanPhone, cleanPass);
            if (data.success) {
                if (data.user.role !== 'delivery') {
                    Alert.alert('पहुंच अस्वीकृत', 'केवल डिलीवरी/प्रोडक्शन कर्मचारियों को इस पैनल तक पहुंचने की अनुमति है।');
                    return;
                }
                
                await SecureStore.setItemAsync('worker_token', data.token);
                await SecureStore.setItemAsync('user_id', data.user.id.toString());
                await SecureStore.setItemAsync('user_name', data.user.name);
                await SecureStore.setItemAsync('user_role', data.user.role);
                
                router.replace('/dashboard');
            }
        } catch (e) {
            console.error('Login error:', e);
            Alert.alert('लॉगिन विफल', e.response?.data?.message || 'गलत विवरण या सर्वर त्रुटि। कृपया पुनः प्रयास करें।');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={ThemeColors.royalBlue} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <StatusBar style="dark" backgroundColor="#F8FAFC" />
            <KeyboardAvoidingView 
                style={styles.keyboardContainer} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingHorizontal: isSmallPhone ? 14 : (isTablet ? 32 : 22),
                            paddingTop: keyboardVisible ? 10 : (isCompact ? 12 : 24),
                            paddingBottom: keyboardVisible 
                                ? (keyboardHeight > 0 ? keyboardHeight + 36 : 300) 
                                : Math.max(insets.bottom, 16),
                            justifyContent: keyboardVisible || isLandscape ? 'flex-start' : 'space-between',
                        }
                    ]} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                    alwaysBounceVertical={true}
                    nestedScrollEnabled={true}
                >
                    <View style={[
                        styles.contentWrapper,
                        keyboardVisible && styles.contentWrapperKeyboard
                    ]}>
                        {/* Brand Header */}
                        <View style={[
                            styles.header, 
                            isCompact && styles.headerCompact,
                            keyboardVisible && styles.headerWithKeyboard
                        ]}>
                            {!keyboardVisible && !isLandscape && (
                                <View style={[styles.iconCircle, isCompact && styles.iconCircleCompact]}>
                                    <Text style={[styles.iconMonogram, isCompact && styles.iconMonogramCompact]}>R</Text>
                                </View>
                            )}
                            <Text style={[
                                styles.title, 
                                isCompact && styles.titleCompact,
                                keyboardVisible && styles.titleKeyboard,
                                { fontSize: Math.min(32, Math.max(22, scaleFont(isCompact ? 25 : 30))) }
                            ]}>
                                RAMBHAJI
                            </Text>
                            <View style={[styles.badgePill, keyboardVisible && styles.badgePillKeyboard]}>
                                <Text style={styles.badgeText}>PRODUCTION WORKER PANEL</Text>
                            </View>
                            {!keyboardVisible && !isLandscape && (
                                <Text style={styles.subGreeting}>Sign in to start your shift & manage tasks</Text>
                            )}
                        </View>

                        {/* Card Form */}
                        <View style={[
                            styles.card, 
                            isCompact && styles.cardCompact, 
                            { width: '100%', maxWidth: 440, alignSelf: 'center' }
                        ]}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={[styles.inputWrapper, phoneFocused && styles.inputWrapperFocused]}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter phone number"
                                        placeholderTextColor="#94A3B8"
                                        value={phone}
                                        onChangeText={handlePhoneChange}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        returnKeyType="next"
                                        autoComplete="off"
                                        textContentType="none"
                                        importantForAutofill="no"
                                        onFocus={() => {
                                            setPhoneFocused(true);
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                            }, 120);
                                        }}
                                        onBlur={() => setPhoneFocused(false)}
                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                                    <TextInput
                                        ref={passwordInputRef}
                                        style={[styles.input, styles.inputWithEye]}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#94A3B8"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        returnKeyType="go"
                                        autoComplete="off"
                                        textContentType="none"
                                        importantForAutofill="no"
                                        onFocus={() => {
                                            setPasswordFocused(true);
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollToEnd({ animated: true });
                                            }, 120);
                                        }}
                                        onBlur={() => setPasswordFocused(false)}
                                        onSubmitEditing={handleLogin}
                                    />
                                    <TouchableOpacity 
                                        style={styles.eyeBtn}
                                        onPress={() => setShowPassword(prev => !prev)}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.button, loading && styles.buttonDisabled]} 
                                onPress={handleLogin} 
                                disabled={loading}
                                activeOpacity={0.88}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Text style={styles.buttonText}>Sign In to Dashboard →</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer security note - hide when keyboard is open to preserve clean space */}
                    {!keyboardVisible && (
                        <View style={styles.footerNote}>
                            <Text style={styles.footerText}>Secured Production Gateway • v1.0</Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: { 
        flex: 1, 
        backgroundColor: '#F8FAFC',
    },
    keyboardContainer: {
        flex: 1,
    },
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 22,
    },
    contentWrapper: {
        width: '100%',
        maxWidth: 440,
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'center',
        paddingVertical: 12,
    },
    contentWrapperKeyboard: {
        flex: 0,
        justifyContent: 'flex-start',
        paddingVertical: 4,
    },
    header: { 
        alignItems: 'center', 
        marginBottom: 24,
        width: '100%',
    },
    headerCompact: {
        marginBottom: 14,
    },
    headerWithKeyboard: {
        marginBottom: 10,
    },
    iconCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#EEF0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#CCD2FC',
        ...Shadows.card,
    },
    iconCircleCompact: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginBottom: 8,
    },
    iconMonogram: {
        fontSize: 30,
        fontWeight: '900',
        color: '#273AF8',
    },
    iconMonogramCompact: {
        fontSize: 22,
    },
    title: { 
        fontFamily: Platform.OS === 'ios' ? 'Copperplate' : 'serif',
        fontSize: 32, 
        fontWeight: '900', 
        color: '#273AF8',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: 26,
        letterSpacing: 1.2,
    },
    titleKeyboard: {
        fontSize: 22,
        letterSpacing: 1.0,
    },
    badgePill: {
        backgroundColor: '#FDF0FF',
        borderWidth: 1,
        borderColor: '#F5B8FC',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 9999,
        marginTop: 8,
        maxWidth: '90%',
    },
    badgePillKeyboard: {
        marginTop: 4,
        paddingVertical: 2,
        paddingHorizontal: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EA33FF',
        letterSpacing: 0.8,
        textAlign: 'center',
    },
    subGreeting: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
        maxWidth: 300,
    },
    card: { 
        backgroundColor: '#FFFFFF', 
        paddingHorizontal: 22,
        paddingVertical: 24, 
        borderRadius: 22, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        width: '100%',
        ...Shadows.card,
    },
    cardCompact: {
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderRadius: 18,
    },
    inputGroup: {
        marginBottom: 16,
        width: '100%',
    },
    label: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#0F172A', 
        marginBottom: 7,
        letterSpacing: 0.2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 13,
        paddingHorizontal: 14,
        minHeight: 50,
        width: '100%',
    },
    inputWrapperFocused: {
        borderColor: '#273AF8',
        backgroundColor: '#FFFFFF',
    },
    input: { 
        flex: 1,
        minWidth: 0,
        fontSize: 15, 
        color: '#0F172A',
        fontWeight: '500',
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    inputWithEye: {
        paddingRight: 8,
    },
    eyeBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#EEF2F6',
        flexShrink: 0,
    },
    eyeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.2,
    },
    button: { 
        backgroundColor: '#273AF8', 
        minHeight: 50,
        borderRadius: 13, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 6, 
        width: '100%',
        ...Shadows.buttonPrimary,
    },
    buttonDisabled: { 
        opacity: 0.65, 
        backgroundColor: '#939DFA',
    },
    buttonText: { 
        color: '#FFFFFF', 
        fontSize: 15, 
        fontWeight: '700',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    footerNote: {
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
        textAlign: 'center',
    },
});


