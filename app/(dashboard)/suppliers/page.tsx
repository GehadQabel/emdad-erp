'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { createSupplierAction } from '@/lib/actions/suppliers.actions'
import { 
  Building2, Plus, Search, RefreshCw, Phone, Mail, CheckCircle2, XCircle
} from 'lucide-react'

export default function SuppliersPage() {
  const { locale } = useI18n()
  const supabase = createClient()

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    tax_number: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await (supabase as any).rpc('rpc_get_suppliers_overview', {
        p_search: search.trim() || null,
      })
      setSuppliers(data || [])
    } catch (err) {
      console.error('Error loading suppliers:', err)
      setSuppliers([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const res = await createSupplierAction(formData)
    if (!res.success) {
      setFormError(res.error || 'Failed to create supplier.')
      setSubmitting(false)
    } else {
      setIsModalOpen(false)
      setSubmitting(false)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'الموردين والشركات المصنعة' : 'Suppliers & Manufacturers'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'دليل المصانع، الشركات الغذائية الموردة، وأرقام السجل والملف الضريبي' : 'Food manufacturers directory, supply contracts, and tax IDs'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'إضافة مورد / مصنع' : 'New Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadData()}
          placeholder={locale === 'ar' ? 'البحث باسم المورد أو كود الشركة (اضغط Enter)...' : 'Search by supplier name or code...'}
          className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'كود واسم الشركة' : 'Code & Company'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'المسؤول' : 'Contact Representative'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الهاتف والبريد' : 'Contact Phone & Email'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading suppliers...'}</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا يوجد موردين مسجلين.' : 'No suppliers found.'}</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s?.id || s?.code} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block text-sm">{s?.name || '—'}</span>
                    <span className="font-mono text-sky-400 text-[10px]">{s?.code || '—'}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-semibold">{s?.contact_person || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" /> {s?.phone || '—'}</p>
                    {s?.email && <p className="flex items-center gap-1.5 mt-0.5 text-slate-500"><Mail className="w-3 h-3" /> {s?.email}</p>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{s?.tax_number || '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> {locale === 'ar' ? 'معتمد ونشط' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" /> {locale === 'ar' ? 'تسجيل مورد / شركة مصنعة' : 'Register New Supplier'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"><XCircle className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              {formError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">{formError}</div>}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'كود المورد *' : 'Supplier Code *'}</label>
                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="SUP-DOMTY" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'اسم الشركة / المصنع *' : 'Company Name *'}</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Domty Cheese & Juices / دومتي للأغذية" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'مسؤول التوريد' : 'Contact Person'}</label>
                  <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} placeholder="طارق النجار" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+201011112233" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="sales@domty.org" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{locale === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}</label>
                  <input type="text" value={formData.tax_number} onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })} placeholder="100-200-400" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25">
                  {submitting ? 'Saving...' : (locale === 'ar' ? 'حفظ المورد' : 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
