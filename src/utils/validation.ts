/**
 * CivicConnect Form Validation Helpers
 */

export function isValidIndianPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  // Validates 10-digit Indian numbers with optional 91 / 0 prefix
  const regex = /^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/;
  return regex.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function isValidPincode(pincode: string): boolean {
  // 6-digit Indian Postal PIN code
  const regex = /^[1-9][0-9]{5}$/;
  return regex.test(pincode.trim());
}
