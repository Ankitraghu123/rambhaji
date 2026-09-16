// src/core/utils/idUtils.js
// UUID generation for idempotency keys and queue IDs

import 'react-native-get-random-values'; // Polyfill for uuid in React Native

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a cryptographically random UUID v4.
 * Used as idempotency keys for all API mutations.
 * @returns {string} UUID v4 string
 */
export function generateId() {
  return uuidv4();
}
