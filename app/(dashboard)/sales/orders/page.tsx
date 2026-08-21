'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { 
  createSalesOrderAction, 
  approveSalesOrderAction, 
  prepareSalesOrderAction, 
  readySalesOrderAction, 
  deliverSalesOrderAction, 
  cancelSalesOrderAction 
} from '@/lib/actions/sales.actions'
import { 
  ShoppingCart, Plus, Search, Filter, RefreshCw, 
  Truck, CheckCircle, Clock, XCircle, AlertTriangle, 
  MapPin, Warehouse, Trash2, ShieldAlert, Check, Coins
} from 'lucide-react'

export default function SalesOrdersPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [orders, setOrders] = useState<any[]>([])
  const [formDataRef, setFormDataRef] = useState<any>({
    customers: [],
    locations: [],
    warehouses: [],
    products: [],
  })

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Order Form State
  const [customerId, setCustomerId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CREDIT')
  const [orderDiscount, setOrderDiscount] = useState<number>(0)
  const [orderItems, setOrderItems] = useState<Array<{
    product_id: string
    ordered_qty: number
    unit_price: number
    line_discount_percentage: number
  }>>([])

  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadData() {
    setLoading(true)

    // 1. Fetch Sales Orders Feed
    const { data: ordersData } = await supabase.rpc('rpc_get_sales_orders', {
      p_status: selectedStatus === 'ALL' ? null : selectedStatus,
      p_search: search.trim() || null,
    } as any)

    // 2. Fetch Reference Form Data
    const { data: refData } = await supabase.rpc('rpc_get_sales_order_form_data')

    if (ordersData) setOrders(ordersData as any)
    if (refData) {
      const parsed = refData as any
      setFormDataRef(parsed)

      if (parsed.customers?.[0] && !customerId) {
        const firstCustId = parsed.customers[0].id
        setCustomerId(firstCustId)
        const locs = (parsed.locations || []).filter((l: any) => l.customer_id === firstCustId)
        setLocationId(locs[0]?.id || '')
      }
      if (parsed.warehouses?.[0] && !warehouseId) {
        setWarehouseId(parsed.warehouses[0].id)
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedStatus])

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId)
    const availableLocs = (formDataRef.locations || []).filter((l: any) => l.customer_id === cId)
    setLocationId(availableLocs[0]?.id || '')
  }

  const handleOpenCreateModal = () => {
    setFormError(null)
    const defaultCust = formDataRef.customers?.[0]?.id || ''
    const availableLocs = (formDataRef.locations || []).filter((l: any) => l.customer_id === defaultCust)
    
    setCustomerId(defaultCust)
    setLocationId(availableLocs[0]?.id || '')
    setWarehouseId(formDataRef.warehouses?.[0]?.id || '')
    setPaymentType('CREDIT')
    setOrderDiscount(0)

    if (formDataRef.products?.[0]) {
      setOrderItems([
        {
          product_id: formDataRef.products[0].id,
          ordered_qty: 10,
          unit_price: Number(formDataRef.products[0].base_selling_price) || 50,
          line_discount_percentage: 0,
        }
      ])
    } else {
      setOrderItems([])
    }

    setIsCreateModalOpen(true)
  }

  const handleAddItemLine = () => {
    if (formDataRef.products?.[0]) {
      setOrderItems((prev) => [
        ...prev,
        {
          product_id: formDataRef.products[0].id,
          ordered_qty: 1,
          unit_price: Number(formDataRef.products[0].base_selling_price) || 0,
          line_discount_percentage: 0,
        }
      ])
    }
  }

  const handleRemoveItemLine = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemProductChange = (index: number, pId: string) => {
    const prod = formDataRef.products?.find((p: any) => p.id === pId)
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, product_id: pId, unit_price: Number(prod?.base_selling_price) || 0 }
          : item
      )
    )
  }

  const calculatedSubtotal = orderItems.reduce((sum, item) => {
    const gross = item.ordered_qty * item.unit_price
    const net = gross * (1 - item.line_discount_percentage / 100)
    return sum + net
  }, 0)

  const calculatedDiscountAmount = calculatedSubtotal * (orderDiscount / 100)
  const calculatedFinalTotal = calculatedSubtotal - calculatedDiscountAmount

  const selectedCustomerObj = formDataRef.customers?.find((c: any) => c.id === customerId)
  const customerLocationsList = (formDataRef.locations || []).filter((l: any) => l.customer_id === customerId)

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!customerId) {
      setFormError(locale === 'ar' ? 'يرجى اختيار العميل.' : 'Please select a customer.')
      setSubmitting(false)
      return
    }

    if (!locationId) {
      setFormError(locale === 'ar' ? 'يرجى اختيار الفرع.' : 'Please select a delivery branch.')
      setSubmitting(false)
      return
    }

    if (orderItems.length === 0) {
      setFormError(locale === 'ar' ? 'يرجى إضافة صنف واحد على الأقل.' : 'Please add at least one item.')
      setSubmitting(false)
      return
    }

    const payload = {
      customer_id: customerId,
      customer_location_id: locationId,
      warehouse_id: warehouseId,
      payment_type: paymentType,
      discount_percentage: orderDiscount,
      items: orderItems,
    }

    const res = await createSalesOrderAction(payload)
    if (!res.success) {
      setFormError(res.error || 'Failed to create sales order.')
      setSubmitting(false)
    } else {
      setIsCreateModalOpen(false)
      setSubmitting(false)
      loadData()
    }
  }

  const handleApprove = async (orderId: string) => {
    setActionLoadingId(orderId)
    const res = await approveSalesOrderAction(orderId)
    if (!res.success) alert(`Approval error: ${res.error}`)
    loadData()
    setActionLoadingId(null)
  }

  const handlePrepare = async (orderId: string) => {
    setActionLoadingId(orderId)
    const res = await prepareSalesOrderAction(orderId)
    if (!res.success) alert(`Preparation error: ${res.error}`)
    loadData()
    setActionLoadingId(null)
  }

  const handleReady = async (orderId: string) => {
    setActionLoadingId(orderId)
    const res = await readySalesOrderAction(orderId)
    if (!res.success) alert(`Ready error: ${res.error}`)
    loadData()
    setActionLoadingId(null)
  }

  const handleDeliver = async (orderId: string) => {
    const msg = locale === 'ar' 
      ? 'تأكيد التسليم الفعلي للبضاعة للسوبرماركت؟ سيتم خصم المخزون فوراً وإصدار فاتورة المديونية بالجنيه المصري.'
      : 'Confirm physical delivery to supermarket? This will decrement warehouse stock and generate the receivable invoice.'
    if (!confirm(msg)) return
    setActionLoadingId(orderId)
    const res = await deliverSalesOrderAction(orderId)
    if (!res.success) alert(`Delivery error: ${res.error}`)
    loadData()
    setActionLoadingId(null)
  }

  const handleCancel = async (orderId: string) => {
    const msg = locale === 'ar' 
      ? 'هل أنت متأكد من إلغاء أمر البيع؟ سيتم فك حجز المخزون وإرجاعه متاحاً للبيع فوراً.'
      : 'Are you sure you want to cancel this order? Any reserved stock will be released.'
    if (!confirm(msg)) return
    setActionLoadingId(orderId)
    const res = await cancelSalesOrderAction(orderId)
    if (!res.success) alert(`Cancellation error: ${res.error}`)
    loadData()
    setActionLoadingId(null)
  }

  const statusConfigs: Record<string, { badge: string; icon: any }> = {
    DRAFT: { badge: 'bg-slate-800 text-slate-300 border-slate-700', icon: Clock },
    PENDING_APPROVAL: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertTriangle },
    APPROVED: { badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: CheckCircle },
    PREPARING: { badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Warehouse },
    READY_FOR_DELIVERY: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Truck },
    DELIVERED: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Check },
    CANCELLED: { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: XCircle },
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-sky-400" />
            {t('sales.orders.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('sales.orders.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('sales.orders.newOrder')}</span>
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
            placeholder={t('sales.orders.searchPlaceholder')}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL">{t('sales.orders.statuses.ALL')} ({orders.length})</option>
            <option value="DRAFT">{t('sales.orders.statuses.DRAFT')}</option>
            <option value="PENDING_APPROVAL">{t('sales.orders.statuses.PENDING_APPROVAL')}</option>
            <option value="APPROVED">{t('sales.orders.statuses.APPROVED')}</option>
            <option value="PREPARING">{t('sales.orders.statuses.PREPARING')}</option>
            <option value="READY_FOR_DELIVERY">{t('sales.orders.statuses.READY_FOR_DELIVERY')}</option>
            <option value="DELIVERED">{t('sales.orders.statuses.DELIVERED')}</option>
            <option value="CANCELLED">{t('sales.orders.statuses.CANCELLED')}</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{t('sales.orders.table.orderNumber')}</th>
                <th className="py-3.5 px-4">{t('sales.orders.table.customer')}</th>
                <th className="py-3.5 px-4">{t('sales.orders.table.warehouse')}</th>
                <th className="py-3.5 px-4 text-center">{t('sales.orders.table.items')}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{t('sales.orders.table.total')}</th>
                <th className="py-3.5 px-4 text-center">{t('sales.orders.table.paymentType')}</th>
                <th className="py-3.5 px-4 text-center">{t('sales.orders.table.status')}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{t('sales.orders.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {locale === 'ar' ? 'جاري تحميل أوامر البيع...' : 'Loading sales orders...'}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {locale === 'ar' ? 'لا توجد أوامر بيع مطابقة.' : 'No sales orders found.'}
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusConf = statusConfigs[o.status] || statusConfigs.DRAFT
                  const StatusIcon = statusConf.icon
                  const isActionLoading = actionLoadingId === o.id
                  const localizedStatus = t(`sales.orders.statuses.${o.status}`)

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/25 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                        {o.order_number}
                        <span className="block text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                          {new Date(o.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">{o.customer_name}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" /> {o.location_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                          {o.warehouse_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono font-bold">
                          {o.items_count}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right rtl:text-left font-bold text-white text-sm">
                        {formatCurrency(o.total_amount, locale)}
                        {o.discount_percentage > 0 && (
                          <span className="block text-[10px] text-emerald-400 font-normal">
                            ({locale === 'ar' ? `خصم ${o.discount_percentage}%` : `-${o.discount_percentage}% Disc`})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.payment_type === 'CASH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
                          {o.payment_type === 'CASH' 
                            ? (locale === 'ar' ? 'نقدي' : 'Cash') 
                            : (locale === 'ar' ? 'آجل' : 'Credit')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConf.badge}`}>
                          <StatusIcon className="w-3 h-3" />
                          {localizedStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          {o.status === 'PENDING_APPROVAL' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleApprove(o.id)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-3 h-3" /> {t('sales.orders.actions.approve')}
                            </button>
                          )}

                          {o.status === 'APPROVED' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handlePrepare(o.id)}
                              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Prepare"
                            >
                              <Warehouse className="w-3 h-3" /> {t('sales.orders.actions.prepare')}
                            </button>
                          )}

                          {o.status === 'PREPARING' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleReady(o.id)}
                              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="Ready"
                            >
                              <Truck className="w-3 h-3" /> {t('sales.orders.actions.ready')}
                            </button>
                          )}

                          {o.status === 'READY_FOR_DELIVERY' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleDeliver(o.id)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1"
                              title="Deliver"
                            >
                              <Truck className="w-3 h-3" /> {t('sales.orders.actions.deliver')}
                            </button>
                          )}

                          {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PREPARING', 'READY_FOR_DELIVERY'].includes(o.status) && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleCancel(o.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Supermarket Sales Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-sky-400" /> {t('sales.orders.modal.title')}
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                  {formError}
                </div>
              )}

              {/* Blocked Customer Warning */}
              {selectedCustomerObj?.is_blocked && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{t('sales.orders.modal.blockedCustomerWarning')}</span>
                </div>
              )}

              {/* Customer, Location & Warehouse Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Customer */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t('sales.orders.modal.customer')}</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {formDataRef.customers?.map((c: any) => (
                      <option 
                        key={c.id} 
                        value={c.id} 
                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t('sales.orders.modal.location')}</label>
                  <select
                    required
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {customerLocationsList.length === 0 ? (
                      <option value="" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        {locale === 'ar' ? 'لا توجد فروع مسجلة' : 'No locations'}
                      </option>
                    ) : (
                      customerLocationsList.map((l: any) => (
                        <option 
                          key={l.id} 
                          value={l.id} 
                          style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                        >
                          {l.location_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t('sales.orders.modal.warehouse')}</label>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {formDataRef.warehouses?.map((w: any) => (
                      <option 
                        key={w.id} 
                        value={w.id} 
                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                      >
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Type & Discount */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t('sales.orders.modal.paymentType')}</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="CREDIT" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      {t('sales.orders.paymentTypes.CREDIT')}
                    </option>
                    <option value="CASH" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                      {t('sales.orders.paymentTypes.CASH')}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t('sales.orders.modal.orderDiscount')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={orderDiscount}
                    onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" /> 
                    {locale === 'ar' ? 'أصناف الطلبية' : 'Order Lines'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {t('sales.orders.modal.addItem')}
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left rtl:text-right text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">{t('sales.orders.modal.product')}</th>
                        <th className="py-2.5 px-3 text-right rtl:text-left">{t('sales.orders.modal.unitPrice')}</th>
                        <th className="py-2.5 px-3 text-center">{t('sales.orders.modal.quantity')}</th>
                        <th className="py-2.5 px-3 text-center">{t('sales.orders.modal.lineDiscount')}</th>
                        <th className="py-2.5 px-3 text-right rtl:text-left">{t('sales.orders.modal.lineTotal')}</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {orderItems.map((item, idx) => {
                        const lineGross = item.ordered_qty * item.unit_price
                        const lineNet = lineGross * (1 - item.line_discount_percentage / 100)

                        return (
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

                            <td className="py-2 px-3 text-right rtl:text-left font-mono text-slate-300">
                              {formatCurrency(item.unit_price, locale)}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.ordered_qty}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1
                                  setOrderItems((prev) => prev.map((l, i) => (i === idx ? { ...l, ordered_qty: val } : l)))
                                }}
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono focus:border-sky-500 focus:outline-none"
                              />
                            </td>

                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={item.line_discount_percentage}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0
                                  setOrderItems((prev) => prev.map((l, i) => (i === idx ? { ...l, line_discount_percentage: val } : l)))
                                }}
                                className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono focus:border-sky-500 focus:outline-none"
                              />
                            </td>

                            <td className="py-2 px-3 text-right rtl:text-left font-mono font-bold text-white">
                              {formatCurrency(lineNet, locale)}
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
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t('sales.orders.modal.subtotal')}</span>
                  <span className="font-mono text-white">{formatCurrency(calculatedSubtotal, locale)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('sales.orders.modal.discount')}</span>
                  <span className="font-mono text-emerald-400">-{formatCurrency(calculatedDiscountAmount, locale)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>{t('sales.orders.modal.finalTotal')}</span>
                  <span className="font-mono text-sky-400">{formatCurrency(calculatedFinalTotal, locale)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  {t('sales.orders.modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedCustomerObj?.is_blocked}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold hover:from-sky-400 hover:to-indigo-500 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : t('sales.orders.modal.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
