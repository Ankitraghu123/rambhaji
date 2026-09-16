// src/core/validators/otpValidator.js
export const validateOtp = (value) => {
  if (!value) return 'OTP is required';
  if (!/^\d{6}$/.test(value)) return 'OTP must be exactly 6 digits';
  return true;
};
