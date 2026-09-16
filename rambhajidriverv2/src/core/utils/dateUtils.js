// src/core/utils/dateUtils.js
// Date formatting utilities for GharTak Driver App

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format a date string or timestamp to a readable format.
 * e.g. "18 Jun 2026"
 */
export function formatDate(date) {
  return format(new Date(date), 'dd MMM yyyy');
}

/**
 * Format a timestamp to time string.
 * e.g. "09:35 AM"
 */
export function formatTime(date) {
  return format(new Date(date), 'hh:mm aa');
}

/**
 * Format a date to a friendly label.
 * e.g. "Today", "Yesterday", or "18 Jun 2026"
 */
export function friendlyDate(date) {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return formatDate(d);
}

/**
 * Format relative time from now.
 * e.g. "3 minutes ago"
 */
export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Returns today's date in YYYY-MM-DD format (for API queries).
 */
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Format seconds to a MM:SS countdown string.
 * e.g. 270 -> "04:30"
 */
export function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
