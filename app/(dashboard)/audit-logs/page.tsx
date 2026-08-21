'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils'
import { 
  History, Search, Filter, RefreshCw, Eye, 
  Code2, XCircle
} from 'lucide-react'

export default function AuditLogsPage() {
  const { locale } = useI18n()
  const supabase = createClient()

  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [activeDiffLog, setActiveDiffLog] = useState<any | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await (supabase as any).rpc('rpc_get_audit_logs_feed', {
        p_action: actionFilter === 'ALL' ? null : actionFilter,
        p_search: search.trim() || null,
      })
      setLogs(data || [])
    } catch (err) {
      console.error('Error loading audit logs:', err)
      setLogs([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [actionFilter])

  const actionStyles: Record<string, string> = {
    CREATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    UPDATE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    ARCHIVE: 'bg-slate-800 text-slate-400 border-slate-700',
    BLOCK: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    UNBLOCK: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    APPROVE: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELIVER: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'سجل التدقيق والرقابة غير القابل للتعديل' : 'Immutable Compliance Audit Logs'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'رصد جميع حركات التعديل، الإضافة، الحظر، وتغيير الإعدادات لحظة بلحظة' : 'Real-time record of all mutations, overrides, and security events'}
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
            placeholder={locale === 'ar' ? 'البحث باسم الجدول أو اسم المستخدم (اضغط Enter)...' : 'Search by table name or user...'}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL">{locale === 'ar' ? 'جميع الإجراءات' : 'All Actions'} ({logs.length})</option>
            <option value="CREATE">CREATE (إضافة)</option>
            <option value="UPDATE">UPDATE (تعديل)</option>
            <option value="ARCHIVE">ARCHIVE (أرشفة)</option>
            <option value="BLOCK">BLOCK (حظر)</option>
            <option value="UNBLOCK">UNBLOCK (فك حظر)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'نوع الإجراء' : 'Action'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الجدول المستهدف' : 'Target Table'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'المنفذ' : 'Actor User'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</th>
              <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'مقارنة التغييرات' : 'JSON Diff'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading audit logs...'}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا توجد سجلات تدقيق مطابقة.' : 'No audit records found.'}</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log?.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono ${actionStyles[log?.action] || 'bg-slate-800 text-slate-300'}`}>
                      {log?.action || 'AUDIT'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                    public.{log?.target_table || '—'}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="font-semibold text-white block">{log?.actor_name || '—'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log?.actor_email || '—'}</span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                    {formatDate(log?.performed_at)}
                  </td>

                  <td className="py-3.5 px-4 text-right rtl:text-left">
                    <button
                      onClick={() => setActiveDiffLog(log)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium inline-flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-400" /> {locale === 'ar' ? 'عرض التغيير' : 'View Diff'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Diff Modal */}
      {activeDiffLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" /> {locale === 'ar' ? 'تفاصيل سجل التدقيق والبيانات المتغيرة' : 'Audit Log Record Diff'}
              </h2>
              <button onClick={() => setActiveDiffLog(null)} className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div><span className="text-slate-500">Action:</span> <strong className="text-white">{activeDiffLog.action}</strong></div>
                <div><span className="text-slate-500">Table:</span> <strong className="text-sky-400 font-mono">{activeDiffLog.target_table}</strong></div>
                <div><span className="text-slate-500">Actor:</span> <strong className="text-white">{activeDiffLog.actor_name}</strong></div>
                <div><span className="text-slate-500">Time:</span> <span className="text-slate-400 font-mono">{activeDiffLog.performed_at}</span></div>
              </div>

              {activeDiffLog.old_values && (
                <div>
                  <h3 className="font-bold text-rose-400 mb-1">{locale === 'ar' ? 'القيم السابقة (Before):' : 'Old Values (Before):'}</h3>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
                    {JSON.stringify(activeDiffLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {activeDiffLog.new_values && (
                <div>
                  <h3 className="font-bold text-emerald-400 mb-1">{locale === 'ar' ? 'القيم الجديدة (After):' : 'New Values (After):'}</h3>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
                    {JSON.stringify(activeDiffLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button onClick={() => setActiveDiffLog(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
