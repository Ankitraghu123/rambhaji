// src/core/branding/DynamicBrandingService.js
// High-performance dynamic branding cache manager and state sync.

import { appStorage, getJSON, setJSON } from '../storage/mmkvInstances';
import { BRANDING_THEMES, DEFAULT_THEME } from './brandingThemes';

const STORAGE_KEYS = {
  ACTIVE_EVENT_ID: 'branding:active_event_id',
  OVERRIDE_EVENT_ID: 'branding:override_event_id',
  EVENT_ASSET_CACHE: 'branding:asset_cache',
  LAST_SYNC_TIME: 'branding:last_sync_time',
};

class DynamicBrandingService {
  constructor() {
    this.listeners = new Set();
    this.activeTheme = DEFAULT_THEME;
    this.isPrefetching = false;
    this.logs = [];

    // Hydrate state from cache
    this.hydrate();
  }

  // Subscribe to changes in active branding configuration
  subscribe(callback) {
    this.listeners.add(callback);
    // Emit initial config
    callback(this.activeTheme);
    return () => this.listeners.delete(callback);
  }

  // Notify all active subscribers
  emit() {
    this.listeners.forEach((callback) => callback(this.activeTheme));
  }

  // Log progress/prefetch alerts
  log(message) {
    const time = new Date().toLocaleTimeString();
    const logStr = `[${time}] ${message}`;
    this.logs.unshift(logStr);
    if (this.logs.length > 50) this.logs.pop();
    console.log(`[BrandingEngine] ${message}`);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // Hydrate theme configuration from MMKV cache
  hydrate() {
    this.activeTheme = DEFAULT_THEME;
    this.log(`Locked corporate theme branding: ${this.activeTheme.name}`);
  }

  // Simulate remote config fetch check
  async checkForBrandingUpdates() {
    // locked to default corporate theme
    this.hydrate();
    this.emit();
  }

  // Prefetch event assets (images, banners, vector components) locally
  async prefetchEventAssets(campaign) {
    if (this.isPrefetching) return;
    this.isPrefetching = true;
    this.log(`Prefetching visual assets for event: ${campaign.name}...`);

    try {
      // Simulate fetching images and caching them inside MMKV asset index
      const assetUrls = [campaign.bannerImage, campaign.mascotUrl].filter(Boolean);
      
      for (const url of assetUrls) {
        this.log(`Prefetching asset resource: ${url}`);
        // Simulate network delay / buffering
        await new Promise((resolve) => setTimeout(resolve, 800));
        this.log(`Cached resource successfully: ${url}`);
      }

      // Record cached asset details
      setJSON(appStorage, STORAGE_KEYS.EVENT_ASSET_CACHE, {
        eventId: campaign.eventId,
        cachedAt: Date.now(),
        resourcesCount: assetUrls.length,
      });

      this.log(`Finished prefetching all event resources for: ${campaign.name}`);
    } catch (e) {
      this.log(`Failed to prefetch assets: ${e.message}`);
    } finally {
      this.isPrefetching = false;
    }
  }

  // Set local manual override (for Showroom testing)
  setOverrideEvent(eventId) {
    if (eventId && BRANDING_THEMES[eventId]) {
      this.log(`Manually overriding branding event to: ${eventId}`);
      appStorage.set(STORAGE_KEYS.OVERRIDE_EVENT_ID, eventId);
    } else {
      this.log('Clearing branding manual override');
      appStorage.delete(STORAGE_KEYS.OVERRIDE_EVENT_ID);
    }
    this.hydrate();
    this.emit();
  }

  getOverrideEventId() {
    return appStorage.getString(STORAGE_KEYS.OVERRIDE_EVENT_ID) || null;
  }

  // Simulated Remote Config fetch behavior based on calendar ranges
  simulateBackendFetch() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple calendar logic or simulated API config.
        // We can check if any override or backend simulated active date is matching.
        // In real app, this query returns details from Firebase/LaunchDarkly/REST.
        const month = new Date().getMonth(); // 0-Indexed
        const date = new Date().getDate();

        // Let's simulate that if we check the date, we determine if there's any calendar match:
        // E.g., December matches Christmas
        if (month === 11) {
          resolve({
            eventId: 'christmas',
            name: 'Christmas Winter Holidays',
            bannerImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
            mascotUrl: 'christmas_snowman_vector',
          });
        } else if (month === 9 && date >= 25) { // Late Oct matches Halloween
          resolve({
            eventId: 'halloween',
            name: 'Halloween Spooktacular',
            bannerImage: 'https://images.unsplash.com/photo-1508349682668-ef11aae7d172?w=500',
            mascotUrl: 'halloween_pumpkin_vector',
          });
        } else {
          // No active general event
          resolve(null);
        }
      }, 1000);
    });
  }
}

export default new DynamicBrandingService();
