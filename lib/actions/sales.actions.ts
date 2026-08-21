'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateSalesOrderInput {
  customer_id: string
  customer_location_id: string
  warehouse_id: string
  payment_type: 'CASH' | 'CREDIT'
  discount_percentage: number
  items: Array<{
    product_id: string
    ordered_qty: number
    unit_price: number
    line_discount_percentage: number
  }>
}

// 1. Create Sales Order
export async function createSalesOrderAction(input: CreateSalesOrderInput) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized: Active session required.' }
  }

  if (!input.customer_id) return { success: false, error: 'Customer is required.' }
  if (!input.customer_location_id) return { success: false, error: 'Delivery location is required.' }
  if (!input.warehouse_id) return { success: false, error: 'Warehouse is required.' }
  if (!input.items || input.items.length === 0) return { success: false, error: 'At least one product item is required.' }

  const { data: orderId, error } = await supabase.rpc('rpc_sales_order_create', {
    p_customer_id: input.customer_id,
    p_customer_location_id: input.customer_location_id,
    p_warehouse_id: input.warehouse_id,
    p_payment_type: input.payment_type,
    p_discount_percentage: Number(input.discount_percentage) || 0,
    p_items: input.items as any,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/sales/orders')
  revalidatePath('/inventory/balances')
  revalidatePath('/dashboard')
  return { success: true, orderId }
}

// 2. Approve Sales Order
export async function approveSalesOrderAction(orderId: string, notes?: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_sales_order_approve', {
    p_sales_order_id: orderId,
    p_decision_notes: notes || 'Approved via Sales Orders Dashboard',
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/sales/orders')
  revalidatePath('/inventory/balances')
  return { success: true }
}

// 3. Prepare Sales Order (Warehouse picking)
export async function prepareSalesOrderAction(orderId: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_sales_order_prepare', {
    p_sales_order_id: orderId,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/sales/orders')
  return { success: true }
}

// 4. Mark Ready for Delivery
export async function readySalesOrderAction(orderId: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_sales_order_ready', {
    p_sales_order_id: orderId,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/sales/orders')
  return { success: true }
}

// 5. Confirm Delivery (Fulfills stock & generates EGP Invoice)
export async function deliverSalesOrderAction(orderId: string) {
  const supabase = createServerSupabaseClient()

  const { data: receivableId, error } = await supabase.rpc('rpc_sales_order_deliver', {
    p_sales_order_id: orderId,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/sales/orders')
  revalidatePath('/inventory/balances')
  revalidatePath('/finance/receivables')
  revalidatePath('/dashboard')
  return { success: true, receivableId }
}

// 6. Cancel Sales Order
export async function cancelSalesOrderAction(orderId: string, reason?: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_sales_order_cancel', {
    p_sales_order_id: orderId,
    p_reason: reason || 'Cancelled by user',
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/sales/orders')
  revalidatePath('/inventory/balances')
  return { success: true }
}
