import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../src/utils/responsive';
import { Shadows } from '../constants/theme';
import RingtoneSelector from './RingtoneSelector';

export default function AlarmSettingsModal({ visible, onClose }) {
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
                    { maxWidth: modalMaxWidth, paddingBottom: Math.max(insets.bottom, 12) }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={[styles.title, { fontSize: scaleFont(20) }]} numberOfLines={1} ellipsizeMode="tail">
                                अलार्म सेटिंग्स (Alarm Settings)
                            </Text>
                            <Text style={[styles.subtitle, { fontSize: scaleFont(12) }]} numberOfLines={1} ellipsizeMode="tail">
                                टाइमर पूरा होने पर बजने वाली रिंगटोन चुनें
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

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        bounces={true}
                    >
                        <RingtoneSelector showTestButton={true} showExplanation={true} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.88}>
                            <Text style={styles.doneBtnText}>सुरक्षित करें और बंद करें</Text>
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
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flex: 1,
        minWidth: 0,
        paddingRight: 10,
    },
    title: {
        fontWeight: 'bold',
        color: '#0F172A',
    },
    subtitle: {
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
        paddingHorizontal: 18,
        paddingVertical: 14,
        paddingBottom: 20,
    },
    footer: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    doneBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
