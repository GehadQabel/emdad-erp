'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { recordPaymentAction } from '@/lib/actions/finance.actions'
import { Coins, Plus, RefreshCw, Building2, CheckCircle2 } from 'lucide-react'

export default function PaymentsPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [payments, setPayments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Payment Form
  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState<number>(5000)
  const [method, setMethod] = useState('BANK_TRANSFER')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const { data: payData } = await supabase.rpc('rpc_get_finance_payments')
    const { data: custData } = await supabase.from('customers').select('id, name, code').eq('is_active', true)

    setPayments(payData || [])
    setCustomers(custData || [])
    if (custData?.[0] && !customerId) setCustomerId(custData[0].id)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const res = await recordPaymentAction({
      customer_id: customerId,
      payment_amount: Number(amount) || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: method,
      payment_reference: reference || 'Direct Voucher',
      allocations: [],
    })

    if (!res.success) {
      setFormError(res.error || 'Failed to record payment.')
      setSubmitting(false)
    } else {
      setIsModalOpen(false)
      setSubmitting(false)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-emerald-400" />
            {locale === 'ar' ? 'سندات التحصيل والمدفوعات' : 'Customer Payments & Receipts'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'سجل السداد النقدي والتحويلات البنكية المحصلة من العملاء' : 'Confirmed bank transfers and cash collections'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'تسجيل سند تحصيل' : 'Record Payment'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'رقم السند' : 'Payment #'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'العميل' : 'Customer'}</th>
              <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'المبلغ المحصل' : 'Amount (EGP)'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'طريقة السداد' : 'Method'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'رقم المعاملة / الشيك' : 'Reference'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'تاريخ التحصيل' : 'Payment Date'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading payments...'}</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا توجد مدفوعات مسجلة.' : 'No payments recorded.'}</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.payment_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{p.customer_name}</td>
                  <td className="py-3.5 px-4 text-right rtl:text-left font-mono font-bold text-emerald-400">{formatCurrency(p.payment_amount, locale)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{p.payment_method}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{p.payment_reference || '—'}</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">{p.payment_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4 text-emerald-400" /> {locale === 'ar' ? 'تسجيل سند تحصيل دفعة من عميل' : 'Record Customer Payment'}
            </h2>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">{formError}</div>}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'العميل (السوبرماركت)' : 'Customer'}</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={{ backgroundColor: '#020617', color: '#ffffff' }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none">
                  {customers.map((c) => <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'المبلغ المحصل (ج.م)' : 'Amount (EGP)'}</label>
                <input type="number" step="10" min="1" required value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'طريقة التحصيل' : 'Method'}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ backgroundColor: '#020617', color: '#ffffff' }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none">
                  <option value="BANK_TRANSFER" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>تحويل بنكي (Bank Transfer)</option>
                  <option value="CASH" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>نقدي (Cash)</option>
                  <option value="CHECK" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>شيك بنكي (Check)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'رقم الإيداع / الشيك / الحوالة' : 'Reference / TXN'}</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. CIB-TXN-100234" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25">
                  {submitting ? 'Saving...' : (locale === 'ar' ? 'حفظ سند التحصيل' : 'Save Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
