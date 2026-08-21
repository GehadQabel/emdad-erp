'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatQuantity } from '@/lib/utils'
import { 
  dispatchWarehouseTransferAction, 
  completeWarehouseTransferAction 
} from '@/lib/actions/inventory.actions'
import { Truck, Plus, RefreshCw, X, ArrowRight, Check } from 'lucide-react'

export default function WarehouseTransfersPage() {
  const supabase = createClient()
  const [transfers, setTransfers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sourceWhId, setSourceWhId] = useState<string>('')
  const [destWhId, setDestWhId] = useState<string>('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [transferQty, setTransferQty] = useState<number>(10)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function loadTransfers() {
    setLoading(true)

    const { data: trData } = await supabase
      .from('warehouse_transfers')
      .select(`
        id,
        transfer_number,
        source_warehouse_id,
        destination_warehouse_id,
        status,
        created_at,
        dispatched_at,
        completed_at,
        source_wh:source_warehouse_id(name),
        dest_wh:destination_warehouse_id(name)
      `)
      .order('created_at', { ascending: false })

    const { data: whData } = await supabase.from('warehouses').select('id, name').eq('is_active', true)
    const { data: prodData } = await supabase.from('products').select('id, product_code, name').eq('is_active', true)

    setTransfers(trData || [])
    setWarehouses(whData || [])
    setProducts(prodData || [])

    if (whData && whData.length >= 2) {
      setSourceWhId(whData[0].id)
      setDestWhId(whData[1].id)
    }
    if (prodData?.[0]) setSelectedProductId(prodData[0].id)

    setLoading(false)
  }

  useEffect(() => {
    loadTransfers()
  }, [])

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    if (sourceWhId === destWhId) {
      setErrorMsg('Source and destination warehouses must be different.')
      setSubmitting(false)
      return
    }

    const payload = {
      source_warehouse_id: sourceWhId,
      destination_warehouse_id: destWhId,
      items: [{ product_id: selectedProductId, quantity: transferQty }],
    }

    const res = await dispatchWarehouseTransferAction(payload)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to dispatch transfer.')
      setSubmitting(false)
    } else {
      setIsModalOpen(false)
      setSubmitting(false)
      loadTransfers()
    }
  }

  const handleComplete = async (trId: string) => {
    const res = await completeWarehouseTransferAction(trId)
    if (res.success) {
      loadTransfers()
    } else {
      alert(`Error completing transfer: ${res.error}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-sky-400" />
            Inter-Warehouse Transfers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-facility stock transit: TRANSFER_OUT dispatch and TRANSFER_IN confirmation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadTransfers()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Stock Transfer</span>
          </button>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Transfer #</th>
              <th className="py-3.5 px-4">Route (Source → Destination)</th>
              <th className="py-3.5 px-4">Dispatched At</th>
              <th className="py-3.5 px-4">Completed At</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">Loading transfers...</td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">No warehouse transfers found.</td>
              </tr>
            ) : (
              transfers.map((tr: any) => (
                <tr key={tr.id} className="hover:bg-slate-800/25 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{tr.transfer_number}</td>
                  <td className="py-3 px-4 font-semibold text-white">
                    <span className="text-slate-300">{(tr.source_wh as any)?.name}</span>
                    <span className="mx-2 text-sky-400 font-bold">→</span>
                    <span className="text-slate-300">{(tr.dest_wh as any)?.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{tr.dispatched_at ? new Date(tr.dispatched_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3 px-4 text-slate-400">{tr.completed_at ? new Date(tr.completed_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tr.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'}`}>
                      {tr.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {tr.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleComplete(tr.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1 ml-auto"
                      >
                        <Check className="w-3 h-3" /> Receive & Finalize
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-400" /> Dispatch Warehouse Transfer
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Source Warehouse *</label>
                  <select
                    value={sourceWhId}
                    onChange={(e) => setSourceWhId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination Warehouse *</label>
                  <select
                    value={destWhId}
                    onChange={(e) => setDestWhId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.product_code} — {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer Quantity *</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
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
                  {submitting ? 'Dispatching...' : 'Dispatch Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
