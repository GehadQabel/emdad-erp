'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatQuantity } from '@/lib/utils'
import { postInventoryAdjustmentAction } from '@/lib/actions/inventory.actions'
import { CheckSquare, Plus, RefreshCw, X, AlertCircle } from 'lucide-react'

export default function InventoryAdjustmentsPage() {
  const supabase = createClient()
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [reason, setReason] = useState('Stock Count Reconciliation')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Array<{ product_id: string; system_qty: number; counted_qty: number }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function loadAdjustments() {
    setLoading(true)

    const { data: adjData } = await supabase
      .from('inventory_adjustments')
      .select('id, adjustment_number, warehouse_id, reason, status, created_at, posted_at, warehouses(name)')
      .order('created_at', { ascending: false })

    const { data: whData } = await supabase.from('warehouses').select('id, name').eq('is_active', true)
    const { data: prodData } = await supabase.from('products').select('id, product_code, name').eq('is_active', true)

    setAdjustments(adjData || [])
    setWarehouses(whData || [])
    setProducts(prodData || [])

    if (whData?.[0]) setSelectedWarehouseId(whData[0].id)
    setLoading(false)
  }

  useEffect(() => {
    loadAdjustments()
  }, [])

  // When warehouse changes in modal, load snapshot system quantities
  async function handleWarehouseSelect(whId: string) {
    setSelectedWarehouseId(whId)

    const { data: balances } = await supabase
      .from('inventory_balances')
      .select('product_id, on_hand_qty')
      .eq('warehouse_id', whId)

    const balMap = new Map((balances || []).map((b) => [b.product_id, Number(b.on_hand_qty)]))

    // Initialize adjustment lines with live system snapshot
    const initialLines = products.slice(0, 5).map((p) => {
      const currentOnHand = balMap.get(p.id) || 0
      return {
        product_id: p.id,
        system_qty: currentOnHand,
        counted_qty: currentOnHand,
      }
    })

    setLines(initialLines)
  }

  const handleOpenModal = () => {
    if (warehouses[0]) {
      handleWarehouseSelect(warehouses[0].id)
    }
    setIsModalOpen(true)
  }

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const payload = {
      warehouse_id: selectedWarehouseId,
      reason,
      notes,
      items: lines.map((l) => ({
        product_id: l.product_id,
        system_qty: l.system_qty,
        counted_qty: l.counted_qty,
      })),
    }

    const res = await postInventoryAdjustmentAction(payload)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to post adjustment.')
      setSubmitting(false)
    } else {
      setIsModalOpen(false)
      setSubmitting(false)
      loadAdjustments()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            Inventory Adjustments
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical stock counts, shrinkage, and damage reconciliations (Atomic Posting)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAdjustments()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Stock Reconciliation</span>
          </button>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Adjustment #</th>
              <th className="py-3.5 px-4">Warehouse</th>
              <th className="py-3.5 px-4">Reason</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">Loading adjustments...</td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">No stock adjustment documents recorded.</td>
              </tr>
            ) : (
              adjustments.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{a.adjustment_number}</td>
                  <td className="py-3 px-4 text-slate-300">{a.warehouses?.name || '—'}</td>
                  <td className="py-3 px-4 text-slate-300">{a.reason}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sky-400" /> Reconcile Physical Stock Count
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Warehouse</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => handleWarehouseSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reason / Cause</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Reconcile Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">System Snapshot</th>
                      <th className="py-2.5 px-3 text-right">Counted Qty</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {lines.map((line, idx) => {
                      const prod = products.find((p) => p.id === line.product_id)
                      const diff = line.counted_qty - line.system_qty

                      return (
                        <tr key={line.product_id} className="bg-slate-900/40">
                          <td className="py-2 px-3 font-semibold text-white">
                            {prod?.product_code} — {prod?.name}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-400">
                            {formatQuantity(line.system_qty)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={line.counted_qty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setLines((prev) =>
                                  prev.map((l, i) => (i === idx ? { ...l, counted_qty: val } : l))
                                )
                              }}
                              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-white font-mono focus:border-sky-500 focus:outline-none"
                            />
                          </td>
                          <td className={`py-2 px-3 text-right font-mono font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {diff > 0 ? `+${formatQuantity(diff)}` : formatQuantity(diff)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold hover:from-sky-400 hover:to-indigo-500 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Confirm & Post Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
