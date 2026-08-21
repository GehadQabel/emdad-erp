'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPurchaseOrderAction(input: {
  supplier_id: string
  warehouse_id: string
  expected_delivery_date: string
  items: Array<{
    product_id: string
    ordered_qty: number
    unit_cost: number
  }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: poId, error } = await supabase.rpc('rpc_purchase_order_create', {
    p_supplier_id: input.supplier_id,
    p_warehouse_id: input.warehouse_id,
    p_expected_delivery_date: input.expected_delivery_date || null,
    p_items: input.items as any,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/purchasing/orders')
  return { success: true, poId }
}

export async function confirmGoodsReceiptAction(input: {
  purchase_order_id: string
  warehouse_id: string
  supplier_delivery_note: string
  items: Array<{
    purchase_order_item_id: string
    received_qty: number
  }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: grId, error } = await supabase.rpc('rpc_goods_receipt_create_and_confirm', {
    p_purchase_order_id: input.purchase_order_id,
    p_warehouse_id: input.warehouse_id,
    p_supplier_delivery_note: input.supplier_delivery_note,
    p_items: input.items as any,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/purchasing/orders')
  revalidatePath('/purchasing/receipts')
  revalidatePath('/inventory/balances')
  return { success: true, grId }
}
