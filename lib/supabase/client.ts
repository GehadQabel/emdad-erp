import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjwyrcsdjefwgepckrmh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XpnY0D-OYqTH7uSZLtUfXw_t_hXSbTM'

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_KEY
  )
}
