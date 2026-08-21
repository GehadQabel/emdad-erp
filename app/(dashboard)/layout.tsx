'use client'

import React, { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { EmdadCopilot } from '@/components/ai/emdad-copilot'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, Lock, LogOut, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const { locale } = useI18n()

  const [isSuspended, setIsSuspended] = useState(false)
  const [checking, setChecking] = useState(true)

  async function checkUserStatus() {
    setChecking(true)
    const { data: userContext, error } = await supabase.rpc('rpc_get_my_profile_and_role')

    if (userContext && !error) {
      const parsed = userContext as any
      if (parsed.is_active === false) {
        setIsSuspended(true)
      } else {
        setIsSuspended(false)
      }
    }
    setChecking(false)
  }

  useEffect(() => {
    checkUserStatus()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-xs text-slate-500 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
        <span>جاري التحقق من أمان الجلسة...</span>
      </div>
    )
  }

  // شاشة الحساب المعطل
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#080c14] flex">
        <Sidebar isLocked={true} />
        <div className="flex-1 ms-64 flex flex-col min-w-0">
          <header className="h-16 border-b border-rose-500/30 bg-rose-950/20 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-4 h-4" />
              {locale === 'ar' ? 'الحساب معطل • الصلاحيات مقيدة' : 'ACCOUNT INACTIVE • ACCESS RESTRICTED'}
            </span>
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
              <LogOut className="w-3.5 h-3.5 inline mr-1" /> خروج
            </button>
          </header>
          <main className="p-6 flex-1 flex items-center justify-center">
            <div className="max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <Lock className="w-12 h-12 text-rose-400 mx-auto" />
              <h2 className="text-xl font-black text-white">ACCOUNT SUSPENDED</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                تم إيقاف تنشيط حسابك مؤقتاً بواسطة مسؤول النظام. يرجى مراجعة إدارة النظام لإعادة التنشيط.
              </p>
              <button onClick={handleLogout} className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs">
                تسجيل الخروج
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex">
      <Sidebar />
      <div className="flex-1 ms-64 flex flex-col min-w-0 relative">
        <Navbar />
        <main className="p-6 flex-1 overflow-y-auto pb-20">{children}</main>
        {/* 🌟 دمج المساعد الذكي */}
        <EmdadCopilot />
      </div>
    </div>
  )
}
