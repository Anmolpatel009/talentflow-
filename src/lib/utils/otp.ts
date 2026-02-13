import { OTP_EXPIRY_MINUTES } from '@/types'

// Generate a 4-digit OTP (free, no SMS required)
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Calculate OTP expiry time
export function getOTPExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES)
  return expiry
}

// Validate OTP format (4 digits)
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{4}$/.test(otp)
}

// Check if OTP is expired
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

// Format OTP for display
export function formatOTPDisplay(otp: string): string {
  return otp.split('').join(' ')
}
