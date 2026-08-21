'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createPurchaseOrderAction } from '@/lib/actions/purchasing.actions'
import { 
  Truck, Plus, Search, RefreshCw, 
  Coins, Trash2, XCircle
} from 'lucide-react'

export default function PurchaseOrdersPage() {
  const { locale } = useI18n()
  const supabase = createClient()

  const [orders, setOrders] = useState<any[]>([])
  const [formDataRef, setFormDataRef] = useState<any>({
    suppliers: [],
    warehouses: [],
    products: [],
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // PO Form State
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [poItems, setPoItems] = useState<Array<{ product_id: string; ordered_qty: number; unit_cost: number }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      // 1. Fetch Orders List
      const { data: poData } = await (supabase as any).rpc('rpc_get_purchasing_orders', {
        p_status: selectedStatus === 'ALL' ? null : selectedStatus,
        p_search: search.trim() || null,
      })

      // 2. Fetch Reference Data (Suppliers, Warehouses, Products)
      const { data: refData } = await (supabase as any).rpc('rpc_get_purchasing_form_data')

      setOrders(poData || [])
      if (refData) {
        const parsed = refData as any
        setFormDataRef(parsed)

        if (parsed.suppliers?.[0] && !supplierId) setSupplierId(parsed.suppliers[0].id)
        if (parsed.warehouses?.[0] && !warehouseId) setWarehouseId(parsed.warehouses[0].id)
      }
    } catch (err) {
      console.error('Error loading POs:', err)
      setOrders([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedStatus])

  const handleOpenModal = () => {
    setFormError(null)
    const defaultSuppId = formDataRef.suppliers?.[0]?.id || ''
    const defaultWhId = formDataRef.warehouses?.[0]?.id || ''

    setSupplierId(defaultSuppId)
    setWarehouseId(defaultWhId)
    setExpectedDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])

    if (formDataRef.products?.[0]) {
      setPoItems([
        {
          product_id: formDataRef.products[0].id,
          ordered_qty: 50,
          unit_cost: Number(formDataRef.products[0].last_purchase_price) || 40,
        },
      ])
    } else {
      setPoItems([])
    }

    setIsModalOpen(true)
  }

  const handleAddItemLine = () => {
    if (formDataRef.products?.[0]) {
      setPoItems((prev) => [
        ...prev,
        {
          product_id: formDataRef.products[0].id,
          ordered_qty: 10,
          unit_cost: Number(formDataRef.products[0].last_purchase_price) || 50,
        },
      ])
    }
  }

  const handleRemoveItemLine = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemProductChange = (index: number, pId: string) => {
    const prod = formDataRef.products?.find((p: any) => p.id === pId)
    setPoItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, product_id: pId, unit_cost: Number(prod?.last_purchase_price) || 50 }
          : item
      )
    )
  }

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!supplierId) {
      setFormError(locale === 'ar' ? 'يرجى اختيار المورد / الشركة المصنعة.' : 'Please select a supplier.')
      setSubmitting(false)
      return
    }

    if (!warehouseId) {
      setFormError(locale === 'ar' ? 'يرجى اختيار مستودع الاستلام.' : 'Please select a warehouse.')
      setSubmitting(false)
      return
    }

    if (poItems.length === 0) {
      setFormError(locale === 'ar' ? 'يرجى إضافة صنف واحد على الأقل لأمر الشراء.' : 'Please add at least one product line.')
      setSubmitting(false)
      return
    }

    const res = await createPurchaseOrderAction({
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      expected_delivery_date: expectedDate,
      items: poItems,
    })

    if (!res.success) {
      setFormError(res.error || 'Failed to create PO.')
      setSubmitting(false)
    } else {
      setIsModalOpen(false)
      setSubmitting(false)
      loadData()
    }
  }

  const totalCalculated = poItems.reduce((acc, item) => acc + item.ordered_qty * item.unit_cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'أوامر الشراء والتوريد من المصانع' : 'Purchase Orders'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'عقود التوريد مع الشركات والمصانع ومتابعة مواعيد وصول البضائع' : 'Vendor supply contracts and expected replenishment schedule'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{locale === 'ar' ? 'أمر شراء جديد' : 'New Purchase Order'}</span>
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
            placeholder={locale === 'ar' ? 'البحث برقم أمر الشراء أو اسم المورد والمصنع (اضغط Enter)...' : 'Search by PO # or Supplier Name...'}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
          className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
        >
          <option value="ALL">{locale === 'ar' ? 'جميع الأوامر' : 'All Orders'} ({orders.length})</option>
          <option value="OPEN">{locale === 'ar' ? 'مفتوح للتوريد (Open)' : 'Open'}</option>
          <option value="DRAFT">{locale === 'ar' ? 'مسودة (Draft)' : 'Draft'}</option>
          <option value="CANCELLED">{locale === 'ar' ? 'ملغي (Cancelled)' : 'Cancelled'}</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left rtl:text-right text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'رقم أمر الشراء' : 'PO Number'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'المورد / الشركة المصنعة' : 'Supplier'}</th>
              <th className="py-3.5 px-4">{locale === 'ar' ? 'مستودع الاستلام' : 'Destination Warehouse'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'تاريخ التوريد المتوقع' : 'Expected Delivery'}</th>
              <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'القيمة الإجمالية' : 'Total (EGP)'}</th>
              <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'حالة التوريد والاستلام' : 'Receiving Progress'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {locale === 'ar' ? 'جاري تحميل أوامر الشراء...' : 'Loading POs...'}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  {locale === 'ar' ? 'لا توجد أوامر شراء مطابقة.' : 'No purchase orders found.'}
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po?.id || po?.po_number} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">{po?.po_number || '—'}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{po?.supplier_name || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-300">{po?.warehouse_name || '—'}</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">{formatDate(po?.expected_delivery_date)}</td>
                  <td className="py-3.5 px-4 text-right rtl:text-left font-bold text-white">
                    {formatCurrency(po?.total_amount, locale)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        po?.received_status === 'RECEIVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : po?.received_status === 'PARTIALLY_RECEIVED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {po?.received_status === 'RECEIVED'
                        ? (locale === 'ar' ? 'تم الاستلام بالكامل' : 'Fully Received')
                        : po?.received_status === 'PARTIALLY_RECEIVED'
                        ? (locale === 'ar' ? 'استلام جزئي' : 'Partially Received')
                        : (locale === 'ar' ? 'بانتظار وصول الشحنة' : 'Awaiting Delivery')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-400" />{' '}
                {locale === 'ar' ? 'تسجيل أمر شراء وتوريد بضاعة من مصنع' : 'Create Purchase Order'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Supplier Dropdown */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {locale === 'ar' ? 'المورد / الشركة المصنعة *' : 'Supplier *'}
                  </label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {formDataRef.suppliers?.map((s: any) => (
                      <option key={s.id} value={s.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warehouse Dropdown */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {locale === 'ar' ? 'مستودع الاستلام والتخزين *' : 'Destination Warehouse *'}
                  </label>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {formDataRef.warehouses?.map((w: any) => (
                      <option key={w.id} value={w.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expected Delivery Date */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {locale === 'ar' ? 'تاريخ التوريد المتوقع *' : 'Expected Delivery Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Lines */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    {locale === 'ar' ? 'أصناف أمر الشراء والكميات المطلوبة' : 'PO Product Lines'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {locale === 'ar' ? 'إضافة صنف للطلب' : 'Add Line Item'}
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">{locale === 'ar' ? 'المنتج الغذائي' : 'Product'}</th>
                        <th className="py-2.5 px-3 text-center">{locale === 'ar' ? 'الكمية المطلوبة' : 'Quantity'}</th>
                        <th className="py-2.5 px-3 text-right rtl:text-left">{locale === 'ar' ? 'سعر التكلفة (ج.م)' : 'Cost Price (EGP)'}</th>
                        <th className="py-2.5 px-3 text-right rtl:text-left">{locale === 'ar' ? 'إجمالي البند' : 'Line Total'}</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {poItems.map((item, idx) => (
                        <tr key={idx} className="bg-slate-900/40">
                          <td className="py-2 px-3">
                            <select
                              value={item.product_id}
                              onChange={(e) => handleItemProductChange(idx, e.target.value)}
                              style={{ backgroundColor: '#020617', color: '#ffffff' }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none text-[11px]"
                            >
                              {formDataRef.products?.map((p: any) => (
                                <option key={p.id} value={p.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                                  {p.product_code} - {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.ordered_qty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1
                                setPoItems((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, ordered_qty: val } : l))
                                )
                              }}
                              className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono focus:border-sky-500 focus:outline-none"
                            />
                          </td>

                          <td className="py-2 px-3 text-right rtl:text-left">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.unit_cost}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setPoItems((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, unit_cost: val } : l))
                                )
                              }}
                              className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono font-bold focus:border-sky-500 focus:outline-none"
                            />
                          </td>

                          <td className="py-2 px-3 text-right rtl:text-left font-mono font-bold text-white">
                            {formatCurrency(item.ordered_qty * item.unit_cost, locale)}
                          </td>

                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">
                  {locale === 'ar' ? 'إجمالي تكلفة أمر الشراء:' : 'Total PO Cost:'}
                </span>
                <span className="text-base font-extrabold text-sky-400 font-mono">
                  {formatCurrency(totalCalculated, locale)}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (locale === 'ar' ? 'تأكيد وحفظ أمر الشراء' : 'Confirm & Save PO')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
