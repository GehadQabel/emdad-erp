'use client'

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { createProductAction } from '@/lib/actions/products.actions'
import { 
  Package, Plus, Search, Filter, Lock, Tag, 
  Barcode, X, RefreshCw, ShieldAlert 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProductRow {
  id: string
  product_code: string
  barcode: string | null
  name: string
  category_id: string
  brand_id: string
  unit_id: string
  base_selling_price: number | null
  is_active: boolean
  category_name?: string
  brand_name?: string
  unit_code?: string
}

interface ProductsClientViewProps {
  userEmail: string | null
  initialProducts: ProductRow[]
  categories: Array<{ id: string; name: string; code: string }>
  brands: Array<{ id: string; name: string; code: string }>
  units: Array<{ id: string; name: string; code: string }>
  warehouses: Array<{ id: string; name: string; code: string }>
  serverError: string | null
}

export default function ProductsClientView({
  userEmail,
  initialProducts,
  categories,
  brands,
  units,
  warehouses,
  serverError,
}: ProductsClientViewProps) {
  const { t } = useI18n()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [formData, setFormData] = useState({
    product_code: '',
    barcode: '',
    name: '',
    category_id: categories[0]?.id || '',
    brand_id: brands[0]?.id || '',
    unit_id: units[0]?.id || '',
    base_selling_price: 0,
    warehouse_id: warehouses[0]?.id || '',
    min_stock_level: 10,
  })

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Ensure initial form values match the loaded array IDs
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({
        ...prev,
        category_id: categories[0].id,
        brand_id: brands[0]?.id || prev.brand_id,
        unit_id: units[0]?.id || prev.unit_id,
        warehouse_id: warehouses[0]?.id || prev.warehouse_id,
      }))
    }
  }, [categories, brands, units, warehouses, formData.category_id])

  const handleOpenModal = () => {
    setFormData({
      product_code: '',
      barcode: '',
      name: '',
      category_id: categories[0]?.id || '',
      brand_id: brands[0]?.id || '',
      unit_id: units[0]?.id || '',
      base_selling_price: 0,
      warehouse_id: warehouses[0]?.id || '',
      min_stock_level: 10,
    })
    setFormError(null)
    setIsCreateModalOpen(true)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const filteredProducts = initialProducts.filter((p) => {
    const matchesSearch =
      p.product_code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))

    const matchesCategory = selectedCategory === 'ALL' || p.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const res = await createProductAction(formData)
    if (!res.success) {
      setFormError(res.error || 'Failed to create product.')
      setSubmitting(false)
    } else {
      setIsCreateModalOpen(false)
      setSubmitting(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Diagnostic Banner */}
      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">PostgreSQL RLS Notice</p>
            <p className="text-[11px] text-rose-300 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-5 h-5 text-sky-400" />
            {t('nav.products')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Signed in as: <span className="text-sky-400 font-mono font-medium">{userEmail || 'Admin'}</span>
            {' • '}
            {categories.length} Categories, {brands.length} Brands loaded from Supabase
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, name, barcode..."
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-sky-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
            className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors"
          >
            <option value="ALL" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
              All Categories ({categories.length})
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">SKU / Code</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No products found. Click &quot;New Product&quot; to add your first catalog item.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {p.product_code}
                      {p.barcode && (
                        <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3" /> {p.barcode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.category_name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.brand_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {p.unit_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {p.base_selling_price !== null ? (
                        formatCurrency(p.base_selling_price)
                      ) : (
                        <span className="text-slate-500 font-normal flex items-center justify-end gap-1" title="Redacted by Role Security">
                          <Lock className="w-3 h-3 text-slate-600" /> Confidential
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Master Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" /> Add Master Product
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SKU / Product Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    placeholder="OIL-CRYSTAL-700"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="61222165965"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Commercial Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Crystal Sunflower Oil 700ml"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Categorization Dropdowns with High-Contrast Colors */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {categories.map((c) => (
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

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand *</label>
                  <select
                    required
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option 
                        key={b.id} 
                        value={b.id} 
                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                      >
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Base Unit *</label>
                  <select
                    required
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {units.map((u) => (
                      <option 
                        key={u.id} 
                        value={u.id} 
                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                      >
                        {u.code} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.base_selling_price}
                    onChange={(e) => setFormData({ ...formData, base_selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Warehouse</label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
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

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold hover:from-sky-400 hover:to-indigo-500 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
