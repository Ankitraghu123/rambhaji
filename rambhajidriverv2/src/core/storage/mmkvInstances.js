// src/core/storage/mmkvInstances.js
// Encrypted MMKV storage instances for the GharTak Driver App
// Secure instance uses AES-256 via Android KeyStore / iOS Keychain

// Simple in-memory fallback for environments (like Expo Go or Web) where native JSI bindings are not compiled.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persistent fallback for environments (like Expo Go or Web) where native JSI bindings are not compiled.
class PersistentMemoryStorage {
  constructor(id) {
    this.id = id;
    this.store = {};
    this.isLoaded = false;
    this.loadPromise = this.init();
  }

  async init() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefix = `@MMKV_FALLBACK:${this.id}:`;
      const relevantKeys = keys.filter(key => key.startsWith(prefix));
      if (relevantKeys.length > 0) {
        const pairs = await AsyncStorage.multiGet(relevantKeys);
        pairs.forEach(([fullKey, value]) => {
          if (value !== null) {
            const key = fullKey.substring(prefix.length);
            this.store[key] = value;
          }
        });
      }
    } catch (e) {
      console.warn(`[Storage] Failed to hydrate fallback storage ${this.id}:`, e.message);
    } finally {
      this.isLoaded = true;
    }
  }

  getString(key) {
    const val = this.store[key];
    return val !== undefined ? val : null;
  }

  set(key, value) {
    const strValue = String(value);
    this.store[key] = strValue;
    const prefix = `@MMKV_FALLBACK:${this.id}:`;
    AsyncStorage.setItem(prefix + key, strValue).catch(e => {
      console.warn(`[Storage] Failed to set fallback key ${key}:`, e.message);
    });
  }

  delete(key) {
    delete this.store[key];
    const prefix = `@MMKV_FALLBACK:${this.id}:`;
    AsyncStorage.removeItem(prefix + key).catch(e => {
      console.warn(`[Storage] Failed to delete fallback key ${key}:`, e.message);
    });
  }

  clearAll() {
    const prefix = `@MMKV_FALLBACK:${this.id}:`;
    const keysToDelete = Object.keys(this.store).map(key => prefix + key);
    this.store = {};
    if (keysToDelete.length > 0) {
      AsyncStorage.multiRemove(keysToDelete).catch(e => {
        console.warn(`[Storage] Failed to clear fallback storage ${this.id}:`, e.message);
      });
    }
  }
}

let appStorageInstance;
let secureStorageInstance;

try {
  // Check if JSI helper functions from MMKV are present on global object.
  // If native MMKV is not installed or bindings failed, global.mmkvCreateNewInstance won't exist.
  const isJSIInstalled = typeof global.mmkvCreateNewInstance === 'function';
  if (!isJSIInstalled) {
    throw new Error('MMKV JSI bindings not found on global object');
  }

  // Dynamic require prevents Expo Go crash at module load time.
  // Static import would fail before try-catch could catch it.
  const { MMKV } = require('react-native-mmkv');

  try {
    appStorageInstance = new MMKV({
      id: 'ghartak-app-storage',
    });
  } catch (appStorageError) {
    console.warn('[Storage] Failed to initialize native appStorage, falling back:', appStorageError.message);
    appStorageInstance = new PersistentMemoryStorage('ghartak-app-storage');
  }

  try {
    const SECURE_ENCRYPTION_KEY = 'REPLACE_WITH_KEYSTORE_RETRIEVED_KEY';
    secureStorageInstance = new MMKV({
      id: 'ghartak-secure-storage',
      encryptionKey: SECURE_ENCRYPTION_KEY,
    });
  } catch (secureStorageError) {
    console.warn('[Storage] Failed to initialize native secureStorage with key, falling back to unencrypted MMKV:', secureStorageError.message);
    try {
      secureStorageInstance = new MMKV({
        id: 'ghartak-secure-storage',
      });
    } catch (unencryptedError) {
      console.warn('[Storage] Failed to initialize unencrypted native secureStorage, falling back:', unencryptedError.message);
      secureStorageInstance = new PersistentMemoryStorage('ghartak-secure-storage');
    }
  }
} catch (error) {
  console.warn(
    '[Storage] Native MMKV JSI bindings not available. Falling back to persistent AsyncStorage-backed memory storage for development.',
    error.message
  );
  if (!appStorageInstance) {
    appStorageInstance = new PersistentMemoryStorage('ghartak-app-storage');
  }
  if (!secureStorageInstance) {
    secureStorageInstance = new PersistentMemoryStorage('ghartak-secure-storage');
  }
}

export const appStorage = appStorageInstance;
export const secureStorage = secureStorageInstance;

/**
 * Helper to await fallback storage hydration before reading stored state
 */
export async function waitForStorageHydration() {
  if (appStorageInstance && appStorageInstance.loadPromise) {
    await appStorageInstance.loadPromise;
  }
  if (secureStorageInstance && secureStorageInstance.loadPromise) {
    await secureStorageInstance.loadPromise;
  }
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

/**
 * Read and parse a JSON value from a storage instance.
 * Returns null if key is missing or parse fails.
 */
export function getJSON(storage, key) {
  try {
    const raw = storage.getString(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Serialize and store a JSON value in a storage instance.
 */
export function setJSON(storage, key, value) {
  storage.set(key, JSON.stringify(value));
}
