'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, Search, RefreshCw, 
  TrendingUp, Clock, AlertTriangle, Filter, CheckCircle2, ShieldAlert 
} from 'lucide-react'

export default function ReceivablesPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [receivables, setReceivables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.rpc('rpc_get_finance_receivables', {
      p_search: search.trim() || null,
    } as any)
    setReceivables(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const formatLocalizedDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // فلترة الفواتير حسب الحالة المختارة
  const filteredReceivables = receivables.filter((r) => {
    const isSettled = r.is_settled
    const isOverdue = r.is_overdue
    const dueDateObj = new Date(r.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const isDueSoon = diffDays <= 5 && diffDays > 0 && !isSettled

    if (statusFilter === 'OVERDUE') return isOverdue
    if (statusFilter === 'DUE_SOON') return isDueSoon
    if (statusFilter === 'OPEN') return !isSettled && !isOverdue && !isDueSoon
    if (statusFilter === 'SETTLED') return isSettled
    return true
  })

  const totalOutstanding = filteredReceivables.reduce(
    (sum, r) => sum + Number(r.total_due_with_surcharge || r.outstanding_amount), 
    0
  )

  return (
    <div className="space-y-6">
      {/* Header & KPI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'فواتير المديونيات ومتابعة تواريخ الاستحقاق' : 'Customer Invoices & Due Dates'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'سجل الفواتير المستحقة، مواعيد السداد بالعداد التنازلي، وغرامات التأخير المضافة' : 'Track open customer debt, aging countdown, and late fee surcharges'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right rtl:text-left">
            <span className="text-[10px] text-slate-400 block">
              {locale === 'ar' ? 'إجمالي المستحق مع الغرامات:' : 'Total Due:'}
            </span>
            <span className="text-sm font-extrabold text-rose-400 font-mono">
              {formatCurrency(totalOutstanding, locale)}
            </span>
          </div>
          <button 
            onClick={() => loadData()} 
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={locale === 'ar' ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Comprehensive Status Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder={locale === 'ar' ? 'البحث برقم الفاتورة أو اسم السوبرماركت (اضغط Enter)...' : 'Search by invoice # or customer name...'}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              {locale === 'ar' ? 'جميع الفواتير' : 'All Invoices'} ({receivables.length})
            </option>
            <option value="OVERDUE" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🔴 {locale === 'ar' ? 'فواتير متأخرة عن السداد' : 'Overdue Invoices'}
            </option>
            <option value="DUE_SOON" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🟡 {locale === 'ar' ? 'اقتراب موعد السداد (خلال 5 أيام)' : 'Due Soon (<= 5 days)'}
            </option>
            <option value="OPEN" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🔵 {locale === 'ar' ? 'فواتير مفتوحة سارية' : 'Open Current Invoices'}
            </option>
            <option value="SETTLED" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              🟢 {locale === 'ar' ? 'فواتير مسددة بالكامل' : 'Fully Settled Invoices'}
            </option>
          </select>
        </div>
      </div>

      {/* Table with Fixed Layout & Neat Badges */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">{locale === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{locale === 'ar' ? 'العميل (السوبرماركت)' : 'Customer'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{locale === 'ar' ? 'تاريخ البداية (التسليم)' : 'Issue Date'}</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">{locale === 'ar' ? 'تاريخ الاستحقاق والمدة المتبقية' : 'Due Date & Countdown'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">{locale === 'ar' ? 'القيمة الأصلية' : 'Original Amount'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">{locale === 'ar' ? 'غرامة التأخير' : 'Late Surcharge'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">{locale === 'ar' ? 'القيمة الإجمالية المستحقة' : 'Total Due (EGP)'}</th>
                <th className="py-3.5 px-4 text-center min-w-[140px] whitespace-nowrap">{locale === 'ar' ? 'حالة السداد' : 'Payment Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {locale === 'ar' ? 'جاري تحميل الفواتير...' : 'Loading receivables...'}
                  </td>
                </tr>
              ) : filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {locale === 'ar' ? 'لا توجد فواتير مطابقة للفلتر المحدد.' : 'No receivables matching selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((r) => {
                  const isSettled = r.is_settled
                  const isOverdue = r.is_overdue
                  const dueDateObj = new Date(r.due_date)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const diffTime = dueDateObj.getTime() - today.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  const isDueSoon = diffDays <= 5 && diffDays > 0 && !isSettled

                  return (
                    <tr key={r.id} className={`hover:bg-slate-800/25 transition-colors ${isOverdue ? 'bg-rose-950/20' : isDueSoon ? 'bg-amber-950/15' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                        {r.receivable_number}
                        <span className="block text-[10px] text-slate-500 font-sans font-normal mt-0.5">{r.order_number}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block text-sm">{r.customer_name}</span>
                        <span className="font-mono text-slate-500 text-[10px]">{r.customer_code}</span>
                      </td>

                      {/* تاريخ بداية الفاتورة */}
                      <td className="py-3.5 px-4 text-center text-slate-300 font-medium whitespace-nowrap">
                        {formatLocalizedDate(r.invoice_start_date)}
                      </td>

                      {/* تاريخ الاستحقاق + العداد التنازلي */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-white font-bold block mb-1">
                          {formatLocalizedDate(r.due_date)}
                        </span>
                        {isSettled ? (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            {locale === 'ar' ? 'تم السداد بالكامل' : 'Settled'}
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                            <Clock className="w-3 h-3" />
                            {locale === 'ar' ? `متأخر ${r.overdue_days} يوم` : `${r.overdue_days}d overdue`}
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            {locale === 'ar' ? `متبقي ${diffDays} أيام فقط` : `${diffDays}d left`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                            <Clock className="w-3 h-3" />
                            {locale === 'ar' ? `متبقي ${diffDays} يوم` : `${diffDays}d left`}
                          </span>
                        )}
                      </td>

                      {/* القيمة الأصلية */}
                      <td className="py-3.5 px-4 text-right rtl:text-left font-mono font-semibold text-slate-300 whitespace-nowrap">
                        {formatCurrency(r.original_amount, locale)}
                      </td>

                      {/* غرامة التأخير */}
                      <td className="py-3.5 px-4 text-right rtl:text-left font-mono whitespace-nowrap">
                        {r.late_fee_amount > 0 ? (
                          <span className="text-rose-400 font-bold flex items-center justify-end rtl:justify-start gap-1">
                            <TrendingUp className="w-3 h-3" /> +{formatCurrency(r.late_fee_amount, locale)}
                          </span>
                        ) : (
                          <span className="text-slate-500">0.00</span>
                        )}
                      </td>

                      {/* القيمة الإجمالية المستحقة */}
                      <td className="py-3.5 px-4 text-right rtl:text-left font-mono font-bold text-white text-sm whitespace-nowrap">
                        {formatCurrency(r.total_due_with_surcharge, locale)}
                      </td>

                      {/* شارة حالة السداد المعدلة والمحمية من الانكسار */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isSettled ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            {locale === 'ar' ? 'مسددة بالكامل' : 'Fully Settled'}
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse whitespace-nowrap">
                            {locale === 'ar' ? 'متأخرة عن السداد' : 'Overdue'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap">
                            {locale === 'ar' ? 'مفتوحة للتحصيل' : 'Open'}
                          </span>
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
    </div>
  )
}
