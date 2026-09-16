export const formatINR = (value) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  } catch (e) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  }
};

export const sleep = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://rambhaji.backend.shreenari.com/api';
  const host = apiUrl.replace(/\/api\/?$/, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;
  
  return `${host}${safePath}`;
};
