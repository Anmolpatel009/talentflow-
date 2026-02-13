import { PaymentBreakdown } from '@/types'
import { COMMISSION_RATES } from '@/types'

// Calculate commission and freelancer payout
export function calculateCommission(
  total: number,
  commissionRate: number
): PaymentBreakdown {
  const commissionAmount = (total * commissionRate) / 100
  const freelancerAmount = total - commissionAmount

  return {
    total,
    commissionRate,
    commissionAmount,
    freelancerAmount,
  }
}

// Get commission rate based on verification status
export function getCommissionRate(
  isVerified: boolean
): number {
  return isVerified
    ? COMMISSION_RATES.verified
    : COMMISSION_RATES.unverified
}

// Format currency for display
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Calculate platform earnings
export function calculatePlatformEarnings(tasks: { budget: number; commissionRate: number }[]): {
  totalRevenue: number
  totalCommission: number
  totalPayouts: number
} {
  const totalRevenue = tasks.reduce((sum, task) => sum + task.budget, 0)
  const totalCommission = tasks.reduce(
    (sum, task) => sum + (task.budget * task.commissionRate) / 100,
    0
  )
  const totalPayouts = totalRevenue - totalCommission

  return {
    totalRevenue,
    totalCommission,
    totalPayouts,
  }
}
