// app/(tabs)/map.js
// SCR-06: Live route map with Leaflet OpenStreetMap tiles and proximity-based route optimization
// Redesigned with Nearest-Neighbor route planning (closest stops first) and custom floating cards

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Linking, Animated, Easing, TouchableNativeFeedback
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSelector } from 'react-redux';
import { s, vs, ms } from '../../src/core/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LocationVerificationService from '../../src/core/security/LocationVerificationService';
import RouteService from '../../src/features/routes/services/RouteService';
import { haversineDistance } from '../../src/core/utils/geoUtils';
import { truncate } from '../../src/core/utils/formatUtils';
import { PulsingDot, triggerHaptic } from '../../src/components/common/Motion';

// Local selectors to avoid Metro resolution circularity or undefined issues
const selectAllOrders = (state) => state.route?.orders || [];

const STATUS_COLORS = {
  ASSIGNED:   '#00B4D8', // Sky Blue / Cyan
  IN_TRANSIT: '#E024E3', // Neon Magenta Pink
  COMPLETED:  '#1D4ED8', // Royal Electric Blue
  RETURNED:   '#EF4444', // Red
};

const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; background-color: #F8FAFC; }
    html, body, #map { height: 100vh; width: 100vw; }
    .driver-pin {
      display: flex;
      justify-content: center;
      align-items: center;
      background: white;
      border: 2px solid #00B4D8;
      border-radius: 50%;
      font-size: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: relative;
    }
    .driver-pin::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid #22C55E;
      animation: pulse 1.8s infinite ease-out;
      pointer-events: none;
      box-sizing: border-box;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    .order-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .order-pin-body {
      color: white;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .order-pin-triangle {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid;
      margin-top: -1px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([23.2500, 77.4100], 13);
    
    L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var driverMarker = null;
    var orderMarkers = {};
    var routePolyline = null;

    window.updateMapData = function(driverLoc, orders, selectedOrderId) {
      if (driverLoc) {
        var driverLatLng = [driverLoc.latitude, driverLoc.longitude];
        if (!driverMarker) {
          var driverIcon = L.divIcon({
            html: '<span style="line-height:28px;">🚗</span>',
            className: 'driver-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          driverMarker = L.marker(driverLatLng, { icon: driverIcon }).addTo(map);
        } else {
          // Smooth driver location interpolation
          var startLatLng = driverMarker.getLatLng();
          var startTime = performance.now();
          var duration = 1000;

          function animateStep(timestamp) {
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var lat = startLatLng.lat + (driverLatLng[0] - startLatLng.lat) * progress;
            var lng = startLatLng.lng + (driverLatLng[1] - startLatLng.lng) * progress;
            driverMarker.setLatLng([lat, lng]);

            if (progress < 1) {
              requestAnimationFrame(animateStep);
            }
          }
          requestAnimationFrame(animateStep);
        }
      }

      for (var id in orderMarkers) {
        map.removeLayer(orderMarkers[id]);
      }
      orderMarkers = {};

      var coords = [];
      if (driverLoc) {
        coords.push([driverLoc.latitude, driverLoc.longitude]);
      }

      orders.forEach(function(order, idx) {
        var lat = order.latitude || order.lat;
        var lng = order.longitude || order.lng;
        if (lat && lng) {
          var latLng = [lat, lng];
          coords.push(latLng);

          var stopNum = idx + 1;
          var isSelected = order.id === selectedOrderId;
          var color = idx === 0 ? '#00B4D8' : '#1D4ED8';
          if (isSelected) color = '#E024E3'; // distinct selected color
          var sizeVal = isSelected ? 32 : 24;
          
          var pinIcon = L.divIcon({
            html: '<div class="order-pin">' +
                    '<div class="order-pin-body" style="background-color:'+color+'; width:'+sizeVal+'px; height:'+sizeVal+'px; font-size:'+(isSelected ? 14 : 11)+'px; line-height:'+sizeVal+'px;">'+stopNum+'</div>' +
                    '<div class="order-pin-triangle" style="border-top-color:'+color+'"></div>' +
                  '</div>',
            className: 'custom-order-marker',
            iconSize: [sizeVal, sizeVal + 6],
            iconAnchor: [sizeVal / 2, sizeVal + 6]
          });

          var marker = L.marker(latLng, { icon: pinIcon }).addTo(map);
          marker.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECT_ORDER',
              orderId: order.id
            }));
          });
          orderMarkers[order.id] = marker;
        }
      });

      if (routePolyline) {
        map.removeLayer(routePolyline);
      }
      if (coords.length > 1) {
        // Draw polyline progressively
        var currentCoords = [coords[0]];
        routePolyline = L.polyline(currentCoords, {
          color: '#00B4D8',
          weight: 4,
          opacity: 0.8
        }).addTo(map);

        var cIdx = 1;
        function drawNextPoint() {
          if (cIdx < coords.length) {
            currentCoords.push(coords[cIdx]);
            routePolyline.setLatLngs(currentCoords);
            cIdx++;
            setTimeout(drawNextPoint, 120);
          }
        }
        drawNextPoint();
      }
    };

    window.zoomInMap = function() {
      map.zoomIn();
    };

    window.zoomOutMap = function() {
      map.zoomOut();
    };

    window.focusLocation = function(lat, lng) {
      map.flyTo([lat, lng], 15, {
        animate: true,
        duration: 1.2
      });
    };

    window.fitAllBounds = function(driverLoc, orders) {
      var bounds = [];
      if (driverLoc) {
        bounds.push([driverLoc.latitude, driverLoc.longitude]);
      }
      orders.forEach(function(o) {
        var lat = o.latitude || o.lat;
        var lng = o.longitude || o.lng;
        if (lat && lng) {
          bounds.push([lat, lng]);
        }
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1.5
        });
      }
    };
  </script>
