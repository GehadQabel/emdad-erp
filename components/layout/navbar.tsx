'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './notification-bell'
import { LanguageToggle } from './language-toggle'
import { User, Shield } from 'lucide-react'

interface UserProfile {
  full_name: string
  email: string
  role_code?: string
}

export function Navbar() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadUserProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('auth_user_id', user.id)
          .single()

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('roles(code)')
          .eq('profile_id', profileData?.email ? user.id : '')

        setProfile({
          full_name: profileData?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role_code: (roleData as any)?.[0]?.roles?.code || 'AUTHENTICATED',
        })
      }
    }

    loadUserProfile()
  }, [])

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs text-slate-400 font-medium tracking-wide hidden sm:inline">
          Supabase PostgreSQL Online
        </span>
      </div>

      <div className="flex items-center gap-4">
        <LanguageToggle />
        <NotificationBell />

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-3 pl-1">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-start">
            <p className="text-xs font-semibold text-white leading-tight">
              {profile?.full_name || 'Loading...'}
            </p>
            <p className="text-[10px] text-sky-400 font-medium flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              {profile?.role_code || 'VERIFIED'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
