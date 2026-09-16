// src/core/utils/formatUtils.js
// String/number formatting utilities

/**
 * Format a number as Indian Rupees.
 * e.g. 1234.5 -> "₹1,234.50"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format distance in meters to a human-readable string.
 * e.g. 150 -> "150 m" | 1500 -> "1.5 km"
 */
export function formatDistance(meters) {
  if (!meters && meters !== 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format a phone number for display.
 * e.g. "+919876543210" -> "+91 98765 43210"
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Truncate a string with ellipsis.
 * e.g. truncate("Long address text", 20) -> "Long address text..."
 */
export function truncate(str, maxLength = 40) {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

/**
 * Get the first name from a full name string.
 */
export function firstName(fullName) {
  return fullName?.split(' ')[0] || '';
}

/**
 * Return category display label.
 */
export function categoryLabel(category) {
  const MAP = {
    VEGETABLES:         '🥦 Vegetables',
    FRUITS:             '🍊 Fruits',
    EXOTIC_VEGETABLES:  '🌿 Exotic',
    WATER_SUBSCRIPTION: '💧 Water',
    OTHER:              '📦 Other',
  };
  return MAP[category] || category;
}

/**
 * Return high-resolution product image fallback URL when backend image is missing or broken.
 */
export function getProductImageFallback(name = '', category = '') {
  const lowerName = (name || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();

  if (lowerName.includes('tomato') || lowerName.includes('tamatar') || lowerName.includes('टमाटर')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&q=80';
  }
  if (lowerName.includes('coriander') || lowerName.includes('dhaniya') || lowerName.includes('धनिया')) {
    return 'https://images.unsplash.com/photo-1588879460418-478a6eb2f8c5?w=200&q=80';
  }
  if (lowerName.includes('chilli') || lowerName.includes('chili') || lowerName.includes('mirch') || lowerName.includes('मिर्च')) {
    return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=200&q=80';
  }
  if (lowerName.includes('garlic') || lowerName.includes('lahsun') || lowerName.includes('लहसुन')) {
    return 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=200&q=80';
  }
  if (lowerName.includes('potato') || lowerName.includes('aloo') || lowerName.includes('आलू')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=80';
  }
  if (lowerName.includes('onion') || lowerName.includes('pyaz') || lowerName.includes('प्याज')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&q=80';
  }
  if (lowerName.includes('apple') || lowerName.includes('seb') || lowerName.includes('सेब')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80';
  }
  if (lowerName.includes('banana') || lowerName.includes('kela') || lowerName.includes('केला')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80';
  }
  if (lowerName.includes('ginger') || lowerName.includes('adrak') || lowerName.includes('अदरक')) {
    return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&q=80';
  }
  if (lowerName.includes('water') || lowerName.includes('alkaline') || lowerCat.includes('water')) {
    return 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200&q=80';
  }
  if (lowerCat.includes('fruit') || lowerName.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80';
  }
  return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80';
}
