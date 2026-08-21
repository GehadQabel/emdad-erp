'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { 
  createProductAction, 
  generateNextSkuAction, 
  deleteProductAction 
} from '@/lib/actions/products.actions'
import { 
  Package, Plus, Search, Filter, Lock, Tag, 
  Barcode, X, RefreshCw, Trash2, Sparkles, AlertTriangle, Coins, Warehouse
} from 'lucide-react'

interface ReferenceItem {
  id: string
  name: string
  code: string
}

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

export default function ProductsPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<ReferenceItem[]>([])
  const [brands, setBrands] = useState<ReferenceItem[]>([])
  const [units, setUnits] = useState<ReferenceItem[]>([])
  const [warehouses, setWarehouses] = useState<ReferenceItem[]>([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State with Initial Stock & EGP Price
  const [formData, setFormData] = useState({
    product_code: '',
    barcode: '',
    name: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    base_selling_price: '' as string | number,
    warehouse_id: '',
    min_stock_level: 10,
    initial_stock_qty: '' as string | number,
  })
  const [generatingSku, setGeneratingSku] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      // 1. Fetch Reference Data via Fast Single RPC
      const { data: refData } = await (supabase as any).rpc('rpc_get_product_form_data')
      
      let catList: ReferenceItem[] = []
      let brandList: ReferenceItem[] = []
      let unitList: ReferenceItem[] = []
      let whList: ReferenceItem[] = []

      if (refData) {
        const parsed = refData as any
        catList = parsed.categories || []
        brandList = parsed.brands || []
        unitList = parsed.units || []
        whList = parsed.warehouses || []

        setCategories(catList)
        setBrands(brandList)
        setUnits(unitList)
        setWarehouses(whList)
      }

      // 2. Fetch Live Catalog View
      const { data: prodData } = await supabase
        .from('v_products')
        .select('*')
        .order('created_at', { ascending: false })

      const catMap = new Map(catList.map((c) => [c.id, c.name]))
      const brandMap = new Map(brandList.map((b) => [b.id, b.name]))
      const unitMap = new Map(unitList.map((u) => [u.id, u.code]))

      const enriched = (prodData || []).map((p: any) => ({
        ...p,
        category_name: catMap.get(p.category_id) || '—',
        brand_name: brandMap.get(p.brand_id) || '—',
        unit_code: unitMap.get(p.unit_id) || '—',
      }))

      setProducts(enriched)
    } catch (err) {
      console.error('Error loading products:', err)
      setProducts([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-generate SKU when Category is changed
  const handleCategoryChange = async (catId: string) => {
    setFormData((prev) => ({ ...prev, category_id: catId }))
    setGeneratingSku(true)
    const res = await generateNextSkuAction(catId)
    if (res.success && res.sku) {
      setFormData((prev) => ({ ...prev, product_code: res.sku }))
    }
    setGeneratingSku(false)
  }

  const handleOpenModal = async () => {
    const initialCatId = categories[0]?.id || ''
    setFormError(null)
    setIsCreateModalOpen(true)
    setGeneratingSku(true)

    let nextSku = 'PRD-1001'
    if (initialCatId) {
      const res = await generateNextSkuAction(initialCatId)
      if (res.success && res.sku) nextSku = res.sku
    }

    setFormData({
      product_code: nextSku,
      barcode: '',
      name: '',
      category_id: initialCatId,
      brand_id: brands[0]?.id || '',
      unit_id: units[0]?.id || '',
      base_selling_price: '',
      warehouse_id: warehouses[0]?.id || '',
      min_stock_level: 10,
      initial_stock_qty: '',
    })
    setGeneratingSku(false)
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const numericPrice = parseFloat(formData.base_selling_price as string)
    if (isNaN(numericPrice) || numericPrice < 0) {
      setFormError('Please enter a valid selling price in EGP.')
      setSubmitting(false)
      return
    }

    const numericInitialStock =
      formData.initial_stock_qty !== ''
        ? parseFloat(formData.initial_stock_qty as string)
        : 0

    const res = await createProductAction({
      ...formData,
      base_selling_price: numericPrice,
      initial_stock_qty: numericInitialStock,
    })

    if (!res.success) {
      setFormError(res.error || 'Failed to create product.')
      setSubmitting(false)
    } else {
      setIsCreateModalOpen(false)
      setSubmitting(false)
      loadData()
    }
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return
    setIsDeleting(true)

    const res = await deleteProductAction(productToDelete.id)
    if (res.success) {
      setProductToDelete(null)
      loadData()
    } else {
      alert(`Delete error: ${res.error}`)
    }
    setIsDeleting(false)
  }

  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false
    const matchesSearch =
      (p.product_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))

    const matchesCategory =
      selectedCategory === 'ALL' || p.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-5 h-5 text-sky-400" />
            {t('nav.products')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Food products catalog, smart SKU sequences, and prices in Egyptian Pound (EGP)
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
            placeholder="Search SKU, Product Name, Barcode..."
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

      {/* Products Table with EGP Currency */}
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
                <th className="py-3.5 px-4 text-right">Selling Price ({locale === 'ar' ? 'ج.م' : 'EGP'})</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading live catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No products found.
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
                        formatCurrency(p.base_selling_price, locale)
                      ) : (
                        <span className="text-slate-500 font-normal flex items-center justify-end gap-1" title="Redacted">
                          <Lock className="w-3 h-3 text-slate-600" /> Confidential
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete / Archive Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
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

              {/* Categorization with Auto-SKU */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
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
                      <option key={b.id} value={b.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
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
                      <option key={u.id} value={u.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        {u.code} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SKU & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">SKU / Code *</label>
                    <span className="text-[10px] text-sky-400 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3" /> Auto-Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={generatingSku ? 'Generating...' : formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    placeholder="OILS-2006"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-sky-400 font-mono font-bold placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="622100000000"
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
                  placeholder="Crystal Pure Corn Oil 1.6L"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Price & Warehouse Section */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-emerald-400" />
                    Selling Price ({locale === 'ar' ? 'ج.م' : 'EGP'}) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.base_selling_price}
                    onChange={(e) => setFormData({ ...formData, base_selling_price: e.target.value })}
                    placeholder="75.00"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-sky-400" />
                    Primary Warehouse
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Threshold & Initial Stock on Creation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock (Opening Qty)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.initial_stock_qty}
                    onChange={(e) => setFormData({ ...formData, initial_stock_qty: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Stock Alert Level</label>
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
                  disabled={submitting || generatingSku}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold hover:from-sky-400 hover:to-indigo-500 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Product</h3>
                <p className="text-xs text-slate-400">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Are you sure you want to delete <span className="font-bold text-white">{productToDelete.name}</span> (<span className="font-mono text-sky-400">{productToDelete.product_code}</span>)?
              <br />
              <span className="text-[11px] text-slate-500 block mt-2">
                If the product has historical transactions, it will be safely archived to preserve financial records.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg shadow-rose-500/25 text-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
