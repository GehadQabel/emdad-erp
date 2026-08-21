'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { createCustomerAction, unblockCustomerAction } from '@/lib/actions/customers.actions'
import { 
  Users, Plus, Search, RefreshCw, Phone, Clock, AlertTriangle, Filter, Lock, Unlock, ShieldAlert, ShieldCheck
} from 'lucide-react'

export default function CustomersPage() {
  const { locale } = useI18n()
  const supabase = createClient()

  const [customers, setCustomers] = useState<any[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('SALES')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [creditFilter, setCreditFilter] = useState('ALL')

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [unblockModalCustomer, setUnblockModalCustomer] = useState<any | null>(null)
  const [unblockReason, setUnblockReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    customer_type: 'CREDIT' as 'CASH' | 'CREDIT',
    credit_limit: 100000,
    payment_terms_days: 30,
    default_location_name: '',
    default_location_address: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      // 1. Fetch User Context
      const { data: userCtx } = await (supabase as any).rpc('rpc_get_my_profile_and_role')
      if (userCtx) {
        setCurrentUserRole((userCtx as any).role_code || 'SALES')
      }

      // 2. Fetch Customers Overview
      const { data } = await (supabase as any).rpc('rpc_get_customers_overview', {
        p_search: search.trim() || null,
      })

      setCustomers(data || [])
    } catch (err) {
      console.error('Error loading customers:', err)
      setCustomers([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setFormError(null)

    const res = await createCustomerAction(formData)
    if (!res.success) {
      setFormError(res.error || 'Failed to create customer.')
      setActionLoading(false)
    } else {
      setIsCreateModalOpen(false)
      setActionLoading(false)
      loadData()
    }
  }

  const handleConfirmUnblock = async () => {
    if (!unblockModalCustomer) return
    setActionLoading(true)

    const res = await unblockCustomerAction(unblockModalCustomer.id, unblockReason)
    if (!res.success) {
      alert(`Unblock error: ${res.error}`)
    } else {
      setUnblockModalCustomer(null)
      setUnblockReason('')
      loadData()
    }
    setActionLoading(false)
  }

  const filteredCustomers = (customers || []).filter((c) => {
    if (!c) return false
    const isBlocked = c.payment_health_status === 'OVERDUE_BLOCKED' || Boolean(c.is_blocked)
    const isDueSoon = c.payment_health_status === 'DUE_SOON'
    const isHealthy = !isBlocked && !isDueSoon

    if (creditFilter === 'BLOCKED') return isBlocked
    if (creditFilter === 'DUE_SOON') return isDueSoon
    if (creditFilter === 'HEALTHY') return isHealthy
    return true
  })

  // فحص هل المستخدم مدير نظام مسموح له بفك الحظر
  const isAdmin = currentUserRole === 'ADMIN'

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'دليل العملاء وفحص الائتمان' : 'Supermarket Directory & Credit Health'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'سجل سلاسل السوبرماركت، فترات السداد، عداد الاستحقاق التنازلي، وفك الحظر الإداري' : 'Directory of supermarkets, terms countdown, and admin unblock'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة عميل جديد' : 'New Customer'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder={locale === 'ar' ? 'البحث باسم السوبرماركت أو كود العميل (اضغط Enter)...' : 'Search by supermarket name or customer code...'}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              {locale === 'ar' ? 'جميع العملاء' : 'All Customers'} ({customers.length})
            </option>
            <option value="HEALTHY" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🟢 {locale === 'ar' ? 'عملاء منتظمون ونشطون' : 'Active & Safe Accounts'}
            </option>
            <option value="DUE_SOON" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🟡 {locale === 'ar' ? 'اقتراب موعد الاستحقاق (خلال 5 أيام)' : 'Due Soon Warning (<= 5d)'}
            </option>
            <option value="BLOCKED" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🔴 {locale === 'ar' ? 'عملاء محظورون لتأخر السداد' : 'Blocked / Overdue Accounts'}
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">{locale === 'ar' ? 'الكود والعميل' : 'Customer'}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{locale === 'ar' ? 'المسؤول والاتصال' : 'Contact Person'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{locale === 'ar' ? 'فترة السداد' : 'Terms'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{locale === 'ar' ? 'المتبقي من فترة السداد' : 'Days Remaining'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">{locale === 'ar' ? 'المديونية وغرامة التأخير' : 'Total Due'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{locale === 'ar' ? 'حالة الحساب' : 'Credit Status'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading customers...'}</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا يوجد عملاء مطابقين للفلتر.' : 'No customers matching filter.'}</td></tr>
              ) : (
                filteredCustomers.map((c) => {
                  const isBlocked = c?.payment_health_status === 'OVERDUE_BLOCKED' || Boolean(c?.is_blocked)
                  const isDueSoon = c?.payment_health_status === 'DUE_SOON'
                  const totalOutstanding = Number(c?.total_outstanding || 0)
                  const overdueDays = Number(c?.overdue_days || 0)
                  const daysDiff = Number(c?.days_diff || 0)
                  const totalDue = Number(c?.total_due_with_late_fee || c?.total_outstanding || 0)
                  const lateFee = Number(c?.late_fee_amount || 0)

                  return (
                    <tr key={c.id || c.code} className={`transition-colors ${isBlocked ? 'bg-rose-950/20 hover:bg-rose-950/30' : isDueSoon ? 'bg-amber-950/15 hover:bg-amber-950/25' : 'hover:bg-slate-800/25'}`}>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-white block text-sm">{c.name || '—'}</span>
                        <span className="font-mono text-sky-400 text-[10px]">{c.code || '—'}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-200">{c.contact_person || '—'}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {c.phone || '—'}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-300 whitespace-nowrap">
                        {c.payment_terms_days || 30} {locale === 'ar' ? 'يوم' : 'days'}
                      </td>

                      {/* العداد التنازلي */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {totalOutstanding <= 0 ? (
                          <span className="text-slate-500 font-medium">{locale === 'ar' ? 'لا توجد ديون' : 'No Debt'}</span>
                        ) : isBlocked ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{locale === 'ar' ? `متأخر ${overdueDays} يوم` : `${overdueDays}d Overdue`}</span>
                          </div>
                        ) : isDueSoon ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold font-mono animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{locale === 'ar' ? `متبقي ${daysDiff} أيام` : `${daysDiff}d left`}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{locale === 'ar' ? `متبقي ${daysDiff} يوم` : `${daysDiff}d left`}</span>
                          </div>
                        )}
                      </td>

                      {/* المديونية وغرامة التأخير */}
                      <td className="py-3.5 px-4 text-right rtl:text-left font-mono whitespace-nowrap">
                        <span className="text-sm font-bold text-white block">
                          {formatCurrency(totalDue, locale)}
                        </span>
                        {lateFee > 0 && (
                          <span className="text-[10px] text-rose-400 flex items-center justify-end rtl:justify-start gap-0.5 mt-0.5">
                            +{formatCurrency(lateFee, locale)}
                          </span>
                        )}
                      </td>

                      {/* شارة الحالة */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20 animate-pulse whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <ShieldAlert className="w-3 h-3" /> {locale === 'ar' ? 'محظور (متأخر عن السداد)' : 'Blocked'}
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <AlertTriangle className="w-3 h-3" /> {locale === 'ar' ? 'اقتراب موعد السداد' : 'Due Soon'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <ShieldCheck className="w-3 h-3" /> {locale === 'ar' ? 'حساب منتظم' : 'Active'}
                          </span>
                        )}
                      </td>

                      {/* زر فك الحظر: يظهر فقط للأدمن، ويُحجب تماماً عن مندوب المبيعات والمستودع */}
                      <td className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">
                        {isBlocked && (
                          isAdmin ? (
                            <button
                              onClick={() => { setUnblockModalCustomer(c); setUnblockReason(''); }}
                              className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/40 font-bold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Unlock className="w-3.5 h-3.5" /> {locale === 'ar' ? 'فك الحظر الإداري' : 'Admin Unblock'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-600" /> {locale === 'ar' ? 'محظور (صلاحية مدير)' : 'Admin Only'}
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-sky-400" /> {locale === 'ar' ? 'تسجيل عميل سوبرماركت جديد' : 'Register Customer'}
            </h2>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">{formError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'كود العميل *' : 'Code *'}</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="CUST-ALFA" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'اسم السوبرماركت / الشركة *' : 'Name *'}</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Alfa Market / ألفا ماركت" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'المسؤول أو مدير المشتريات' : 'Contact'}</label>
                  <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} placeholder="أحمد سمير" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'رقم الهاتف *' : 'Phone *'}</label>
                  <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+201000000000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'سقف الائتمان (ج.م) *' : 'Credit Limit *'}</label>
                  <input type="number" step="1000" min="0" required value={formData.credit_limit} onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'فترة السداد بالأيام *' : 'Terms (Days) *'}</label>
                  <input type="number" step="1" min="0" required value={formData.payment_terms_days} onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 0 })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'اسم الفرع الرئيسي *' : 'Branch *'}</label>
                  <input type="text" required value={formData.default_location_name} onChange={(e) => setFormData({ ...formData, default_location_name: e.target.value })} placeholder="فرع المهندسين" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'عنوان الفرع *' : 'Address *'}</label>
                  <input type="text" required value={formData.default_location_address} onChange={(e) => setFormData({ ...formData, default_location_address: e.target.value })} placeholder="الجيزة" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25">
                  {actionLoading ? 'Saving...' : (locale === 'ar' ? 'حفظ العميل' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Unblock Modal */}
      {unblockModalCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Unlock className="w-4 h-4 text-sky-400" /> {locale === 'ar' ? 'فك حظر حساب العميل (اعتماد إداري)' : 'Admin Override'}
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              {locale === 'ar' ? 'فك حظر حساب:' : 'Unblock account:'} <strong className="text-white">{unblockModalCustomer.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'سبب فك الحظر الإداري *' : 'Reason *'}</label>
              <textarea
                required
                rows={2}
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                placeholder={locale === 'ar' ? 'مثال: تم الحصول على شيك ضمان وسداد جزئي بموافقة الإدارة' : 'Reason...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setUnblockModalCustomer(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button
                type="button"
                disabled={actionLoading || !unblockReason.trim()}
                onClick={handleConfirmUnblock}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : (locale === 'ar' ? 'تأكيد فك الحظر' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
