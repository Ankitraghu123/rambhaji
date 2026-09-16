// app/animations/showroom.js
// GharTak Motion Studio — interactive sandbox for all motion design presets

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Animated, TouchableWithoutFeedback, Dimensions,
  Image, ActivityIndicator, Alert, Pressable, TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import {
  PulsingDot, AnimatedCard, AnimatedPressable,
  SlideInSheet, Shimmer, SkeletonCard, SuccessCheckmark,
  ConfettiRain, ToastNotification, ExpandableFAB, NumberCounter,
  CharacterWalk, LocationSearch, NoInternetAnim, NoOrdersAnim,
  MaintenanceAnim, PageNotFoundAnim, OrderTimelineAnim,
  FadeView, SlideView, ZoomView, BounceView, RippleEffect,
  GlassmorphismCard, NeumorphismButton, GlowingView, GradientBackground,
  ParticleBackground, ProgressiveImage, SkeletonTransition, StaggerContainer,
  CartFly, HeartPop, NotificationBadge, MorphingShape, SwipeableRow, AutoHideHeader
} from '../../src/components/common/Motion';
import { useDynamicBranding } from '../../src/core/branding/useDynamicBranding';
import DynamicHeader from '../../src/components/branding/DynamicHeader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PREVIEW_IMAGES = {
  thumbnail: { uri: 'https://picsum.photos/50/50?blur=10' },
  full: { uri: 'https://picsum.photos/400/300' }
};

