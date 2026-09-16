// src/core/validators/phoneValidator.js
export const validatePhone = (value) => {
  if (!value) return 'Mobile number is required';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length !== 10) return 'Enter a valid 10-digit mobile number';
  if (!/^[6-9]/.test(cleaned)) return 'Mobile number must start with 6, 7, 8, or 9';
  return true;
};
