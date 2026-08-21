'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { decideApprovalAction } from '@/lib/actions/governance.actions'
import { 
  CheckSquare, CheckCircle2, XCircle, Search, Filter, 
  RefreshCw, Clock, AlertTriangle, ShieldCheck, User, Coins
} from 'lucide-react'

export default function ApprovalsPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const { data } = await (supabase as any).rpc('rpc_get_approvals_feed', {
      p_status: statusFilter === 'ALL' ? null : statusFilter,
      p_search: search.trim() || null,
    })
    setApprovals(data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [statusFilter])

  const handleDecision = async (approval: any, isApproved: boolean) => {
    const actionText = isApproved ? (locale === 'ar' ? 'اعتماد' : 'Approve') : (locale === 'ar' ? 'رفض' : 'Reject')
    if (!confirm(locale === 'ar' ? `هل أنت متأكد من ${actionText} هذا الطلب؟` : `Are you sure you want to ${actionText} this request?`)) return

    setActionLoadingId(approval.id)
    const res = await decideApprovalAction(approval.id, approval.target_id, isApproved)
    if (!res.success) alert(`Error: ${res.error}`)
    loadData()
    setActionLoadingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'الموافقات والاعتمادات الإدارية' : 'Governance & Approval Requests'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'طلبات تجاوز نسب الخصم المسموحة وسقف الائتمان لأوامر البيع' : 'Discount thresholds and credit limit override requests queue'}
          </p>
        </div>

        <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
            placeholder={locale === 'ar' ? 'البحث برقم الطلب أو اسم العميل...' : 'Search by order # or customer name...'}
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
            <option value="ALL">{locale === 'ar' ? 'جميع الطلبات' : 'All Requests'} ({approvals.length})</option>
            <option value="PENDING">🟡 {locale === 'ar' ? 'بانتظار القرار (Pending)' : 'Pending Decision'}</option>
            <option value="APPROVED">🟢 {locale === 'ar' ? 'معتمد ومقبول (Approved)' : 'Approved'}</option>
            <option value="REJECTED">🔴 {locale === 'ar' ? 'مرفوض (Rejected)' : 'Rejected'}</option>
          </select>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'نوع الموافقة' : 'Type'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'أمر البيع والعميل' : 'Order & Supermarket'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'طالب الاعتماد' : 'Requested By'}</th>
              <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'القيمة الإجمالية' : 'Order Total'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'تاريخ الطلب' : 'Date'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
              <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'قرار الإدارة' : 'Decision Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading approvals...'}</td></tr>
            ) : approvals.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا توجد طلبات موافقة مسجلة.' : 'No approval requests found.'}</td></tr>
            ) : (
              approvals.map((a) => {
                const isPending = a.status === 'PENDING'
                const isApproved = a.status === 'APPROVED'
                const isRejected = a.status === 'REJECTED'

                return (
                  <tr key={a.id} className={`hover:bg-slate-800/25 transition-colors ${isPending ? 'bg-amber-950/15' : ''}`}>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-sky-400 block">{a.approval_type === 'DISCOUNT' ? (locale === 'ar' ? 'طلب خصم إضافي' : 'Discount Override') : (locale === 'ar' ? 'تجاوز سقف الائتمان' : 'Credit Override')}</span>
                      {a.discount_percentage > 0 && <span className="text-[10px] text-emerald-400 font-mono">خصم مطلوب: {a.discount_percentage}%</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{a.order_number || 'SO-DIRECT'}</span>
                      <span className="text-[10px] text-slate-400">{a.customer_name || '—'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-semibold block">{a.requester_name || 'مندوب المبيعات'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{a.requester_email}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right rtl:text-left font-mono font-bold text-white">
                      {formatCurrency(a.total_amount, locale)}
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-400">{new Date(a.requested_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</td>

                    <td className="py-3.5 px-4 text-center">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                          <Clock className="w-3 h-3" /> {locale === 'ar' ? 'بانتظار القرار' : 'Pending'}
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> {locale === 'ar' ? 'معتمد' : 'Approved'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> {locale === 'ar' ? 'مرفوض' : 'Rejected'}
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right rtl:text-left">
                      {isPending ? (
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <button
                            disabled={actionLoadingId === a.id}
                            onClick={() => handleDecision(a, true)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all"
                          >
                            {locale === 'ar' ? 'اعتماد' : 'Approve'}
                          </button>
                          <button
                            disabled={actionLoadingId === a.id}
                            onClick={() => handleDecision(a, false)}
                            className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-all"
                          >
                            {locale === 'ar' ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 block">
                          {a.decision_by_name ? `${locale === 'ar' ? 'بواسطة: ' : 'By: '}${a.decision_by_name}` : '—'}
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
  )
}
