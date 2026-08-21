'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils'
import { PackageCheck, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function GoodsReceiptsPage() {
  const { locale } = useI18n()
  const supabase = createClient()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadReceipts() {
    setLoading(true)
    try {
      const { data } = await (supabase as any).rpc('rpc_get_goods_receipts')
      setReceipts(data || [])
    } catch (err) {
      console.error('Error loading receipts:', err)
      setReceipts([])
    }
    setLoading(false)
  }

  useEffect(() => { loadReceipts() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            {locale === 'ar' ? 'أذون استلام البضائع بالمستودع' : 'Goods Receipts Log'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'سجل توريد البضائع الفعلي وزيادة أرصدة المخزون (PURCHASE_RECEIPT)' : 'Confirmed physical inventory intake records'}
          </p>
        </div>

        <button onClick={() => loadReceipts()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'رقم إذن الاستلام' : 'Receipt #'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'رقم أمر الشراء' : 'PO Ref'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'المورد' : 'Supplier'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'مستودع الاستلام' : 'Warehouse'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'رقم بوليصة الشحن' : 'Waybill Note'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'تاريخ الاستلام الفعلي' : 'Confirmed Date'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading receipts...'}</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا توجد أذون استلام مسجلة.' : 'No goods receipts recorded.'}</td></tr>
            ) : (
              receipts.map((gr) => (
                <tr key={gr?.id || gr?.receipt_number} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{gr?.receipt_number || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-sky-400">{gr?.po_number || '—'}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{gr?.supplier_name || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-300">{gr?.warehouse_name || '—'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{gr?.supplier_delivery_note || '—'}</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">{formatDate(gr?.confirmed_at || gr?.created_at)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {locale === 'ar' ? 'مؤكد ومضاف للمخزون' : 'Confirmed & Stocked'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
