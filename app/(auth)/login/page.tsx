'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Shield, ShoppingCart, Warehouse, Truck, DollarSign,
  CheckCircle2, Sparkles
} from 'lucide-react'

interface DemoAccount {
  role: string
  name: string
  email: string
  icon: any
  badgeColor: string
  tag: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ADMIN',
    name: 'System Admin / مدير النظام',
    email: 'admin@minierp.com',
    icon: Shield,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    tag: 'Full Control / تحكم كامل',
  },
  {
    role: 'SALES',
    name: 'Sales Manager / مسؤول المبيعات',
    email: 'sales@minierp.com',
    icon: ShoppingCart,
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    tag: 'Orders & Customers / أوامر وعملاء',
  },
  {
    role: 'WAREHOUSE',
    name: 'Warehouse Lead / أمين المستودع',
    email: 'warehouse@minierp.com',
    icon: Warehouse,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    tag: 'Stock & Dispatch / مخزون وشحن',
  },
  {
    role: 'PURCHASING',
    name: 'Purchasing Officer / مسؤول المشتريات',
    email: 'purchasing@minierp.com',
    icon: Truck,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    tag: 'Suppliers & POs / موردين وتوريد',
  },
  {
    role: 'FINANCE',
    name: 'Finance Accountant / المحاسب المالي',
    email: 'finance@minierp.com',
    icon: DollarSign,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    tag: 'Receivables & Debt / مديونيات وتحصيل',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('admin@minierp.com')
  const [password, setPassword] = useState('Password123!')
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleSelectDemoAccount = (acc: DemoAccount) => {
    setEmail(acc.email)
    setPassword('Password123!')
    setSelectedRole(acc.role)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Hero Banner */}
        <div className="lg:col-span-6 space-y-6 text-start p-2 lg:p-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-sky-400">
              🌟 إمْـــدَاد • EMDAD ERP
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            منظومة إمْـــدَاد <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent">
              لإدارة وتوزيع المنتجات الغذائية
            </span>
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
            منظومة تشغيلية متكاملة لربط المستودعات، حجز المخزون الفوري، إدارة سلاسل السوبرماركت، والتحكم في الائتمان وسندات التحصيل.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>حماية وتأمين كامل على مستوى قاعدة البيانات PostgreSQL RLS</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>محرك عمليات متصل لحظياً: كل حركة تسمّع في المخازن والمالية فوراً</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>تسعير وحسابات بالجنيه المصري (EGP) مع دعم كامل للعربية (RTL)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card without the square icon badge */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative">
            
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>إمْـــدَاد</span>
                  <span className="text-xs text-sky-400 font-mono font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    EMDAD ERP
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">تسجيل الدخول إلى مساحة العمل التشغيلية</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني (Work Email)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@minierp.com"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور (Password)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول الآمن'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Account Selector */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  دخول سريع بالحسابات التجريبية
                </span>
                <span className="text-[10px] text-slate-500">1-Click Auto Fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon
                  const isSelected = selectedRole === acc.role
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemoAccount(acc)}
                      className={`p-2.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-sky-500/50 shadow-md shadow-sky-500/10'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${acc.badgeColor}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{acc.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{acc.tag}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> PostgreSQL RLS Active
              </span>
              <span>Default Pass: <code className="text-slate-400 font-mono">Password123!</code></span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
