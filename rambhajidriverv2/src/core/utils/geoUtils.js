// src/core/utils/geoUtils.js
// Geospatial utility functions used for delivery geofencing

/**
 * Calculate the distance in meters between two GPS coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point A
 * @param {number} lon1 - Longitude of point A
 * @param {number} lat2 - Latitude of point B
 * @param {number} lon2 - Longitude of point B
 * @returns {number} Distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if the driver is within the allowed delivery radius.
 *
 * @param {object} driverCoords - { latitude, longitude }
 * @param {object} orderCoords  - { latitude, longitude }
 * @param {number} radiusMeters - Allowed radius (default: 100m)
 * @returns {{ valid: boolean, distanceMeters: number }}
 */
export function validateGeofence(driverCoords, orderCoords, radiusMeters = 100) {
  const distanceMeters = haversineDistance(
    driverCoords.latitude,
    driverCoords.longitude,
    orderCoords.latitude,
    orderCoords.longitude
  );

  return {
    valid: distanceMeters <= radiusMeters,
    distanceMeters: Math.round(distanceMeters),
  };
}