export default function MotionShowroomScreen() {
  const [activeTab, setActiveTab] = useState('TRANSITIONS'); 
  const {
    activeTheme,
    themeColors,
    logoConfig,
    mascotConfig,
    overlayConfig,
    triggerConfigSync,
    setOverrideEvent,
    getOverrideEventId,
    getBrandingLogs,
    clearBrandingLogs,
  } = useDynamicBranding();
  
  const [syncingBranding, setSyncingBranding] = useState(false); 
  // 'TRANSITIONS' | 'PHYSICS' | 'AESTHETICS' | 'FEED' | 'CART' | 'DELIVERY' | 'SPLASH'

  // Toast / Snackbar State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Confetti / Payment success
  const [confettiActive, setConfettiActive] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Transitions Tab States
  const [transitionKey, setTransitionKey] = useState(0);
  const [activeTransition, setActiveTransition] = useState('fade'); // 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'bounce'
  const [swipeItems, setSwipeItems] = useState([
    { id: '1', name: 'Fresh organic green apples', qty: '1 kg' },
    { id: '2', name: 'Red ripe tomatoes', qty: '500 g' },
    { id: '3', name: 'Farm fresh farm milk', qty: '1 L' },
  ]);

  // Feed/Loading Tab States
  const [loadingProgressiveImage, setLoadingProgressiveImage] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedItems, setFeedItems] = useState([
    { id: '1', title: 'Order #9088 Accepted', desc: 'Assigned to Rohan Sharma' },
    { id: '2', title: 'Route Optimized', desc: 'Bhopal Zone - 4.2 km total' },
  ]);

  // Cart States
  const [cartCount, setCartCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [flyActive, setFlyActive] = useState(false);
  const [flyStart, setFlyStart] = useState({ x: SCREEN_WIDTH / 2 - 16, y: 350 });
  const [flyEnd, setFlyEnd] = useState({ x: SCREEN_WIDTH - 60, y: 20 });

  // Map & Live Track State
  const [riderAnim] = useState(new Animated.Value(0));
  const [riderMoving, setRiderMoving] = useState(false);
  const [timelineStep, setTimelineStep] = useState(3);
  const [markerBounceVal] = useState(new Animated.Value(0));

  // Splash demo overlay visible state
  const [splashOverlayVisible, setSplashOverlayVisible] = useState(false);
  const splashLogoScale = useRef(new Animated.Value(0.3)).current;
  const splashTextOpacity = useRef(new Animated.Value(0)).current;

  // Lottie path progress mock state
  const [lottieFrame, setLottieFrame] = useState(0);
  const [lottiePlaying, setLottiePlaying] = useState(true);

  // Scroll View listener for auto-hide header
  const scrollY = useRef(new Animated.Value(0)).current;

  // Trigger custom toast
  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  // Re-trigger active transition in Preview box
  const refreshTransition = (type) => {
    setActiveTransition(type);
    setTransitionKey(prev => prev + 1);
  };

  // Simulated swipe-to-delete action
  const deleteSwipeItem = (id) => {
    setSwipeItems(prev => prev.filter(item => item.id !== id));
    triggerToast('🗑️ Item removed from load checklist', 'error');
  };

  // Simulated Pull-to-Refresh Feed Load
  const reloadFeedData = () => {
    setFeedLoading(true);
    triggerToast('🔄 Refreshing delivery queue...', 'info');
    setTimeout(() => {
      setFeedLoading(false);
      setFeedItems([
        { id: Date.now().toString(), title: 'New Order Available', desc: 'Green Groceries delivery - 1.2km' },
        ...feedItems
      ]);
      triggerToast('✅ Feed updated snappily', 'success');
    }, 1800);
  };

  // Add Item to cart with animation
  const handleAddToCart = (e) => {
    if (e && e.nativeEvent) {
      setFlyStart({ x: e.nativeEvent.pageX - 16, y: e.nativeEvent.pageY - 120 });
    }
    setFlyActive(true);
  };

  // Animation end callback
  const onFlyComplete = () => {
    setFlyActive(false);
    setCartCount(prev => prev + 1);
    triggerToast('🛍️ Cart badge incremented successfully', 'success');
  };

  // Bouncing GPS Marker logic
  useEffect(() => {
    if (activeTab === 'DELIVERY') {
      const dropAnimation = () => {
        markerBounceVal.setValue(0);
        Animated.spring(markerBounceVal, {
          toValue: 1,
          tension: 60,
          friction: 4,
          useNativeDriver: true
        }).start();
      };
      dropAnimation();
      const interval = setInterval(dropAnimation, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Live rider movement path
  const startRiderTransit = () => {
    if (riderMoving) return;
    setRiderMoving(true);
    Animated.sequence([
      Animated.timing(riderAnim, {
        toValue: SCREEN_WIDTH - 120,
        duration: 2500,
        useNativeDriver: true
      }),
      Animated.timing(riderAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true
      })
    ]).start(() => {
      setRiderMoving(false);
      triggerToast('🛵 Executive reached target customer!', 'success');
    });
  };

  // Splash Screen Intro preview triggers
  const triggerSplashSimulation = () => {
    setSplashOverlayVisible(true);
    splashLogoScale.setValue(0.3);
    splashTextOpacity.setValue(0);

    Animated.sequence([
      Animated.spring(splashLogoScale, {
        toValue: 1.0,
        tension: 100,
        friction: 6,
        useNativeDriver: true
      }),
      Animated.timing(splashTextOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  };

  // Mock Lottie loop frame counter
  useEffect(() => {
    let timer;
    if (lottiePlaying) {
      timer = setInterval(() => {
        setLottieFrame(f => (f + 1) % 60);
      }, 35);
    }
    return () => clearInterval(timer);
  }, [lottiePlaying]);

  // Payment completed success
  const showPaymentSuccessModal = () => {
    setSuccessModalVisible(true);
    setConfettiActive(true);
    setTimeout(() => {
      setConfettiActive(false);
    }, 4000);
  };

  return (
    <View style={styles.root}>
      {/* ── Auto-Hiding / Sticky Header ── */}
      <AutoHideHeader scrollY={scrollY} headerHeight={70}>
        <View style={styles.headerContent}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </AnimatedPressable>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.title}>GharTak Motion Studio</Text>
            <Text style={styles.subtitle}>60 FPS Native GPU Physics Sandbox</Text>
          </View>
          {/* Cart Icon representing Notification Badges */}
          <View style={styles.cartIconWrapper}>
            <Text style={{ fontSize: 24 }}>🛒</Text>
            <NotificationBadge count={cartCount} />
          </View>
        </View>
      </AutoHideHeader>

      {/* Main Container with listening scroll actions */}
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={{ height: 60 }} /> {/* Spacer matching AutoHideHeader */}

        {/* Tab Selection Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollRow}>
          {[
            { key: 'TRANSITIONS', title: 'Transitions' },
            { key: 'PHYSICS', title: 'Springs & Waves' },
            { key: 'AESTHETICS', title: 'Aesthetics' },
            { key: 'FEED', title: 'Feed & Skeletons' },
            { key: 'CART', title: 'Cart & Favs' },
            { key: 'DELIVERY', title: 'Delivery & Maps' },
            { key: 'SPLASH', title: 'Intros & Canvas' },
            { key: 'BRANDING', title: 'Branding Studio' }
          ].map((tab) => (
            <AnimatedPressable
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.title}
              </Text>
            </AnimatedPressable>
          ))}
        </ScrollView>

        {/* ── TAB 1: TRANSITIONS & GESTURES ── */}
        {activeTab === 'TRANSITIONS' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GPU Interpolated Screen Reveals</Text>
            <View style={styles.transitionBox}>
              <View style={styles.previewContainer}>
                {activeTransition === 'fade' && (
                  <FadeView key={transitionKey} duration={600} style={styles.previewCard}>
                    <Text style={styles.previewEmoji}>📦</Text>
                    <Text style={styles.previewText}>Fade-In Transition Active</Text>
                  </FadeView>
                )}
                {activeTransition === 'slide-up' && (
                  <SlideView key={transitionKey} direction="up" distance={80} duration={500} style={styles.previewCard}>
                    <Text style={styles.previewEmoji}>🚀</Text>
                    <Text style={styles.previewText}>Slide-Up Reveal Active</Text>
                  </SlideView>
                )}
                {activeTransition === 'slide-left' && (
                  <SlideView key={transitionKey} direction="left" distance={100} duration={500} style={styles.previewCard}>
                    <Text style={styles.previewEmoji}>➡️</Text>
                    <Text style={styles.previewText}>Slide-Left Page Slide</Text>
                  </SlideView>
                )}
                {activeTransition === 'zoom' && (
                  <ZoomView key={transitionKey} type="in" elastic={true} duration={500} style={styles.previewCard}>
                    <Text style={styles.previewEmoji}>🔍</Text>
                    <Text style={styles.previewText}>Elastic Zoom-In Transition</Text>
                  </ZoomView>
                )}
                {activeTransition === 'bounce' && (
                  <BounceView key={transitionKey} style={styles.previewCard}>
                    <Text style={styles.previewEmoji}>⚽</Text>
                    <Text style={styles.previewText}>Overshoot Spring Bounce</Text>
                  </BounceView>
                )}
              </View>

              {/* Selector Buttons */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.btnRow}>
                {['fade', 'slide-up', 'slide-left', 'zoom', 'bounce'].map(t => (
                  <TouchableOpacity key={t} style={styles.inlineBtn} onPress={() => refreshTransition(t)}>
                    <Text style={styles.inlineBtnText}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.sectionTitle}>Swipe-To-Delete Gesture Action</Text>
            <View style={{ gap: 10 }}>
              {swipeItems.map(item => (
                <SwipeableRow key={item.id} onDelete={() => deleteSwipeItem(item.id)} height={80}>
                  <View style={styles.swipeRowLeft}>
                    <Text style={styles.swipeEmoji}>🥦</Text>
                    <View>
                      <Text style={styles.swipeTitle}>{item.name}</Text>
                      <Text style={styles.swipeSub}>{item.qty} • Swipe left to remove</Text>
                    </View>
                  </View>
                </SwipeableRow>
              ))}
              {swipeItems.length === 0 && (
                <TouchableOpacity onPress={() => setSwipeItems([
                  { id: '1', name: 'Fresh organic green apples', qty: '1 kg' },
                  { id: '2', name: 'Red ripe tomatoes', qty: '500 g' }
                ])} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>🔄 Reset Load Checklist</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── TAB 2: MICRO-INTERACTIONS & SPRINGS ── */}
        {activeTab === 'PHYSICS' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wave Pulse coordinate-aware ripple</Text>
            <RippleEffect style={styles.rippleTouchPad} onPress={() => triggerToast('Ripple wave emitted!', 'info')}>
              <Text style={styles.ripplePadLabel}>Tap anywhere inside to emit wave ripples</Text>
            </RippleEffect>

            <Text style={styles.sectionTitle}>Morph & Floating Physics Loops</Text>
            <View style={styles.physicsGrid}>
              <View style={styles.physicsCard}>
                <MorphingShape />
                <Text style={styles.physicsLabel}>Morphing border radius & background</Text>
              </View>
              <View style={styles.physicsCard}>
                <SlideView direction="up" distance={15} duration={1200} style={styles.hoveringCard}>
                  <Text style={{ fontSize: 36 }}>🎈</Text>
                </SlideView>
                <Text style={styles.physicsLabel}>Floating vertical loop physics</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 3: VISUAL STYLE AESTHETICS ── */}
        {activeTab === 'AESTHETICS' && (
          <GradientBackground colors={['#F5F8F6', '#E9F5EF', '#FFFFFF']} style={styles.gradientSection}>
            <Text style={styles.sectionTitle}>Frosted Glass & Extruded Bevels</Text>
            
            <View style={styles.gridRow}>
              {/* Glassmorphism Card */}
              <GlassmorphismCard style={styles.aestheticCard}>
                <Text style={styles.glassTitle}>Frosted Glass Card</Text>
                <Text style={styles.glassSub}>Blur backing, translucent sheen border overlay.</Text>
                <View style={styles.glassOverlayBadge}>
                  <Text style={styles.glassBadgeText}>PREMIUM UI</Text>
                </View>
              </GlassmorphismCard>

              {/* Neumorphic Bevel Buttons */}
              <View style={{ flex: 1, gap: 12 }}>
                <NeumorphismButton onPress={() => triggerToast('Neumorphic switch pressed!')}>
                  <Text style={styles.neumorphicLabel}>Press active</Text>
                </NeumorphismButton>
                <NeumorphismButton style={{ borderColor: '#BFCFCA' }} onPress={() => triggerToast('Neumorphic switch pressed!')}>
                  <Text style={styles.neumorphicLabel}>Switch item</Text>
                </NeumorphismButton>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Glowing Outer Shadow Aura</Text>
            <GlowingView glowColor="#2EC17E" style={styles.glowingWrapper}>
              <Text style={styles.glowingTitle}>Pulsing Border Aura Glow</Text>
              <Text style={styles.glowingSub}>Shadow opacity loops between 40% and 100%.</Text>
            </GlowingView>

            {/* Particle simulation layer inside view */}
            <Text style={styles.sectionTitle}>Particle backgrounds preview</Text>
            <View style={styles.particlePreviewContainer}>
              <ParticleBackground count={15} color="#2EC17E" style={StyleSheet.absoluteFill}>
                <View style={styles.particlePlaceholder}>
                  <Text style={styles.particleLabelText}>Particles Floating Upward</Text>
                </View>
              </ParticleBackground>
            </View>
          </GradientBackground>
        )}

        {/* ── TAB 4: STATE FEEDS & LOADERS ── */}
        {activeTab === 'FEED' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pull-to-refresh & stagger reveal</Text>
            <TouchableOpacity style={styles.refreshTriggerBtn} onPress={reloadFeedData}>
              <Text style={styles.refreshTriggerText}>
                {feedLoading ? '🔄 Fetching queue items...' : '⬇ Sim Pull-To-Refresh'}
              </Text>
            </TouchableOpacity>

            <SkeletonTransition loading={feedLoading} skeleton={<SkeletonCard />}>
              <StaggerContainer key={feedItems.length} delayStep={120}>
                {feedItems.map(item => (
                  <View key={item.id} style={styles.loadedCard}>
                    <Text style={styles.loadedCardTitle}>{item.title}</Text>
                    <Text style={styles.loadedCardDesc}>{item.desc}</Text>
                  </View>
                ))}
              </StaggerContainer>
            </SkeletonTransition>

            <Text style={styles.sectionTitle}>Blur placeholder progressive image</Text>
            <View style={styles.progressiveContainer}>
              <ProgressiveImage
                thumbnailSource={PREVIEW_IMAGES.thumbnail}
                source={PREVIEW_IMAGES.full}
                style={styles.progressiveImage}
              />
              <Text style={styles.progressiveLabel}>Starts blurred, fades in full image smoothly</Text>
            </View>
          </View>
        )}

        {/* ── TAB 5: CART & MICRO-ACTIONS ── */}
        {activeTab === 'CART' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>E-Commerce Micro-interactions</Text>
            <View style={styles.cartShowcaseCard}>
              <Text style={{ fontSize: 44, alignSelf: 'center', marginBottom: 14 }}>🍎</Text>
              <Text style={styles.cartShowcaseTitle}>Fresh Organic Apples</Text>
              <Text style={styles.cartShowcasePrice}>₹180 / kg</Text>

              <View style={styles.interactiveRow}>
                {/* Heart Pop / Favorite */}
                <HeartPop
                  liked={isLiked}
                  onPress={() => {
                    setIsLiked(!isLiked);
                    triggerToast(!isLiked ? '❤️ Added to favorites!' : '🤍 Removed from favorites', 'info');
                  }}
                />

                {/* Add to Cart button triggering Cart Fly */}
                <Pressable
                  style={({ pressed }) => [styles.addToCartBtn, pressed && styles.btnPressed]}
                  onPress={handleAddToCart}
                >
                  <Text style={styles.addToCartText}>Add to Cart 🛒</Text>
                </Pressable>
              </View>
            </View>

            {/* Flying dot simulator overlay */}
            <CartFly
              active={flyActive}
              startCoords={flyStart}
              endCoords={flyEnd}
              onComplete={onFlyComplete}
              emoji="🍎"
            />
          </View>
        )}

        {/* ── TAB 6: GPS TRACKING & TIMELINES ── */}
        {activeTab === 'DELIVERY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Path Rider Simulation</Text>
            <View style={styles.trackContainer}>
              <View style={styles.trackLine} />
              <Animated.View style={[styles.riderSprite, { transform: [{ translateX: riderAnim }] }]}>
                <Text style={styles.riderEmoji}>🛵</Text>
              </Animated.View>
              <View style={styles.destinationMarker}>
                <Text style={styles.destEmoji}>🏠</Text>
              </View>
            </View>
            <AnimatedPressable style={styles.simBtn} onPress={startRiderTransit}>
              <Text style={styles.simBtnText}>
                {riderMoving ? '🚴 Courier in Route...' : '▶ Start Tracking Route'}
              </Text>
            </AnimatedPressable>

            <Text style={styles.sectionTitle}>Marker Drop Elastic Bounce</Text>
            <View style={styles.markerShowcase}>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: markerBounceVal.interpolate({
                        inputRange: [0, 0.4, 0.6, 0.8, 1.0],
                        outputRange: [-100, 0, -25, 0, 0]
                      })
                    }
                  ]
                }}
              >
                <Text style={{ fontSize: 52 }}>📍</Text>
              </Animated.View>
              <Text style={styles.markerLabel}>GPS coordinate ping received</Text>
            </View>

            <Text style={styles.sectionTitle}>Timeline Progress checklist</Text>
            <View style={styles.timelineBoxContainer}>
              <OrderTimelineAnim activeStep={timelineStep} />
              
              <View style={styles.timelineControlRow}>
                <AnimatedPressable
                  style={styles.timelineCtrlBtn}
                  onPress={() => setTimelineStep(s => s > 0 ? s - 1 : 0)}
                >
                  <Text style={styles.timelineCtrlBtnText}>Previous Step</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={styles.timelineCtrlBtn}
                  onPress={() => setTimelineStep(s => s < 4 ? s + 1 : 4)}
                >
                  <Text style={styles.timelineCtrlBtnText}>Advance Step</Text>
                </AnimatedPressable>
              </View>
            </View>

            {/* Overlays / Modal Trigger */}
            <Text style={styles.sectionTitle}>Alert sheets & overlays</Text>
            <TouchableOpacity style={styles.triggerModalBtn} onPress={showPaymentSuccessModal}>
              <Text style={styles.triggerModalBtnText}>🎉 Trigger Success Modal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TAB 7: LOTTIE & INTROS ── */}
        {activeTab === 'SPLASH' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interactive splash reveal intro</Text>
            <TouchableOpacity style={styles.triggerModalBtn} onPress={triggerSplashSimulation}>
              <Text style={styles.triggerModalBtnText}>📺 Launch Splash Animation</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Mock Lottie Vector Path Player</Text>
            <View style={styles.lottieContainer}>
              <View style={styles.lottieCanvas}>
                {/* Simulated morphing vector shape representing Lottie player */}
                <View
                  style={[
                    styles.mockLottiePath,
                    {
                      borderRadius: 30 + Math.sin(lottieFrame * 0.1) * 20,
                      transform: [
                        { rotate: `${lottieFrame * 6}deg` },
                        { scale: 1.0 + Math.cos(lottieFrame * 0.1) * 0.15 }
                      ]
                    }
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>📦</Text>
                </View>
              </View>
              
              {/* Lottie controls */}
              <View style={styles.lottieControls}>
                <TouchableOpacity style={styles.lottieControlBtn} onPress={() => setLottiePlaying(!lottiePlaying)}>
                  <Text style={styles.lottieControlBtnText}>{lottiePlaying ? '⏸ Pause' : '▶ Play'}</Text>
                </TouchableOpacity>
                <Text style={styles.lottieFrameText}>Frame: {lottieFrame} / 60</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 8: DYNAMIC BRANDING STUDIO ── */}
        {activeTab === 'BRANDING' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Campaign Branding Override Control</Text>
            <View style={styles.brandingControlCard}>
              <Text style={styles.brandingCardTitle}>Simulate Remote Event Switch</Text>
              <Text style={styles.brandingCardSub}>
                Click any campaign to morph the app colors, dynamic logos, overlays, and mascot.
              </Text>

              {/* Selector Grid */}
              <View style={styles.themeGrid}>
                {[
                  { id: 'default', label: 'Default', icon: '🥬' },
                  { id: 'diwali', label: 'Diwali', icon: '🪔' },
                  { id: 'christmas', label: 'Christmas', icon: '🎄' },
                  { id: 'holi', label: 'Holi', icon: '🎨' },
                  { id: 'independence', label: 'Independence', icon: '🇮🇳' },
                  { id: 'valentine', label: 'Valentine', icon: '❤️' },
                  { id: 'ipl', label: 'Cricket/IPL', icon: '🏏' },
                  { id: 'halloween', label: 'Halloween', icon: '🎃' }
                ].map((item) => {
                  const isActive = getOverrideEventId() === item.id || (getOverrideEventId() === null && item.id === 'default');
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.themeSelectBtn, isActive && styles.themeSelectBtnActive]}
                      onPress={() => {
                        setOverrideEvent(item.id === 'default' ? null : item.id);
                        triggerToast(`Campaign switched to: ${item.label}`, 'success');
                      }}
                    >
                      <Text style={styles.themeSelectIcon}>{item.icon}</Text>
                      <Text style={[styles.themeSelectLabel, isActive && styles.themeSelectLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Synchronize check simulated button */}
              <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: themeColors.primary }]}
                onPress={async () => {
                  setSyncingBranding(true);
                  triggerToast('Prefetching Campaign Configurations...', 'info');
                  await triggerConfigSync();
                  setTimeout(() => {
                    setSyncingBranding(false);
                    triggerToast('Campaign configuration synchronized & cached.', 'success');
                  }, 1200);
                }}
                disabled={syncingBranding}
              >
                {syncingBranding ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.syncButtonText}>🔄 Check Remote Config API</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Campaign Realtime Stats */}
            <Text style={styles.sectionTitle}>Campaign Metadata & Asset Cache Status</Text>
            <View style={styles.statsPanel}>
              <View style={styles.statRow}>
                <Text style={styles.statKey}>Active Campaign:</Text>
                <Text style={[styles.statVal, { color: themeColors.primary }]}>{activeTheme.name}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statKey}>Campaign Event ID:</Text>
                <Text style={styles.statVal}>{activeTheme.id}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statKey}>Logo Shape Type:</Text>
                <Text style={styles.statVal}>{logoConfig.morphShape.toUpperCase()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statKey}>Overlay Active:</Text>
                <Text style={styles.statVal}>{overlayConfig.type.toUpperCase()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statKey}>Colors cached:</Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <View style={[styles.colorBlock, { backgroundColor: themeColors.primary }]} />
                  <View style={[styles.colorBlock, { backgroundColor: themeColors.secondary }]} />
                  <View style={[styles.colorBlock, { backgroundColor: themeColors.background }]} />
                </View>
              </View>
            </View>

            {/* Remote Config Engine Logs */}
            <View style={styles.logHeader}>
              <Text style={styles.sectionTitle}>Branding Service Console Logs</Text>
              <TouchableOpacity onPress={clearBrandingLogs}>
                <Text style={styles.clearLogsText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.logsBox}>
              {getBrandingLogs().length === 0 ? (
                <Text style={styles.emptyLogText}>No operations recorded yet.</Text>
              ) : (
                getBrandingLogs().map((logMsg, i) => (
                  <Text key={i} style={styles.logText}>{logMsg}</Text>
                ))
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} /> {/* Bottom padding */}
      </Animated.ScrollView>

      {/* Floating Action Button Options */}
      <ExpandableFAB
        icon="⚙️"
        options={[
          { emoji: '👋', onPress: () => triggerToast('Hi from GharTak physics engine!', 'info') },
          { emoji: '✨', onPress: () => { setConfettiActive(true); setTimeout(() => setConfettiActive(false), 3000); } },
          { emoji: '🏡', onPress: () => router.replace('/(tabs)') },
        ]}
      />

      {/* Toast Overlay */}
      <ToastNotification
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />

      {/* Confetti Rain Overlay */}
      <ConfettiRain active={confettiActive} />

      {/* Success checkmark Modal Sheet */}
      {successModalVisible && (
        <View style={styles.checkmarkModalOverlay}>
          <View style={styles.checkmarkModalSheet}>
            <SuccessCheckmark size={90} onComplete={() => {}} />
            <Text style={styles.checkmarkModalTitle}>Payment Success</Text>
            <Text style={styles.checkmarkModalSub}>Ram Bhaji Cash Ledger successfully synchronized in background.</Text>
            <AnimatedPressable
              style={styles.checkmarkModalCloseBtn}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.checkmarkModalCloseText}>Done & Synchronize</Text>
            </AnimatedPressable>
          </View>
        </View>
      )}

      {/* Interactive Splash Screen overlay */}
      {splashOverlayVisible && (
        <View style={styles.splashOverlayContainer}>
          <Animated.View style={[styles.splashLogoContainer, { transform: [{ scale: splashLogoScale }] }]}>
            <Text style={{ fontSize: 80 }}>🥬</Text>
          </Animated.View>
          <Animated.Text style={[styles.splashTitleText, { opacity: splashTextOpacity }]}>
            Ram Bhaji Driver
          </Animated.Text>
          <Animated.Text style={[styles.splashSubText, { opacity: splashTextOpacity }]}>
            High-Performance Fresh Delivery
          </Animated.Text>

          <TouchableOpacity style={styles.splashCloseBtn} onPress={() => setSplashOverlayVisible(false)}>
            <Text style={styles.splashCloseText}>Exit Splash Intro ➔</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F8F6' },
  headerContent: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', height: '100%',
    paddingTop: 10
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FAF6F0', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E6E2',
  },
  backText: { fontSize: 18, color: '#0E4A35', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0E4A35', fontFamily: 'System' },
  subtitle: { fontSize: 11, color: '#5C6F66', fontWeight: '500' },
  cartIconWrapper: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    position: 'relative'
  },

  tabScrollRow: { paddingHorizontal: 20, marginVertical: 14, gap: 10, height: 44 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6E2',
    justifyContent: 'center', alignItems: 'center'
  },
  tabBtnActive: { backgroundColor: '#0E4A35', borderColor: '#0E4A35' },
  tabText: { fontSize: 12, color: '#5C6F66', fontWeight: 'bold' },
  tabTextActive: { color: '#FFFFFF' },

  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },

  section: { gap: 14 },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', color: '#5C6F66',
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 20,
    marginBottom: 6
  },

  // Transitions tab styles
  transitionBox: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 16
  },
  previewContainer: {
    height: 160, backgroundColor: '#FAF6F0', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
  },
  previewCard: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16,
    borderWidth: 1, borderColor: '#E0E6E2', alignItems: 'center',
    width: '80%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  previewEmoji: { fontSize: 32, marginBottom: 8 },
  previewText: { fontSize: 14, fontWeight: 'bold', color: '#0E4A35' },
  btnRow: { gap: 10, paddingVertical: 4 },
  inlineBtn: {
    backgroundColor: '#E9F5EF', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 8, borderWidth: 1, borderColor: '#A7F3D0'
  },
  inlineBtnText: { fontSize: 10, color: '#0E4A35', fontWeight: 'bold' },

  // Swipe to delete styles
  swipeRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  swipeEmoji: { fontSize: 24 },
  swipeTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C2B29' },
  swipeSub: { fontSize: 11, color: '#7E7A74', marginTop: 2 },
  resetBtn: {
    backgroundColor: '#E9F5EF', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0'
  },
  resetBtnText: { color: '#0E4A35', fontWeight: 'bold', fontSize: 13 },

  // Ripples style
  rippleTouchPad: {
    height: 180, backgroundColor: '#FAF6F0', borderRadius: 24,
    borderWidth: 1, borderColor: '#E0E6E2', justifyContent: 'center',
    alignItems: 'center', position: 'relative', overflow: 'hidden'
  },
  ripplePadLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold', textAlign: 'center' },

  // Physics Style
  physicsGrid: { flexDirection: 'row', gap: 12 },
  physicsCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E0E6E2', alignItems: 'center', gap: 12
  },
  physicsLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'center', fontWeight: '500' },
  hoveringCard: {
    width: 60, height: 60, justifyContent: 'center', alignItems: 'center'
  },

  // Aesthetics styling
  gradientSection: { borderRadius: 24, padding: 20, gap: 14 },
  aestheticCard: { flex: 1, gap: 8 },
  glassTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  glassSub: { fontSize: 11, color: '#D1EAE0', lineHeight: 16 },
  glassOverlayBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, marginTop: 10
  },
  glassBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  neumorphicLabel: { color: '#0E4A35', fontSize: 13, fontWeight: 'bold' },
  glowingWrapper: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 6
  },
  glowingTitle: { fontSize: 15, fontWeight: 'bold', color: '#0E4A35' },
  glowingSub: { fontSize: 11, color: '#7E7A74' },
  particlePreviewContainer: {
    height: 120, backgroundColor: '#FAF6F0', borderRadius: 20,
    overflow: 'hidden', position: 'relative'
  },
  particlePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  particleLabelText: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },

  // Feed loader styles
  refreshTriggerBtn: {
    backgroundColor: '#E9F5EF', borderRadius: 16, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0'
  },
  refreshTriggerText: { color: '#0E4A35', fontWeight: 'bold', fontSize: 13 },
  loadedCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E0E6E2', marginBottom: 12
  },
  loadedCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C2B29' },
  loadedCardDesc: { fontSize: 11, color: '#7E7A74', marginTop: 4 },
  progressiveContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 10
  },
  progressiveImage: { width: '100%', height: 180, borderRadius: 12 },
  progressiveLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  // Cart showcase
  cartShowcaseCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#E0E6E2'
  },
  cartShowcaseTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C2B29', textAlign: 'center' },
  cartShowcasePrice: { fontSize: 14, color: '#2E9D6A', fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  interactiveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  addToCartBtn: {
    backgroundColor: '#0E4A35', borderRadius: 16, paddingHorizontal: 24,
    paddingVertical: 12
  },
  addToCartText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  btnPressed: { opacity: 0.8 },

  // Delivery Tab Styles
  trackContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 16, height: 64, borderWidth: 1, borderColor: '#E0E6E2',
    justifyContent: 'center', paddingHorizontal: 20, position: 'relative',
  },
  trackLine: { height: 4, backgroundColor: '#E9F5EF', borderRadius: 2, width: '100%' },
  riderSprite: { position: 'absolute', left: 20, top: 18 },
  riderEmoji: { fontSize: 24 },
  destinationMarker: { position: 'absolute', right: 20, top: 20 },
  destEmoji: { fontSize: 20 },
  simBtn: { backgroundColor: '#0E4A35', borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 10 },
  simBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  markerShowcase: {
    height: 160, backgroundColor: '#FAF6F0', borderRadius: 24,
    borderWidth: 1, borderColor: '#E0E6E2', justifyContent: 'center',
    alignItems: 'center', gap: 10
  },
  markerLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  timelineBoxContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 18,
  },
  timelineControlRow: { flexDirection: 'row', gap: 10 },
  timelineCtrlBtn: {
    flex: 1, backgroundColor: '#E9F5EF', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0',
  },
  timelineCtrlBtnText: { color: '#0E4A35', fontSize: 11, fontWeight: 'bold' },
  triggerModalBtn: {
    backgroundColor: '#E9F5EF', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0'
  },
  triggerModalBtnText: { color: '#0E4A35', fontWeight: 'bold', fontSize: 14 },

  // Lottie and Splash Styles
  lottieContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 16
  },
  lottieCanvas: {
    height: 180, backgroundColor: '#FAF6F0', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center'
  },
  mockLottiePath: {
    width: 80, height: 80, backgroundColor: '#E9F5EF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#2EC17E'
  },
  lottieControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lottieControlBtn: {
    backgroundColor: '#0E4A35', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 8
  },
  lottieControlBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  lottieFrameText: { fontSize: 11, color: '#7E7A74', fontWeight: '600' },

  // Overlays
  checkmarkModalOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,74,53,0.5)',
    justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: 24,
  },
  checkmarkModalSheet: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center',
    width: '100%', borderWidth: 1, borderColor: '#E0E6E2',
  },
  checkmarkModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A2F25', marginTop: 16, textAlign: 'center' },
  checkmarkModalSub: { fontSize: 12, color: '#5C6F66', marginTop: 6, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },
  checkmarkModalCloseBtn: { backgroundColor: '#0E4A35', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 24 },
  checkmarkModalCloseText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

  // Splash Overlay
  splashOverlayContainer: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#0A2B19',
    justifyContent: 'center', alignItems: 'center', zIndex: 100000
  },
  splashLogoContainer: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20
  },
  splashTitleText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  splashSubText: { fontSize: 13, color: '#A2B5AD', marginBottom: 40 },
  splashCloseBtn: {
    backgroundColor: '#2E9D6A', borderRadius: 16, paddingHorizontal: 24,
    paddingVertical: 14
  },
  splashCloseText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  // Branding Studio Styles
  brandingControlCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 16
  },
  brandingCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0E4A35' },
  brandingCardSub: { fontSize: 11, color: '#5C6F66', lineHeight: 16 },
  themeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8
  },
  themeSelectBtn: {
    width: '22%', backgroundColor: '#FAF6F0', borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E6E2', paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', gap: 4
  },
  themeSelectBtnActive: {
    backgroundColor: '#0E4A35', borderColor: '#0E4A35'
  },
  themeSelectIcon: { fontSize: 20 },
  themeSelectLabel: { fontSize: 8, fontWeight: 'bold', color: '#5C6F66', textAlign: 'center' },
  themeSelectLabelActive: { color: '#FFFFFF' },
  syncButton: {
    borderRadius: 16, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10
  },
  syncButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  statsPanel: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#E0E6E2', gap: 10
  },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  statKey: { fontSize: 12, fontWeight: 'bold', color: '#5C6F66' },
  statVal: { fontSize: 12, fontWeight: 'bold', color: '#2C2B29' },
  colorBlock: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)'
  },
  logHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10
  },
  clearLogsText: {
    fontSize: 11, fontWeight: 'bold', color: '#DC2626', marginTop: 14
  },
  logsBox: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    minHeight: 120, maxHeight: 200, borderWidth: 1, borderColor: '#334155'
  },
  emptyLogText: { color: '#64748B', fontSize: 11, fontStyle: 'italic' },
  logText: {
    color: '#38BDF8', fontSize: 10, fontFamily: 'monospace',
    lineHeight: 14, marginBottom: 4
  }
});
