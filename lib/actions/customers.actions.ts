'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomerAction(input: {
  code: string
  name: string
  contact_person?: string
  phone: string
  email?: string
  customer_type: 'CASH' | 'CREDIT'
  credit_limit: number
  payment_terms_days: number
  default_location_name: string
  default_location_address: string
}) {
  const supabase = createServerSupabaseClient()

  const { data: custId, error } = await supabase.rpc('rpc_customer_create', {
    p_code: input.code.trim().toUpperCase(),
    p_name: input.name.trim(),
    p_contact_person: input.contact_person?.trim() || null,
    p_phone: input.phone.trim(),
    p_email: input.email?.trim() || null,
    p_customer_type: input.customer_type,
    p_credit_limit: Number(input.credit_limit) || 0,
    p_payment_terms_days: Number(input.payment_terms_days) || 0,
    p_default_location_name: input.default_location_name || 'الفرع الرئيسي',
    p_default_location_address: input.default_location_address || 'العنوان الرئيسي',
  } as any)

  if (error) return { success: false, error: error.message }
  revalidatePath('/customers')
  revalidatePath('/sales/orders')
  return { success: true, custId }
}

export async function unblockCustomerAction(customerId: string, reason: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_customer_unblock', {
    p_customer_id: customerId,
    p_unblock_reason: reason.trim() || 'Management approved extension',
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/customers')
  revalidatePath('/sales/orders')
  revalidatePath('/dashboard')
  return { success: true }
}
