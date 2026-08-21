'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateProductInput {
  product_code: string
  barcode?: string
  name: string
  category_id: string
  brand_id: string
  unit_id: string
  base_selling_price: number
  warehouse_id?: string
  min_stock_level?: number
  initial_stock_qty?: number
}

// 1. Create Product Action with Initial Stock
export async function createProductAction(input: CreateProductInput) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized: Active session required.' }
  }

  if (!input.category_id || input.category_id.trim() === '') {
    return { success: false, error: 'Please select a valid Category.' }
  }

  if (!input.brand_id || input.brand_id.trim() === '') {
    return { success: false, error: 'Please select a valid Brand.' }
  }

  if (!input.unit_id || input.unit_id.trim() === '') {
    return { success: false, error: 'Please select a valid Base Unit.' }
  }

  const warehouseId =
    input.warehouse_id && input.warehouse_id.trim() !== ''
      ? input.warehouse_id.trim()
      : null

  const { data: productId, error } = await supabase.rpc('rpc_product_create', {
    p_product_code: input.product_code.trim().toUpperCase(),
    p_barcode: input.barcode?.trim() ? input.barcode.trim() : null,
    p_name: input.name.trim(),
    p_category_id: input.category_id.trim(),
    p_brand_id: input.brand_id.trim(),
    p_unit_id: input.unit_id.trim(),
    p_base_selling_price: Number(input.base_selling_price) || 0,
    p_warehouse_id: warehouseId,
    p_min_stock_level: Number(input.min_stock_level) || 0,
    p_initial_stock_qty: Number(input.initial_stock_qty) || 0,
  } as any)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/products')
  revalidatePath('/inventory/balances')
  return { success: true, productId }
}

// 2. Auto-Generate Next SKU Sequence Action
export async function generateNextSkuAction(categoryId: string) {
  const supabase = createServerSupabaseClient()

  if (!categoryId) return { success: false, sku: 'PRD-1001' }

  const { data: sku, error } = await supabase.rpc('rpc_generate_next_sku', {
    p_category_id: categoryId,
  })

  if (error || !sku) {
    return { success: false, sku: 'PRD-1001' }
  }

  return { success: true, sku }
}

// 3. Delete / Archive Product Action
export async function deleteProductAction(productId: string) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized.' }
  }

  const { data, error } = await supabase.rpc('rpc_product_delete', {
    p_product_id: productId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/products')
  revalidatePath('/inventory/balances')
  return { success: true, result: data }
}
