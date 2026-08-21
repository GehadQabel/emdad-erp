'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Update System Setting
export async function updateSystemSettingAction(key: string, value: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_update_system_setting', {
    p_key: key,
    p_value: value,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

// 2. Decide Approval
export async function decideApprovalAction(approvalId: string, orderId: string, isApproved: boolean, notes?: string) {
  const supabase = createServerSupabaseClient()

  if (isApproved) {
    const { error } = await supabase.rpc('rpc_sales_order_approve', {
      p_sales_order_id: orderId,
      p_decision_notes: notes || 'Approved via Governance Queue',
    })
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.rpc('rpc_sales_order_cancel', {
      p_sales_order_id: orderId,
      p_reason: notes || 'Rejected by management approval decision',
    })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/approvals')
  revalidatePath('/sales/orders')
  revalidatePath('/inventory/balances')
  return { success: true }
}

// 3. Toggle User Active/Suspended Status (Admin Only)
export async function toggleUserStatusAction(profileId: string, isActive: boolean) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.rpc('rpc_toggle_user_status', {
    p_profile_id: profileId,
    p_is_active: isActive,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
