'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Post Inventory Adjustment (Calls Phase 2C Concurrency-Safe RPC)
export async function postInventoryAdjustmentAction(formData: {
  warehouse_id: string
  reason: string
  notes?: string
  items: Array<{
    product_id: string
    system_qty: number
    counted_qty: number
    notes?: string
  }>
}) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('rpc_inventory_adjustment_post', {
    p_warehouse_id: formData.warehouse_id,
    p_reason: formData.reason,
    p_notes: formData.notes || '',
    p_items: formData.items as any,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/inventory/balances')
  revalidatePath('/inventory/adjustments')
  return { success: true, adjustmentId: data }
}

// 2. Dispatch Warehouse Transfer (Calls Phase 2C RPC)
export async function dispatchWarehouseTransferAction(formData: {
  source_warehouse_id: string
  destination_warehouse_id: string
  items: Array<{
    product_id: string
    quantity: number
  }>
}) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('rpc_warehouse_transfer_dispatch', {
    p_source_warehouse_id: formData.source_warehouse_id,
    p_destination_warehouse_id: formData.destination_warehouse_id,
    p_items: formData.items as any,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/inventory/balances')
  revalidatePath('/inventory/transfers')
  return { success: true, transferId: data }
}

// 3. Complete Warehouse Transfer (Calls Phase 2C RPC)
export async function completeWarehouseTransferAction(transferId: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_warehouse_transfer_complete', {
    p_transfer_id: transferId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/inventory/balances')
  revalidatePath('/inventory/transfers')
  return { success: true }
}
