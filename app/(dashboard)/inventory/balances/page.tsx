'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatQuantity } from '@/lib/utils'
import { 
  Warehouse, Search, Filter, ShieldCheck, 
  AlertTriangle, AlertCircle, RefreshCw, Barcode, Layers
} from 'lucide-react'

interface StockCardRow {
  product_id: string
  warehouse_id: string
  product_code: string
  barcode: string | null
  product_name: string
  warehouse_name: string
  on_hand_qty: number
  reserved_qty: number
  available_qty: number
  min_stock_level: number
  category_name?: string
  unit_code?: string
}

export default function InventoryBalancesPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [stockCards, setStockCards] = useState<StockCardRow[]>([])
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL')
  const [stockConditionFilter, setStockConditionFilter] = useState<string>('ALL')

  async function loadData() {
    setLoading(true)

    // 1. Fetch Warehouses
    const { data: refData } = await supabase.rpc('rpc_get_product_form_data')
    if (refData) {
      const parsed = refData as any
      setWarehouses(parsed.warehouses || [])
    }

    // 2. Fetch Live Stock Balances via RPC
    const whFilter = selectedWarehouse === 'ALL' ? null : selectedWarehouse
    const { data: balanceData } = await supabase.rpc('rpc_get_inventory_balances', {
      p_warehouse_id: whFilter,
      p_search: search.trim() || null,
    } as any)

    if (balanceData) {
      setStockCards(balanceData as any)
    }

    setLoading(false)
  }

  useEffect(() => { loadData() }, [selectedWarehouse])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  // فلترة البطاقات بحسب البحث وحالة المخزون المختارة
  const filteredStock = stockCards.filter((s) => {
    const onHand = Number(s.on_hand_qty)
    const minStock = Number(s.min_stock_level)

    const isOutOfStock = onHand <= 0
    const isLowStock = onHand <= minStock && onHand > 0
    const isSafeStock = onHand > minStock

    if (stockConditionFilter === 'SAFE' && !isSafeStock) return false
    if (stockConditionFilter === 'LOW' && !isLowStock) return false
    if (stockConditionFilter === 'OUT' && !isOutOfStock) return false

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Warehouse className="w-5 h-5 text-sky-400" />
            {locale === 'ar' ? 'أرصدة المخزون اللحظية' : 'Real-Time Inventory Balances'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'بيانات المخزون المعتمدة: الرصيد الفعلي، المحجوز لأوامر البيع، والمتاح للبيع' : 'Central stock ledger truth: Physical On Hand, Reserved, and Available'}
          </p>
        </div>

        <button onClick={() => loadData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="تحديث">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Bar with Double Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'البحث برمز الصنف، اسم المنتج، أو الباركود (اضغط Enter)...' : 'Search by SKU, Name, Barcode...'}
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </form>

        {/* 🌟 فلتر حالة المخزون الجديد (3-Tier Stock Filter) */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={stockConditionFilter}
            onChange={(e) => setStockConditionFilter(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL">{locale === 'ar' ? 'جميع حالات المخزون' : 'All Stock Conditions'}</option>
            <option value="SAFE">🟢 {locale === 'ar' ? 'مخزون آمن (Safe Stock)' : 'Safe Stock'}</option>
            <option value="LOW">🟡 {locale === 'ar' ? 'مخزون منخفض / نواقص (Low Stock)' : 'Low Stock / Reorder'}</option>
            <option value="OUT">🔴 {locale === 'ar' ? 'نفد المخزون (Out of Stock)' : 'Out of Stock'}</option>
          </select>
        </div>

        {/* فلتر المستودع */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL">{locale === 'ar' ? 'جميع المستودعات' : 'All Warehouses'} ({warehouses.length})</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Cards Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{locale === 'ar' ? 'رمز الصنف / المنتج' : 'SKU / Product'}</th>
                <th className="py-3.5 px-4">{locale === 'ar' ? 'المستودع' : 'Warehouse'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'الرصيد الفعلي' : 'On Hand'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'المحجوز للبيع' : 'Reserved'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'المتاح للبيع' : 'Available'}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{locale === 'ar' ? 'حد النواقص الأدنى' : 'Min Alert'}</th>
                <th className="py-3.5 px-4 text-center">{locale === 'ar' ? 'حالة المخزون' : 'Condition'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'جاري التحميل...' : 'Loading stock...'}</td></tr>
              ) : filteredStock.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">{locale === 'ar' ? 'لا توجد سجلات مخزون مطابقة للفلتر.' : 'No stock records matching filter.'}</td></tr>
              ) : (
                filteredStock.map((s) => {
                  const onHand = Number(s.on_hand_qty)
                  const reserved = Number(s.reserved_qty)
                  const available = Number(s.available_qty)
                  const minStock = Number(s.min_stock_level)

                  const isOutOfStock = onHand <= 0
                  const isLowStock = onHand <= minStock && onHand > 0

                  return (
                    <tr key={`${s.product_id}_${s.warehouse_id}`} className="hover:bg-slate-800/25 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-sky-400 block">{s.product_code}</span>
                        <span className="text-slate-200 text-xs font-semibold block mt-0.5">{s.product_name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          {s.category_name && <span>{s.category_name}</span>}
                          {s.unit_code && <span className="px-1.5 py-0.2 bg-slate-800 rounded font-mono text-slate-400">{s.unit_code}</span>}
                          {s.barcode && <span className="flex items-center gap-1 font-sans"><Barcode className="w-3 h-3" /> {s.barcode}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{s.warehouse_name}</td>
                      <td className="py-3 px-4 text-right rtl:text-left font-mono font-semibold text-slate-200">{formatQuantity(onHand)}</td>
                      <td className="py-3 px-4 text-right rtl:text-left font-mono font-semibold text-amber-400">{formatQuantity(reserved)}</td>
                      <td className="py-3 px-4 text-right rtl:text-left font-mono font-bold text-white text-sm">{formatQuantity(available)}</td>
                      <td className="py-3 px-4 text-right rtl:text-left font-mono text-slate-500">{formatQuantity(minStock)}</td>
                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <AlertCircle className="w-3 h-3" /> {locale === 'ar' ? 'نفد المخزون' : 'Out of Stock'}
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <AlertTriangle className="w-3 h-3" /> {locale === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <ShieldCheck className="w-3 h-3" /> {locale === 'ar' ? 'مخزون آمن' : 'Safe Stock'}
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
