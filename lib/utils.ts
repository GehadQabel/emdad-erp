import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats monetary amounts in Egyptian Pound (EGP / ج.م) with hydration safety
 * @param amount - Numeric value to format
 * @param locale - 'en' (EGP 1,250.50) or 'ar' (١٬٢٥٠٫٥٠ ج.م.)
 */
export function formatCurrency(
  amount: number | null | undefined,
  locale: string = 'en'
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return locale === 'ar' ? '0.00 ج.م' : 'EGP 0.00'
  }

  const num = Number(amount)

  try {
    if (locale === 'ar') {
      return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`
    }
    return `EGP ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } catch (err) {
    return `EGP ${num.toFixed(2)}`
  }
}

/**
 * Formats decimal quantities (supports Cartons, KG, Pieces)
 */
export function formatQuantity(qty: number | null | undefined): string {
  if (qty === null || qty === undefined || isNaN(Number(qty))) return '0.00'
  try {
    return Number(qty).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  } catch (err) {
    return Number(qty).toFixed(2)
  }
}

/**
 * Formats date strings deterministically (YYYY-MM-DD) to prevent SSR hydration mismatches
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr).split('T')[0] || '—'
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  } catch (err) {
    return '—'
  }
}
