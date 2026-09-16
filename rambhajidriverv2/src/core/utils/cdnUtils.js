// src/core/utils/cdnUtils.js
// CDN helper functions to resolve static assets and image resources.

import { CDN_BASE_URL } from '../../config/constants';

/**
 * Resolves a local or relative asset path to its equivalent CDN URL.
 * Leaves absolute URLs (http, https, file scheme) untouched.
 *
 * @param {string} path - Relative asset path (e.g., 'images/logo.png')
 * @returns {string} - Full CDN URL or unchanged absolute path.
 */
export function getCDNUrl(path) {
  if (!path) return '';
  
  // Return unchanged if it's already an absolute URL or local file path
  if (
    path.startsWith('http://') || 
    path.startsWith('https://') || 
    path.startsWith('file://') || 
    path.startsWith('data:')
  ) {
    return path;
  }

  // Clean starting slash and prepend CDN base
  const cleanPath = path.replace(/^\//, '');
  return `${CDN_BASE_URL}/${cleanPath}`;
}
