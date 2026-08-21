'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { updateSystemSettingAction, toggleUserStatusAction } from '@/lib/actions/governance.actions'
import { 
  Settings, Users, Shield, Save, RefreshCw, 
  Percent, UserCheck, UserX, Sliders, ShieldAlert, CheckCircle2
} from 'lucide-react'

export default function SettingsPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'TEAM'>('SETTINGS')
  const [settings, setSettings] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [settingValues, setSettingValues] = useState<Record<string, string>>({})

  // قواميس تعريب مفاتيح الإعدادات
  const settingLabels: Record<string, { arTitle: string; enTitle: string; arDesc: string; enDesc: string }> = {
    'sales.discount_approval_threshold': {
      arTitle: 'سقف نسبة الخصم المسموح بدون موافقة (%)',
      enTitle: 'Sales Discount Approval Threshold (%)',
      arDesc: 'الحد الأقصى لنسبة الخصم التي يمكن لمندوب المبيعات تطبيقها. إذا تجاوز الطلب هذه النسبة يتم تحويله لمدير النظام للاعتماد.',
      enDesc: 'Maximum discount percentage allowed for sales users without managerial approval.',
    },
    'credit.block_overdue_customers': {
      arTitle: 'الحظر التلقائي للعملاء المتأخرين عن السداد',
      enTitle: 'Auto-Block Overdue Customers',
      arDesc: 'تفعيل الإيقاف الفوري لإنشاء أوامر بيع آجلة جديدة لأي سوبرماركت يتجاوز موعد استحقاق فواتيره.',
      enDesc: 'Automatically block new sales orders for customers with past-due invoices.',
    },
    'credit.overdue_grace_period_days': {
      arTitle: 'فترة السماح الإضافية بعد تاريخ الاستحقاق (أيام)',
      enTitle: 'Overdue Grace Period (Days)',
      arDesc: 'عدد الأيام الإضافية الممنوحة للعميل بعد انتهاء موعد الفاتورة قبل تطبيق الحظر التلقائي.',
      enDesc: 'Number of grace days after due date before the auto-block rule triggers.',
    },
    'credit.overdue_late_fee_percentage': {
      arTitle: 'نسبة غرامة التأخير الشهرية المضافة (%)',
      enTitle: 'Monthly Overdue Late Fee Surcharge (%)',
      arDesc: 'النسبة المئوية التي تضاف تلقائياً كل 30 يوم على المبالغ المتأخرة عن موعد السداد.',
      enDesc: 'Percentage fee added every 30 days on past-due open receivable balances.',
    },
  }

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.rpc('rpc_get_settings_and_team')
    if (data) {
      const parsed = data as any
      setSettings(parsed.settings || [])
      setTeam(parsed.team || [])

      const valMap: Record<string, string> = {}
      parsed.settings?.forEach((s: any) => {
        valMap[s.key] = s.value
      })
      setSettingValues(valMap)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSaveSetting = async (key: string) => {
    setSavingKey(key)
    const val = settingValues[key]
    const res = await updateSystemSettingAction(key, val)
    if (!res.success) {
      alert(`Error: ${res.error}`)
    } else {
      alert(locale === 'ar' ? 'تم حفظ وتفعيل الإعداد الجديد في محرك النظام وسجل التدقيق!' : 'Setting saved successfully!')
      loadData()
    }
    setSavingKey(null)
  }

  const handleToggleUser = async (user: any) => {
    const nextStatus = !user.is_active
    const confirmMsg = nextStatus 
      ? (locale === 'ar' ? `هل أنت متأكد من إعادة تنشيط حساب ${user.full_name}؟` : `Reactivate ${user.full_name}?`)
      : (locale === 'ar' ? `هل أنت متأكد من تعطيل حساب ${user.full_name} وإيقاف دخوله للنظام؟` : `Suspend account of ${user.full_name}?`)

    if (!confirm(confirmMsg)) return

    setTogglingUserId(user.id)
    const res = await toggleUserStatusAction(user.id, nextStatus)
    if (!res.success) {
      alert(`Error: ${res.error}`)
    } else {
      loadData()
    }
    setTogglingUserId(null)
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    SALES: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    WAREHOUSE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    PURCHASING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    FINANCE: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'إعدادات المنظومة وإدارة فريق العمل' : 'System Configuration & Team Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'التحكم في قواعد الائتمان، نسب الخصومات، غرامات التأخير، وصلاحيات الموظفين' : 'Configure operational rules, discount limits, and team access control'}
          </p>
        </div>

        <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'SETTINGS' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <Sliders className="w-4 h-4" /> {locale === 'ar' ? 'سياسات وقواعد العمل' : 'Business Rules'}
        </button>
        <button
          onClick={() => setActiveTab('TEAM')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'TEAM' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4" /> {locale === 'ar' ? 'فريق العمل والصلاحيات والتنشيط' : 'Team & Access Status'}
        </button>
      </div>

      {/* Tab 1: Arabic System Settings */}
      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.map((s) => {
            const meta = settingLabels[s.key] || {
              arTitle: s.key,
              enTitle: s.key,
              arDesc: s.description || '',
              enDesc: s.description || '',
            }

            return (
              <div key={s.key} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    {locale === 'ar' ? meta.arTitle : meta.enTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">{s.type}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                  {locale === 'ar' ? meta.arDesc : meta.enDesc}
                </p>

                <div className="flex gap-2 pt-2 border-t border-slate-800/60">
                  {s.type === 'BOOLEAN' ? (
                    <select
                      value={settingValues[s.key] || 'true'}
                      onChange={(e) => setSettingValues({ ...settingValues, [s.key]: e.target.value })}
                      style={{ backgroundColor: '#020617', color: '#ffffff' }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="true" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>{locale === 'ar' ? 'مفعّل (تشغيل الحظر الآلي)' : 'Enabled'}</option>
                      <option value="false" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>{locale === 'ar' ? 'معطل (إيقاف الحظر)' : 'Disabled'}</option>
                    </select>
                  ) : (
                    <input
                      type={s.type === 'INTEGER' || s.type === 'DECIMAL' ? 'number' : 'text'}
                      step="0.5"
                      value={settingValues[s.key] || ''}
                      onChange={(e) => setSettingValues({ ...settingValues, [s.key]: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono focus:border-sky-500 focus:outline-none"
                    />
                  )}

                  <button
                    disabled={savingKey === s.key}
                    onClick={() => handleSaveSetting(s.key)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingKey === s.key ? 'جاري الحفظ...' : (locale === 'ar' ? 'حفظ' : 'Save')}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tab 2: Team Accounts & Activation Control */}
      {activeTab === 'TEAM' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{locale === 'ar' ? 'اسم المستخدم' : 'Full Name'}</th>
                <th className="py-3.5 px-4">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</th>
                <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الدور الوظيفي' : 'Role (RBAC)'}</th>
                <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'حالة الحساب' : 'Account Status'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'التحكم الإداري' : 'Admin Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {team.map((u) => (
                <tr key={u.id} className={`transition-colors ${!u.is_active ? 'bg-rose-950/15' : 'hover:bg-slate-800/25'}`}>
                  <td className="py-3.5 px-4 font-bold text-white">{u.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-sky-400">{u.email}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleColors[u.role_code] || 'bg-slate-800 text-slate-300'}`}>
                      {u.role_name || u.role_code}
                    </span>
                  </td>

                  {/* حالة الحساب */}
                  <td className="py-3.5 px-4 text-center">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <UserCheck className="w-3 h-3" /> {locale === 'ar' ? 'نشط ومصرح له' : 'Active'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                        <UserX className="w-3 h-3" /> {locale === 'ar' ? 'معطل وموقوف' : 'Suspended'}
                      </span>
                    )}
                  </td>

                  {/* زر التعطيل / التنشيط للأدمن */}
                  <td className="py-3.5 px-4 text-right rtl:text-left">
                    {u.role_code !== 'ADMIN' ? (
                      u.is_active ? (
                        <button
                          disabled={togglingUserId === u.id}
                          onClick={() => handleToggleUser(u)}
                          className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-all"
                        >
                          {locale === 'ar' ? 'تعطيل الحساب' : 'Suspend'}
                        </button>
                      ) : (
                        <button
                          disabled={togglingUserId === u.id}
                          onClick={() => handleToggleUser(u)}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] rounded-lg transition-all"
                        >
                          {locale === 'ar' ? 'إعادة التنشيط' : 'Reactivate'}
                        </button>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">{locale === 'ar' ? 'محمي (مدير النظام)' : 'Protected Admin'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
