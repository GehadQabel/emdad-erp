'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ShoppingCart, Clock, CheckCircle2, Warehouse, Truck, Check, XCircle, AlertTriangle } from 'lucide-react'

interface OrderRow {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
}

interface RecentOrdersTableProps {
  orders: OrderRow[]
}

const statusConfigs: Record<string, { arLabel: string; enLabel: string; badge: string; icon: any }> = {
  DRAFT: { arLabel: 'مسودة', enLabel: 'Draft', badge: 'bg-slate-800 text-slate-300 border-slate-700', icon: Clock },
  PENDING_APPROVAL: { arLabel: 'بانتظار الاعتماد', enLabel: 'Pending Approval', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertTriangle },
  APPROVED: { arLabel: 'معتمد ومحجوز', enLabel: 'Approved & Reserved', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: CheckCircle2 },
  PREPARING: { arLabel: 'قيد التجهيز بالمستودع', enLabel: 'Preparing in Warehouse', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', icon: Warehouse },
  READY_FOR_DELIVERY: { arLabel: 'جاهز للشحن والتسليم', enLabel: 'Ready for Delivery', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Truck },
  DELIVERED: { arLabel: 'تم التسليم والفاتورة', enLabel: 'Delivered & Invoiced', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Check },
  CANCELLED: { arLabel: 'ملغي', enLabel: 'Cancelled', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: XCircle },
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const { t, locale } = useI18n()
  const router = useRouter()

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-sky-400" />
            {locale === 'ar' ? 'أحدث أوامر البيع المسجلة' : 'Recent Sales Orders'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {locale === 'ar' ? 'سجل مباشر ومحدث لأحدث طلبيات وتوزيع السوبرماركت' : 'Live feed of latest customer order commitments'}
          </p>
        </div>
        <button
          onClick={() => router.push('/sales/orders')}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>{locale === 'ar' ? 'عرض كل الأوامر' : 'View All Orders'}</span>
          {locale === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="divide-y divide-slate-800/60 overflow-x-auto">
        {orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            {locale === 'ar' ? 'لا توجد أوامر بيع مسجلة حالياً في قاعدة البيانات' : 'No sales orders recorded in database'}
          </div>
        ) : (
          orders.map((order) => {
            const statusConf = statusConfigs[order.status] || statusConfigs.DRAFT
            const StatusIcon = statusConf.icon
            const statusText = locale === 'ar' ? statusConf.arLabel : statusConf.enLabel

            return (
              <div 
                key={order.id} 
                onClick={() => router.push('/sales/orders')}
                className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30 px-3 rounded-xl transition-all cursor-pointer group"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-bold text-white tracking-wide group-hover:text-sky-400 transition-colors">
                    {order.order_number}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-mono font-bold text-white text-sm">
                    {formatCurrency(order.total_amount, locale)}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusConf.badge}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusText}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