</body>
</html>
`;

export default function MapScreen() {
  const orders = useSelector(selectAllOrders);
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [driverLocation, setDriverLocation] = useState(null);
  const [optimizedOrders, setOptimizedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [locationSub, setLocationSub] = useState(null);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['12%', '45%', '90%'], []);
  const [sheetIndex, setSheetIndex] = useState(1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const hasCenteredRef = useRef(false);

  // Animations driven by bottom-sheet index changes
  const fabTranslateY = useRef(new Animated.Value(-vs(240))).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Entry animations
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-20)).current;
  const fabFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFadeAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(headerSlideAnim, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(fabFadeAnim, { toValue: 1, duration: 600, delay: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  // Sync state updates with WebView
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      mapRef.current.injectJavaScript(`
        if (window.updateMapData) {
          window.updateMapData(
            ${driverLocation ? JSON.stringify(driverLocation) : 'null'},
            ${JSON.stringify(optimizedOrders)},
            ${selectedOrder ? selectedOrder.id : 'null'}
          );
        }
      `);
    }
  }, [driverLocation, optimizedOrders, selectedOrder, mapLoaded]);

  const handleSheetChange = useCallback((index) => {
    setSheetIndex(index);
    triggerHaptic('light');

    let targetY = 0;
    if (index === 0) {
      targetY = 0; // Collapsed state: FABs stay down
    } else if (index === 1) {
      targetY = -vs(240); // Half expanded state: Lift FABs
    } else if (index === 2) {
      targetY = -vs(600); // Fully expanded state: Hide FABs off-top
    }

    Animated.parallel([
      Animated.spring(fabTranslateY, {
        toValue: targetY,
        useNativeDriver: true,
        damping: 15,
        stiffness: 120,
      }),
      Animated.timing(backdropOpacity, {
        toValue: index === 2 ? 0.35 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleDrawer = useCallback((visible) => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(visible ? 1 : 0);
    }
  }, []);

  useEffect(() => {
    startTracking();
    return () => { locationSub?.remove(); };
  }, []);

  const startTracking = async () => {
    const permitted = await LocationVerificationService.requestPermission();
    if (!permitted) return;

    const current = await LocationVerificationService.getCurrentLocation();
    if (current) {
      setDriverLocation(current);
      if (!hasCenteredRef.current) {
        hasCenteredRef.current = true;
        if (mapRef.current) {
          mapRef.current.injectJavaScript(`if(window.focusLocation){ window.focusLocation(${current.latitude}, ${current.longitude}); }`);
        }
      }
    }

    const sub = await LocationVerificationService.watchPosition((loc) => {
      setDriverLocation(loc);
      if (loc && !hasCenteredRef.current) {
        hasCenteredRef.current = true;
        if (mapRef.current) {
          mapRef.current.injectJavaScript(`if(window.focusLocation){ window.focusLocation(${loc.latitude}, ${loc.longitude}); }`);
        }
      }
    });
    setLocationSub(sub);
  };

  // GREEDY NEAREST-NEIGHBOR ROUTE OPTIMIZATION LOGIC
  // Sorts pending orders: starts at driver, finds closest, then from that stop finds next closest, etc.
  const getOptimizedRoute = (driverLoc, pendingList) => {
    if (!driverLoc || pendingList.length === 0) return pendingList;

    const optimized = [];
    const unvisited = [...pendingList];

    let currentCoords = {
      latitude: driverLoc.latitude,
      longitude: driverLoc.longitude,
    };

    while (unvisited.length > 0) {
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const order = unvisited[i];
        const lat = order.latitude || order.lat;
        const lng = order.longitude || order.lng;
        if (!lat || !lng) continue;

        const dist = haversineDistance(
          currentCoords.latitude,
          currentCoords.longitude,
          lat,
          lng
        );

        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      const nextStop = unvisited.splice(closestIdx, 1)[0];
      optimized.push(nextStop);
      currentCoords = {
        latitude: nextStop.latitude || nextStop.lat,
        longitude: nextStop.longitude || nextStop.lng,
      };
    }

    return optimized;
  };

  // Recalculate optimized route plan when driver location or orders list updates
  useEffect(() => {
    const pending = orders.filter(
      (o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT'
    );

    if (driverLocation && pending.length > 0) {
      const sorted = getOptimizedRoute(driverLocation, pending);
      setOptimizedOrders(sorted);

      // Heuristic: If mock data coordinates are far from current location (e.g. > 5km), reload route to align
      const firstPending = pending[0];
      const lat = firstPending.latitude || firstPending.lat;
      const lng = firstPending.longitude || firstPending.lng;
      if (lat && lng) {
        const dist = haversineDistance(driverLocation.latitude, driverLocation.longitude, lat, lng);
        if (dist > 5000) {
          console.log('[MapScreen] Mock data coordinates are far from current location. Re-aligning...');
          RouteService.loadTodaysRoute();
        }
      }
    } else {
      setOptimizedOrders(pending);
    }
  }, [orders, driverLocation]);

  // Set default selected order to the closest stop (Stop 1) on load
  useEffect(() => {
    if (optimizedOrders.length > 0 && !selectedOrder) {
      setSelectedOrder(optimizedOrders[0]);
    }
  }, [optimizedOrders]);

  // If selectedOrder is completed/no longer pending, switch to next closest pending stop
  useEffect(() => {
    if (selectedOrder) {
      const stillPending = optimizedOrders.some((o) => o.id === selectedOrder.id);
      if (!stillPending) {
        setSelectedOrder(optimizedOrders.length > 0 ? optimizedOrders[0] : null);
      }
    }
  }, [optimizedOrders, selectedOrder]);

  const focusOnDriver = () => {
    if (driverLocation && mapRef.current) {
      mapRef.current.injectJavaScript(`if(window.focusLocation){ window.focusLocation(${driverLocation.latitude}, ${driverLocation.longitude}); }`);
    }
  };

  const handleZoom = (zoomIn) => {
    if (mapRef.current) {
      mapRef.current.injectJavaScript(zoomIn ? 'if(window.zoomInMap){ window.zoomInMap(); }' : 'if(window.zoomOutMap){ window.zoomOutMap(); }');
    }
  };

  const getDistanceToOrder = (order) => {
    const lat = order.latitude || order.lat;
    const lng = order.longitude || order.lng;
    if (!driverLocation || !lat || !lng) return null;
    const meters = haversineDistance(
      driverLocation.latitude, driverLocation.longitude,
      lat, lng
    );
    return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
  };

  const handleCall = () => {
    if (selectedOrder) {
      Linking.openURL(`tel:${selectedOrder.customerPhone || selectedOrder.phone}`);
    }
  };

  const handleNavigate = () => {
    if (selectedOrder) {
      const lat = selectedOrder.latitude || selectedOrder.lat;
      const lng = selectedOrder.longitude || selectedOrder.lng;
      if (!lat || !lng) return;
      
      const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${lat},${lng}`;
      const label = encodeURIComponent(selectedOrder.customerName || 'Delivery Location');
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      });

      Linking.openURL(url).catch(() => {
        // Fallback to web google maps
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(webUrl);
      });
    }
  };

  // Compile route coordinates connecting stops sequentially in optimized order
  const routeCoordinates = [];
  if (driverLocation) {
    routeCoordinates.push({
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude
    });
  }
  optimizedOrders.forEach((o) => {
    const lat = o.latitude || o.lat;
    const lng = o.longitude || o.lng;
    if (lat && lng) {
      routeCoordinates.push({ latitude: lat, longitude: lng });
    }
  });

  // Calculate initial region
  const firstCoord = driverLocation || (selectedOrder ? { latitude: selectedOrder.latitude || selectedOrder.lat, longitude: selectedOrder.longitude || selectedOrder.lng } : { latitude: 28.6139, longitude: 77.2090 });
  const initialRegion = {
    latitude: firstCoord.latitude,
    longitude: firstCoord.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Next two stops in optimized sequence
  const stop1 = optimizedOrders[0];
  const stop2 = optimizedOrders[1];

  // Calculate next logical stop after the selected order (nearest to selected order)
  const getNextLogicalStopAfterSelected = () => {
    if (!selectedOrder || optimizedOrders.length <= 1) return null;
    const remaining = optimizedOrders.filter(o => o.id !== selectedOrder.id);
    if (remaining.length === 0) return null;
    const selLat = selectedOrder.latitude || selectedOrder.lat;
    const selLng = selectedOrder.longitude || selectedOrder.lng;
    if (!selLat || !selLng) return remaining[0];
    
    let closest = remaining[0];
    let minDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const order = remaining[i];
      const lat = order.latitude || order.lat;
      const lng = order.longitude || order.lng;
      if (!lat || !lng) continue;
      const dist = haversineDistance(selLat, selLng, lat, lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = order;
      }
    }
    return closest;
  };
  // FAB press scale animation helper
  const useFABScale = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, tension: 300, friction: 10 }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
    return { scale, onPressIn, onPressOut };
  };
  const locationFAB = useFABScale();
  const zoomInFAB = useFABScale();
  const zoomOutFAB = useFABScale();
  const toggleFAB = useFABScale();

  const nextLogicalStop = getNextLogicalStopAfterSelected();

  const stopIndex = selectedOrder ? optimizedOrders.findIndex(o => o.id === selectedOrder.id) + 1 : 0;
  const totalStops = optimizedOrders.length;
  const distToOrder = selectedOrder ? getDistanceToOrder(selectedOrder) : null;
  const isPrepaid = selectedOrder?.paymentMode !== 'COD';

  return (
    <View style={styles.root}>
      {/* ── WEBVIEW MAP (unchanged) ─────────────────────────────── */}
      <WebView
        ref={mapRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: leafletHTML }}
        onLoadEnd={() => {
          setMapLoaded(true);
          if (mapRef.current) {
            mapRef.current.injectJavaScript(`
              if (window.updateMapData) {
                window.updateMapData(
                  ${driverLocation ? JSON.stringify(driverLocation) : 'null'},
                  ${JSON.stringify(optimizedOrders)},
                  ${selectedOrder ? selectedOrder.id : 'null'}
                );
              }
              if (window.fitAllBounds) {
                window.fitAllBounds(
                  ${driverLocation ? JSON.stringify(driverLocation) : 'null'},
                  ${JSON.stringify(optimizedOrders)}
                );
              }
            `);
          }
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SELECT_ORDER') {
              const order = optimizedOrders.find(o => o.id === data.orderId);
              if (order) {
                setSelectedOrder(order);
                toggleDrawer(true);
              }
            }
          } catch (e) {
            console.warn('Error reading WebView message:', e);
          }
        }}
      />

      {/* ── PREMIUM FLOATING TOP ADDRESS GLASS CARD ──────────────── */}
      <Animated.View
        style={[
          styles.topGlassCard,
          {
            opacity: headerFadeAnim,
            transform: [{ translateY: headerSlideAnim }],
            top: insets.top + vs(10),
          }
        ]}
      >
        {/* Left: GPS status + address */}
        <View style={styles.topCardLeft}>
          <View style={styles.topCardGpsBadge}>
            <PulsingDot color="#22C55E" size={7} />
            <Text style={styles.topCardGpsText}>LIVE GPS</Text>
          </View>
          <Text style={styles.topCardAddress} numberOfLines={1}>
            📍 {selectedOrder?.address || 'Rambhaji Route'}
          </Text>
          {selectedOrder && (
            <Text style={styles.topCardMeta} numberOfLines={1}>
              {selectedOrder.customerName} · Stop {stopIndex}/{totalStops}
            </Text>
          )}
        </View>
        {/* Right: distance + ETA */}
        <View style={styles.topCardRight}>
          {distToOrder ? (
            <>
              <Text style={styles.topCardDistance}>{distToOrder}</Text>
              <Text style={styles.topCardEtaLabel}>ETA ~8 min</Text>
            </>
          ) : (
            <Text style={styles.topCardStops}>{optimizedOrders.length} stops</Text>
          )}
        </View>
      </Animated.View>

      {/* ── PREMIUM CLASSIC ZOOM CONTROLS (Leaflet-style) ─────────── */}
      <Animated.View style={[styles.zoomCluster, { opacity: fabFadeAnim, top: insets.top + vs(100) }]}>
        <Animated.View style={{ transform: [{ scale: zoomInFAB.scale }] }}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPressIn={zoomInFAB.onPressIn}
            onPressOut={zoomInFAB.onPressOut}
            onPress={() => { triggerHaptic('light'); handleZoom(true); }}
            activeOpacity={0.85}
          >
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.zoomDivider} />
        <Animated.View style={{ transform: [{ scale: zoomOutFAB.scale }] }}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPressIn={zoomOutFAB.onPressIn}
            onPressOut={zoomOutFAB.onPressOut}
            onPress={() => { triggerHaptic('light'); handleZoom(false); }}
            activeOpacity={0.85}
          >
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* ── PREMIUM RIGHT FAB CLUSTER ─────────────────────────────── */}
      <Animated.View
        style={[
          styles.fabCluster,
          {
            opacity: fabFadeAnim,
            transform: [{ translateY: fabTranslateY }]
          }
        ]}
      >
        {/* My Location FAB */}
        <Animated.View style={{ transform: [{ scale: locationFAB.scale }] }}>
          <TouchableOpacity
            style={styles.fab}
            onPressIn={locationFAB.onPressIn}
            onPressOut={locationFAB.onPressOut}
            onPress={() => { triggerHaptic('light'); focusOnDriver(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.fabIcon}>🎯</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Toggle Sheet FAB */}
        {orders.length > 0 && (
          <Animated.View style={{ transform: [{ scale: toggleFAB.scale }] }}>
            <TouchableOpacity
              style={styles.fab}
              onPressIn={toggleFAB.onPressIn}
              onPressOut={toggleFAB.onPressOut}
              onPress={() => { triggerHaptic('light'); toggleDrawer(sheetIndex === 0); }}
              activeOpacity={0.85}
            >
              <Text style={styles.fabIcon}>{sheetIndex > 0 ? '🗺️' : '📋'}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* ── PREMIUM BACKDROP DIM (Active when 90% expanded) ────────── */}
      {sheetIndex === 2 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: '#000000', opacity: backdropOpacity, zIndex: 12 }
          ]}
          pointerEvents="auto"
        />
      )}

      {/* ── PREMIUM DRAGGABLE BOTTOM SHEET ────────────────────────── */}
      {orders.length > 0 && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={1} // Default index = 1 (45% snap point)
          onChange={handleSheetChange}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
          style={{ zIndex: 15 }}
        >
          {optimizedOrders.length > 0 ? (
            <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
              {sheetIndex === 0 && selectedOrder ? (
                // ───── 12% COLLAPSED STATE LAYOUT ─────
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => { triggerHaptic('light'); bottomSheetRef.current?.snapToIndex(1); }}
                  style={styles.collapsedRow}
                >
                  <View style={{ flex: 1, gap: vs(2) }}>
                    <Text style={styles.collapsedTitle} numberOfLines={1}>
                      👤 {selectedOrder.customerName}
                    </Text>
                    <Text style={styles.collapsedSubtitle} numberOfLines={1}>
                      📍 {selectedOrder.address}
                    </Text>
                  </View>
                  <View style={styles.collapsedRight}>
                    <Text style={styles.collapsedDistance}>{distToOrder || '—'}</Text>
                    <TouchableOpacity
                      style={styles.collapsedCTA}
                      onPress={() => { triggerHaptic('medium'); router.push(`/order/${selectedOrder.id}`); }}
                    >
                      <Text style={styles.collapsedCTAText}>Deliver →</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ) : (
                // ───── EXPANDED (45% & 90%) STATE LAYOUT ─────
                <>
                  {/* ─ Route label row ─ */}
                  <View style={styles.routeLabelRow}>
                    <View style={styles.routeLabelLeft}>
                      <View style={styles.routeBadge}>
                        <Text style={styles.routeBadgeText}>
                          {selectedOrder ? `Stop ${stopIndex} of ${totalStops}` : `${totalStops} Stops`}
                        </Text>
                      </View>
                      <Text style={styles.routeTitle}>
                        {selectedOrder ? 'Selected Order' : '⚡ Delivery Route'}
                      </Text>
                    </View>
                    <View style={styles.liveStatusBadge}>
                      <PulsingDot color="#22C55E" size={6} />
                      <Text style={styles.liveStatusText}>Online</Text>
                    </View>
                  </View>

                  {selectedOrder ? (
                    <>
                      {/* ─ Premium Order Card ─ */}
                      <View style={styles.orderCard}>
                        {/* Avatar + Name row */}
                        <View style={styles.orderCardHeader}>
                          <View style={styles.customerAvatar}>
                            <Text style={styles.customerAvatarText}>
                              {(selectedOrder.customerName || 'C')[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.orderCardHeaderMeta}>
                            <View style={styles.nameVerifiedRow}>
                              <Text style={styles.orderCustomerName} numberOfLines={1}>
                                {selectedOrder.customerName}
                              </Text>
                              <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedBadgeText}>✓</Text>
                              </View>
                            </View>
                            <Text style={styles.orderAddressLine} numberOfLines={1}>
                              📍 {selectedOrder.address}
                            </Text>
                          </View>
                          {distToOrder && (
                            <View style={styles.orderDistBlock}>
                              <Text style={styles.orderDistValue}>{distToOrder}</Text>
                              <Text style={styles.orderDistLabel}>~8 min</Text>
                            </View>
                          )}
                        </View>

                        {/* Chips row */}
                        <View style={styles.chipRow}>
                          <View style={styles.chip}>
                            <Text style={styles.chipText}>📦 {selectedOrder.items?.length || 0} Items</Text>
                          </View>
                          <View style={[styles.chip, isPrepaid ? styles.chipPrepaid : styles.chipCod]}>
                            <Text style={[styles.chipText, isPrepaid ? styles.chipPrepaidText : styles.chipCodText]}>
                              {isPrepaid ? '✅ PREPAID' : `💵 COD ₹${selectedOrder.codAmount}`}
                            </Text>
                          </View>
                          <View style={[styles.chip, styles.chipAssigned]}>
                            <Text style={[styles.chipText, styles.chipAssignedText]}>🚀 Assigned</Text>
                          </View>
                        </View>

                        {/* Order meta row */}
                        <View style={styles.orderMetaRow}>
                          <Text style={styles.orderMetaItem}>Order #{selectedOrder.id}</Text>
                          {nextLogicalStop && (
                            <Text style={styles.orderMetaItem} numberOfLines={1}>
                              ➔ Next: {nextLogicalStop.customerName}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* ─ Quick Action Chips ─ */}
                      <View style={styles.quickActionsRow}>
                        <TouchableOpacity
                          style={styles.quickActionBtn}
                          onPress={() => { triggerHaptic('light'); handleCall(); }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.quickActionIcon}>
                            <Text style={styles.quickActionEmoji}>📞</Text>
                          </View>
                          <Text style={styles.quickActionLabel}>Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.quickActionBtn}
                          onPress={() => { triggerHaptic('light'); handleNavigate(); }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.quickActionIcon}>
                            <Text style={styles.quickActionEmoji}>🧭</Text>
                          </View>
                          <Text style={styles.quickActionLabel}>Navigate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.quickActionBtn}
                          onPress={() => {
                            triggerHaptic('light');
                            const num = selectedOrder.customerPhone || selectedOrder.phone || '9000000002';
                            Linking.openURL(`whatsapp://send?phone=+91${num}&text=Hello, I am your Ranbhaji delivery partner.`);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.quickActionIcon}>
                            <Text style={styles.quickActionEmoji}>💬</Text>
                          </View>
                          <Text style={styles.quickActionLabel}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.quickActionBtn}
                          onPress={() => { triggerHaptic('light'); router.push(`/order/${selectedOrder.id}`); }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.quickActionIcon}>
                            <Text style={styles.quickActionEmoji}>📍</Text>
                          </View>
                          <Text style={styles.quickActionLabel}>Details</Text>
                        </TouchableOpacity>
                      </View>

                      {/* ─ Primary CTA ─ */}
                      <TouchableOpacity
                        style={styles.deliverCTA}
                        activeOpacity={0.88}
                        onPress={() => { triggerHaptic('medium'); router.push(`/order/${selectedOrder.id}`); }}
                      >
                        <LinearGradient
                          colors={['#22C55E', '#166534']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.deliverCTAGradient}
                        >
                          <Text style={styles.deliverCTAText}>Deliver First →</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* ─ Additional Timeline content (visible only when fully expanded to 90%) ─ */}
                      {sheetIndex === 2 && (
                        <View style={{ marginTop: vs(24) }}>
                          <Text style={styles.detailsSectionTitle}>📋 Route Stops Timeline</Text>
                          <View style={styles.timelineContainer}>
                            {optimizedOrders.map((stop, idx) => {
                              const isCurrent = stop.id === selectedOrder.id;
                              return (
                                <TouchableOpacity
                                  key={stop.id}
                                  style={[styles.timelineRow, isCurrent && styles.timelineRowSelected]}
                                  onPress={() => { setSelectedOrder(stop); bottomSheetRef.current?.snapToIndex(1); }}
                                  activeOpacity={0.8}
                                >
                                  <View style={styles.timelineMarker}>
                                    <View style={[styles.timelineDot, { backgroundColor: isCurrent ? '#22C55E' : '#64748B' }]}>
                                      <Text style={styles.timelineDotText}>{idx + 1}</Text>
                                    </View>
                                    {idx < optimizedOrders.length - 1 && <View style={styles.timelineLine} />}
                                  </View>
                                  <View style={styles.timelineContent}>
                                    <View style={styles.timelineHeaderRow}>
                                      <Text style={styles.timelineLabel}>{isCurrent ? 'ACTIVE STOP' : `STOP #${idx + 1}`}</Text>
                                      {isCurrent && <Text style={styles.timelineDistance}>{distToOrder}</Text>}
                                    </View>
                                    <Text style={styles.timelineValue}>{stop.customerName}</Text>
                                    <Text style={styles.timelineAddress} numberOfLines={1}>{stop.address}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </>
                  ) : (
                    // ─ Route timeline (no selection) ─
                    <View style={styles.timelineContainer}>
                      {stop1 && (
                        <TouchableOpacity
                          style={[styles.timelineRow, selectedOrder?.id === stop1.id && styles.timelineRowSelected]}
                          onPress={() => { setSelectedOrder(stop1); toggleDrawer(true); }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.timelineMarker}>
                            <View style={[styles.timelineDot, { backgroundColor: '#22C55E' }]}>
                              <Text style={styles.timelineDotText}>1</Text>
                            </View>
                            {stop2 && <View style={styles.timelineLine} />}
                          </View>
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineHeaderRow}>
                              <Text style={styles.timelineLabel}>NEXT DELIVERY</Text>
                              <Text style={styles.timelineDistance}>{driverLocation ? getDistanceToOrder(stop1) : '—'}</Text>
                            </View>
                            <Text style={styles.timelineValue}>{stop1.customerName}</Text>
                            <Text style={styles.timelineAddress} numberOfLines={1}>{stop1.address}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {stop2 && (
                        <TouchableOpacity
                          style={[styles.timelineRow, { marginBottom: 0 }, selectedOrder?.id === stop2.id && styles.timelineRowSelected]}
                          onPress={() => { setSelectedOrder(stop2); toggleDrawer(true); }}
                          activeOpacity={0.8}
                        >
                          <View style={styles.timelineMarker}>
                            <View style={[styles.timelineDot, { backgroundColor: '#2A82C7' }]}>
                              <Text style={styles.timelineDotText}>2</Text>
                            </View>
                          </View>
                          <View style={styles.timelineContent}>
                            <View style={styles.timelineHeaderRow}>
                              <Text style={styles.timelineLabel}>FOLLOW-UP STOP</Text>
                              <Text style={styles.timelineDistance}>Next Up</Text>
                            </View>
                            <Text style={styles.timelineValue}>{stop2.customerName}</Text>
                            <Text style={styles.timelineAddress} numberOfLines={1}>{stop2.address}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </>
              )}
            </BottomSheetScrollView>
          ) : (
            <BottomSheetScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.allDoneContainer}>
                <Text style={styles.allDoneEmoji}>🎉</Text>
                <Text style={styles.allDoneTitle}>All Deliveries Complete!</Text>
                <Text style={styles.allDoneSubtitle}>Great work today, driver.</Text>
                <TouchableOpacity
                  style={styles.deliverCTA}
                  onPress={() => router.push('/(tabs)/deliveries')}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#22C55E', '#166534']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.deliverCTAGradient}
                  >
                    <Text style={styles.deliverCTAText}>View Deliveries →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      )}

      {/* Leaflet attribution */}
      <View style={styles.leafletAttribution}>
        <Text style={styles.attributionText}>Leaflet | © OpenStreetMap</Text>
      </View>

      {/* No GPS warning */}
      {!driverLocation && (
        <View style={[styles.noGpsCard, { top: insets.top + vs(100) }]}>
          <Text style={styles.noGpsText}>📡 Calibrating GPS…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  map: { flex: 1 },

  // ── Premium Floating Glass Address Card ───────────────────────────────────
  topGlassCard: {
    position: 'absolute',
    left: s(14),
    right: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: s(20),
    paddingVertical: vs(11),
    paddingHorizontal: s(16),
    shadowColor: '#1F2937',
    shadowOpacity: 0.12,
    shadowRadius: s(16),
    shadowOffset: { width: 0, height: vs(4) },
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 20,
  },
  topCardLeft: { flex: 1, gap: vs(2) },
  topCardGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    marginBottom: vs(1),
  },
  topCardGpsText: {
    fontSize: ms(9),
    fontWeight: 'bold',
    color: '#16A34A',
    letterSpacing: 0.8,
  },
  topCardAddress: {
    fontSize: ms(13),
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  topCardMeta: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '500',
  },
  topCardRight: {
    alignItems: 'flex-end',
    paddingLeft: s(12),
  },
  topCardDistance: {
    fontSize: ms(15),
    fontWeight: 'bold',
    color: '#16A34A',
  },
  topCardEtaLabel: {
    fontSize: ms(10),
    color: '#64748B',
    fontWeight: '500',
  },
  topCardStops: {
    fontSize: ms(13),
    fontWeight: 'bold',
    color: '#166534',
  },

  // ── Classic Leaflet Zoom Controls (clean & premium) ───────────────────────
  zoomCluster: {
    position: 'absolute',
    left: s(14),
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#1F2937',
    shadowOpacity: 0.1,
    shadowRadius: s(8),
    elevation: 6,
    zIndex: 10,
  },
  zoomBtn: {
    width: s(38),
    height: vs(38),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  zoomBtnText: {
    fontSize: ms(20),
    fontWeight: '300',
    color: '#1F2937',
    lineHeight: ms(24),
    textAlign: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // ── Premium FAB Cluster (right side) ─────────────────────────────────────
  fabCluster: {
    position: 'absolute',
    bottom: vs(30),
    right: s(14),
    gap: vs(10),
    zIndex: 10,
  },
  fab: {
    width: s(48),
    height: vs(48),
    borderRadius: s(24),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1F2937',
    shadowOpacity: 0.1,
    shadowRadius: s(10),
    shadowOffset: { width: 0, height: vs(3) },
    elevation: 7,
  },
  fabIcon: { fontSize: ms(20) },

  // ── Premium Bottom Sheet ──────────────────────────────────────────────────
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    shadowColor: '#1F2937',
    shadowOpacity: 0.1,
    shadowRadius: s(20),
    elevation: 16,
  },
  bottomSheetIndicator: {
    backgroundColor: '#CBD5E1',
    width: s(40),
    height: vs(5),
  },
  sheetScrollContent: {
    paddingHorizontal: s(18),
    paddingBottom: vs(32),
  },
  detailsSectionTitle: {
    fontSize: ms(13),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: vs(12),
    letterSpacing: 0.3,
  },

  // Collapsed State styling
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(6),
  },
  collapsedTitle: {
    fontSize: ms(16),
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'System',
  },
  collapsedSubtitle: {
    fontSize: ms(12),
    color: '#64748B',
    fontWeight: '500',
  },
  collapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  collapsedDistance: {
    fontSize: ms(15),
    fontWeight: 'bold',
    color: '#16A34A',
  },
  collapsedCTA: {
    backgroundColor: '#166534',
    borderRadius: s(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  collapsedCTAText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontWeight: 'bold',
  },

  bottomSheet: {
    position: 'absolute',
    bottom: vs(16),
    left: s(12),
    right: s(12),
    backgroundColor: '#FFFFFF',
    borderRadius: s(28),
    paddingHorizontal: s(18),
    paddingBottom: vs(20),
    paddingTop: vs(10),
    shadowColor: '#1F2937',
    shadowOpacity: 0.12,
    shadowRadius: s(24),
    shadowOffset: { width: 0, height: vs(-2) },
    elevation: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    zIndex: 15,
  },
  sheetHandle: {
    width: s(36),
    height: vs(4),
    borderRadius: s(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: vs(14),
  },

  // Route label row
  routeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  routeLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  routeBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: s(20),
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  routeBadgeText: {
    fontSize: ms(10),
    fontWeight: 'bold',
    color: '#15803D',
  },
  routeTitle: {
    fontSize: ms(13),
    fontWeight: '700',
    color: '#1F2937',
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#F0FDF4',
    borderRadius: s(20),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  liveStatusText: {
    fontSize: ms(10),
    fontWeight: 'bold',
    color: '#16A34A',
  },

  // ── Premium Order Card ────────────────────────────────────────────────────
  orderCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: s(20),
    padding: s(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: vs(14),
    gap: vs(10),
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  customerAvatar: {
    width: s(42),
    height: vs(42),
    borderRadius: s(21),
    backgroundColor: '#166534',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  customerAvatarText: {
    fontSize: ms(17),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderCardHeaderMeta: { flex: 1 },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(2),
  },
  orderCustomerName: {
    fontSize: ms(15),
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    width: s(18),
    height: vs(18),
    borderRadius: s(9),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedBadgeText: { fontSize: ms(9), color: '#15803D', fontWeight: 'bold' },
  orderAddressLine: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '500',
  },
  orderDistBlock: { alignItems: 'flex-end' },
  orderDistValue: { fontSize: ms(16), fontWeight: 'bold', color: '#16A34A' },
  orderDistLabel: { fontSize: ms(10), color: '#64748B' },

  // Chips
  chipRow: { flexDirection: 'row', gap: s(6), flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#F1F5F9',
    borderRadius: s(20),
    paddingHorizontal: s(9),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: { fontSize: ms(10), color: '#475569', fontWeight: '600' },
  chipPrepaid: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
  chipPrepaidText: { color: '#15803D' },
  chipCod: { backgroundColor: '#FFF7ED', borderColor: '#FCD34D' },
  chipCodText: { color: '#B45309' },
  chipAssigned: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipAssignedText: { color: '#1D4ED8' },

  // Order meta
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: vs(2),
  },
  orderMetaItem: {
    fontSize: ms(11),
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },

  // ── Quick Action Buttons ──────────────────────────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(14),
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: vs(5),
  },
  quickActionIcon: {
    width: s(48),
    height: vs(48),
    borderRadius: s(16),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1F2937',
    shadowOpacity: 0.04,
    shadowRadius: s(4),
    elevation: 2,
  },
  quickActionEmoji: { fontSize: ms(20) },
  quickActionLabel: {
    fontSize: ms(10),
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Primary Deliver CTA ───────────────────────────────────────────────────
  deliverCTA: {
    borderRadius: s(18),
    overflow: 'hidden',
    shadowColor: '#166534',
    shadowOpacity: 0.3,
    shadowRadius: s(12),
    elevation: 6,
  },
  deliverCTAGradient: {
    height: vs(56),
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverCTAText: {
    color: '#FFFFFF',
    fontSize: ms(15),
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },

  // ── Timeline (no selection) ───────────────────────────────────────────────
  timelineContainer: { marginBottom: vs(16) },
  timelineRow: {
    flexDirection: 'row',
    gap: s(14),
    marginBottom: vs(14),
    padding: s(10),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
  },
  timelineRowSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  timelineMarker: { alignItems: 'center', width: s(24) },
  timelineDot: {
    width: s(24),
    height: vs(24),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotText: { color: '#FFFFFF', fontSize: ms(11), fontWeight: 'bold' },
  timelineLine: { width: s(2), flex: 1, backgroundColor: '#E5E7EB', marginVertical: vs(4) },
  timelineContent: { flex: 1 },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(2),
  },
  timelineLabel: {
    fontSize: ms(9),
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  timelineDistance: { fontSize: ms(11), color: '#16A34A', fontWeight: 'bold' },
  timelineValue: { fontSize: ms(14), fontWeight: 'bold', color: '#1F2937' },
  timelineAddress: { fontSize: ms(11), color: '#64748B', marginTop: vs(1) },

  // ── All Done ──────────────────────────────────────────────────────────────
  allDoneContainer: {
    alignItems: 'center',
    paddingVertical: vs(10),
    gap: vs(6),
    marginBottom: vs(14),
  },
  allDoneEmoji: { fontSize: ms(40) },
  allDoneTitle: {
    fontSize: ms(18),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  allDoneSubtitle: {
    fontSize: ms(13),
    color: '#64748B',
    marginBottom: vs(6),
  },

  // ── Attribution + GPS fallback ────────────────────────────────────────────
  leafletAttribution: {
    position: 'absolute',
    bottom: vs(2),
    right: s(6),
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: s(4),
    paddingVertical: vs(1),
    borderRadius: s(2),
  },
  attributionText: { fontSize: ms(9), color: '#64748B', fontFamily: 'System' },

  noGpsCard: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: s(8),
    elevation: 4,
  },
  noGpsText: { color: '#D97706', fontFamily: 'System', fontSize: ms(13), fontWeight: 'bold' },
});
