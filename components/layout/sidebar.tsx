'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { 
  LayoutDashboard, Package, Warehouse, ShoppingCart, 
  Truck, DollarSign, Users, Building2, CheckSquare, 
  History, Settings, LogOut, Lock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  isLocked?: boolean
}

export function Sidebar({ isLocked = false }: SidebarProps) {
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const supabase = createClient()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)

  useEffect(() => {
    async function loadRole() {
      const { data, error } = await supabase.rpc('rpc_get_my_profile_and_role')
      if (data && !error) {
        setUserRole((data as any).role_code)
      } else {
        setUserRole('AUTHENTICATED')
      }
      setLoadingRole(false)
    }
    loadRole()
  }, [])

  const allNavItems = [
    { label: t('nav.dashboard'), href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'PURCHASING', 'FINANCE'] },
    { label: t('nav.products'), href: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'PURCHASING'] },
    { label: t('nav.inventory'), href: '/inventory/balances', icon: Warehouse, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'PURCHASING'] },
    { label: t('nav.sales'), href: '/sales/orders', icon: ShoppingCart, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'FINANCE'] },
    { label: t('nav.purchasing'), href: '/purchasing/orders', icon: Truck, roles: ['ADMIN', 'PURCHASING', 'WAREHOUSE'] },
    { label: t('nav.finance'), href: '/finance/receivables', icon: DollarSign, roles: ['ADMIN', 'FINANCE'] },
    { label: t('nav.customers'), href: '/customers', icon: Users, roles: ['ADMIN', 'SALES', 'FINANCE'] },
    { label: t('nav.suppliers'), href: '/suppliers', icon: Building2, roles: ['ADMIN', 'PURCHASING'] },
    { label: t('nav.approvals'), href: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'SALES', 'FINANCE'] },
    { label: t('nav.auditLogs'), href: '/audit-logs', icon: History, roles: ['ADMIN'] },
    { label: t('nav.settings'), href: '/settings', icon: Settings, roles: ['ADMIN'] },
  ]

  const visibleNavItems = allNavItems.filter((item) => userRole && item.roles.includes(userRole))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col h-screen fixed top-0 start-0 z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shrink-0 text-sm ${
          isLocked 
            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400' 
            : 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-indigo-600 shadow-sky-500/25'
        }`}>
          {isLocked ? <Lock className="w-4 h-4" /> : (locale === 'ar' ? 'إ' : 'E')}
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-black text-white tracking-tight truncate flex items-center gap-1">
            {locale === 'ar' ? 'إمْـــدَاد' : 'EMDAD ERP'}
            {isLocked ? (
              <span className="text-[9px] text-rose-400 font-mono font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                LOCKED
              </span>
            ) : userRole && (
              <span className="text-[9px] text-sky-400 font-mono font-bold bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                {userRole}
              </span>
            )}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {isLocked ? (locale === 'ar' ? 'الحساب موقوف' : 'Account Inactive') : (locale === 'ar' ? 'منظومة إدارة وتوزيع الأغذية' : 'Food Distribution OS')}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isLocked ? (
          <div className="space-y-2 pt-2">
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{locale === 'ar' ? 'القائمة مقفلة بالكامل' : 'Navigation Locked'}</span>
            </div>
            {allNavItems.slice(0, 5).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-950/40 border border-slate-800/40 cursor-not-allowed opacity-50"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-slate-600" />
                  <span>{item.label}</span>
                </div>
                <Lock className="w-3 h-3 text-rose-400/60" />
              </div>
            ))}
          </div>
        ) : loadingRole ? (
          <div className="p-4 text-center text-xs text-slate-500">جاري التحقق من الصلاحيات...</div>
        ) : (
          visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })
        )}
      </nav>

      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
