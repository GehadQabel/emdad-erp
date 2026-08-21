import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats monetary amounts in Egyptian Pound (EGP / ج.م)
 * @param amount - Numeric value to format
 * @param locale - 'en' (EGP 1,250.50) or 'ar' (١٬٢٥٠٫٥٠ ج.م.)
 */
export function formatCurrency(
  amount: number | null | undefined,
  locale: 'en' | 'ar' = 'en'
): string {
  if (amount === null || amount === undefined) {
    return locale === 'ar' ? '0.00 ج.م' : 'EGP 0.00'
  }

  const num = Number(amount)

  if (locale === 'ar') {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // English (Egypt standard)
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Formats decimal quantities (supports Cartons, KG, Pieces)
 */
export function formatQuantity(qty: number | null | undefined): string {
  if (qty === null || qty === undefined) return '0.00'
  return Number(qty).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}
