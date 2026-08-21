'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSupplierAction(input: {
  code: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  tax_number?: string
}) {
  const supabase = createServerSupabaseClient()

  const { data: suppId, error } = await supabase.rpc('rpc_supplier_create', {
    p_code: input.code.trim().toUpperCase(),
    p_name: input.name.trim(),
    p_contact_person: input.contact_person?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_email: input.email?.trim() || null,
    p_tax_number: input.tax_number?.trim() || null,
  } as any)

  if (error) return { success: false, error: error.message }
  revalidatePath('/suppliers')
  revalidatePath('/purchasing/orders')
  return { success: true, suppId }
}
