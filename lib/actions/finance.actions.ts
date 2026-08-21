'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordPaymentAction(input: {
  customer_id: string
  payment_amount: number
  payment_date: string
  payment_method: string
  payment_reference: string
  allocations: Array<{
    customer_receivable_id: string
    allocated_amount: number
  }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: paymentId, error } = await supabase.rpc('rpc_payment_record_and_allocate', {
    p_customer_id: input.customer_id,
    p_payment_amount: input.payment_amount,
    p_payment_date: input.payment_date,
    p_payment_method: input.payment_method,
    p_payment_reference: input.payment_reference,
    p_allocations: input.allocations as any,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/finance/receivables')
  revalidatePath('/finance/payments')
  revalidatePath('/dashboard')
  return { success: true, paymentId }
}
