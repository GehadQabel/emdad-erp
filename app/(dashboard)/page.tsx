'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency, formatQuantity } from '@/lib/utils'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table'
import { 
  DollarSign, FileText, PackageAlert, ShieldAlert, 
  TrendingUp, ShoppingBag, Award, Flame, RefreshCw, 
  Warehouse, Truck, CheckSquare, Clock, PackageCheck, Coins, ArrowRight, ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()
  const router = useRouter()

  const [metrics, setMetrics] = useState<any>({
    role_code: 'ADMIN',
    today_sales: 0,
    month_sales: 0,
    month_orders_count: 0,
    avg_order_value: 0,
    open_receivables: 0,
    today_collected: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    blocked_cust_count: 0,
    orders_to_prepare: 0,
    orders_ready: 0,
    late_po_count: 0,
    top_products: [],
    top_customers: [],
    urgent_receivables: [],
    recent_payments: [],
    warehouse_queue: [],
    reorder_items: [],
  })

  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadDashboardData() {
    setLoading(true)
    await supabase.rpc('rpc_evaluate_low_stock_alerts')

    const { data: metricsData } = await supabase.rpc('rpc_get_role_dashboard_metrics')
    if (metricsData) setMetrics(metricsData as any)

    const { data: recentSo } = await supabase
      .from('sales_orders')
      .select('id, order_number, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6)

    setRecentOrders(recentSo || [])
    setLoading(false)
  }

  useEffect(() => { loadDashboardData() }, [])

  const role = metrics.role_code || 'ADMIN'

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>
              {role === 'FINANCE' ? (locale === 'ar' ? 'لوحة المتابعة والتحصيل المالي' : 'Finance & Receivables Workspace')
                : role === 'WAREHOUSE' ? (locale === 'ar' ? 'لوحة إدارة المستودع والعمليات اللوجستية' : 'Warehouse & Logistics Workspace')
                : role === 'PURCHASING' ? (locale === 'ar' ? 'لوحة المشتريات ومتابعة التوريد' : 'Procurement & Supply Workspace')
                : role === 'SALES' ? (locale === 'ar' ? 'لوحة المبيعات ومتابعة طلبيات العملاء' : 'Sales Pipeline Workspace')
                : (locale === 'ar' ? 'لوحة العمليات والتحليلات التنفيذية' : 'Executive Operations Workspace')}
            </span>
            <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
              {role}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'المؤشرات التشغيلية والبيانات المباشرة من قاعدة بيانات إمْـــدَاد' : 'Live operational KPIs straight from EMDAD PostgreSQL'}
          </p>
        </div>

        <button onClick={() => loadDashboardData()} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ========================================================
          1. 🛡️ لوحة مدير النظام (ADMIN)
      ======================================================== */}
      {role === 'ADMIN' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title={locale === 'ar' ? 'مبيعات اليوم المحققة' : "Today's Sales"} value={formatCurrency(metrics.today_sales, locale)} icon={DollarSign} colorVariant="emerald" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'إجمالي مبيعات الشهر' : 'Monthly Sales'} value={formatCurrency(metrics.month_sales, locale)} subtitle={locale === 'ar' ? `${metrics.month_orders_count} طلبيات منفذة` : `${metrics.month_orders_count} orders`} icon={TrendingUp} colorVariant="sky" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'متوسط قيمة الطلب (AOV)' : 'Average Order Value'} value={formatCurrency(metrics.avg_order_value, locale)} subtitle={locale === 'ar' ? 'معدل الطلبية الواحدة' : 'Per order'} icon={ShoppingBag} colorVariant="indigo" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'المديونيات المعلقة' : 'Outstanding Receivables'} value={formatCurrency(metrics.open_receivables, locale)} subtitle={locale === 'ar' ? `${metrics.blocked_cust_count} عميل محظور` : `${metrics.blocked_cust_count} blocked`} icon={FileText} colorVariant={metrics.blocked_cust_count > 0 ? 'crimson' : 'sky'} href="/finance/receivables" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Flame className="w-4 h-4 text-amber-400" /> {locale === 'ar' ? 'الأصناف الأكثر طلباً ومبيعاً' : 'Top Products'}</h2>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Top 5</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-2">
                {metrics.top_products?.map((p: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-sky-400 font-mono font-bold flex items-center justify-center text-[11px]">#{idx + 1}</span>
                      <div><p className="font-bold text-white">{p.product_name}</p><p className="text-[10px] text-slate-500 font-mono">{p.product_code}</p></div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-bold text-emerald-400 font-mono text-xs">{formatQuantity(p.total_qty_sold)} {locale === 'ar' ? 'عبوة' : 'units'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatCurrency(p.total_revenue, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Award className="w-4 h-4 text-sky-400" /> {locale === 'ar' ? 'كبار العملاء وسلاسل السوبرماركت' : 'Top Customers'}</h2>
                <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Volume</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-2">
                {metrics.top_customers?.map((c: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center text-[11px]">#{idx + 1}</div>
                      <div><p className="font-bold text-white">{c.customer_name}</p><p className="text-[10px] text-slate-500">{c.total_orders_count} {locale === 'ar' ? 'طلبيات' : 'orders'}</p></div>
                    </div>
                    <div className="text-right rtl:text-left"><p className="font-bold text-white font-mono text-sm">{formatCurrency(c.total_spent, locale)}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <RecentOrdersTable orders={recentOrders} />
        </>
      )}

      {/* ========================================================
          2. 💳 لوحة المحاسب المالي (FINANCE) - فواتير وتحصيلات
      ======================================================== */}
      {role === 'FINANCE' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title={locale === 'ar' ? 'إجمالي المديونيات المعلقة' : 'Total Receivables'} value={formatCurrency(metrics.open_receivables, locale)} icon={FileText} colorVariant="sky" href="/finance/receivables" />
            <KPICard title={locale === 'ar' ? 'التحصيلات المحصلة اليوم' : "Today's Collections"} value={formatCurrency(metrics.today_collected, locale)} icon={Coins} colorVariant="emerald" href="/finance/payments" />
            <KPICard title={locale === 'ar' ? 'عملاء محظورون لتأخر السداد' : 'Overdue Blocked Accounts'} value={`${metrics.blocked_cust_count} ${locale === 'ar' ? 'عميل' : 'clients'}`} icon={ShieldAlert} colorVariant={metrics.blocked_cust_count > 0 ? 'crimson' : 'emerald'} href="/customers" />
            <KPICard title={locale === 'ar' ? 'فواتير تستحق خلال 5 أيام' : 'Urgent Invoices'} value={locale === 'ar' ? 'متابعة الاستحقاق' : 'Track Due'} icon={Clock} colorVariant="amber" href="/finance/receivables" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* فواتير عاجلة للتحصيل */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> {locale === 'ar' ? 'فواتير عاجلة ومستحقة للتحصيل' : 'Urgent Invoices Queue'}</h2>
                <button onClick={() => router.push('/finance/receivables')} className="text-xs text-sky-400 font-semibold">{locale === 'ar' ? 'عرض الكل' : 'View All'}</button>
              </div>
              <div className="divide-y divide-slate-800/60 mt-2">
                {metrics.urgent_receivables?.map((r: any, idx: number) => (
                  <div key={idx} onClick={() => router.push('/finance/receivables')} className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div>
                      <p className="font-bold text-white">{r.customer_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{r.receivable_number} • استحقاق: {r.due_date}</p>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-bold font-mono text-rose-400 text-sm">{formatCurrency(r.outstanding, locale)}</p>
                      {r.is_overdue && <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">{locale === 'ar' ? 'متأخرة' : 'Overdue'}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* أحدث سندات التحصيل */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><Coins className="w-4 h-4 text-emerald-400" /> {locale === 'ar' ? 'أحدث سندات التحصيل والمقبوضات' : 'Recent Collections'}</h2>
                <button onClick={() => router.push('/finance/payments')} className="text-xs text-emerald-400 font-semibold">{locale === 'ar' ? 'عرض الكل' : 'View All'}</button>
              </div>
              <div className="divide-y divide-slate-800/60 mt-2">
                {metrics.recent_payments?.map((pay: any, idx: number) => (
                  <div key={idx} onClick={() => router.push('/finance/payments')} className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div>
                      <p className="font-bold text-white">{pay.customer_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{pay.payment_number} • {pay.payment_method}</p>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-bold font-mono text-emerald-400 text-sm">+{formatCurrency(pay.amount, locale)}</p>
                      <p className="text-[10px] text-slate-500">{pay.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          3. 📦 لوحة أمين المستودع (WAREHOUSE) - تشغيل وشحن بدون أسعار
      ======================================================== */}
      {role === 'WAREHOUSE' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title={locale === 'ar' ? 'طلبيات بانتظار التجهيز' : 'Orders to Prepare'} value={`${metrics.orders_to_prepare} ${locale === 'ar' ? 'طلبية' : 'orders'}`} icon={Warehouse} colorVariant="indigo" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'طلبيات جاهزة للشحن والتسليم' : 'Ready for Delivery'} value={`${metrics.orders_ready} ${locale === 'ar' ? 'شحنة' : 'shipments'}`} icon={Truck} colorVariant="purple" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'أصناف وصلت لحد النواقص' : 'Low Stock SKUs'} value={`${metrics.low_stock_count} ${locale === 'ar' ? 'صنف' : 'items'}`} subtitle={locale === 'ar' ? `${metrics.out_of_stock_count} صنف نافد` : `${metrics.out_of_stock_count} out of stock`} icon={PackageAlert} colorVariant={metrics.out_of_stock_count > 0 ? 'crimson' : 'amber'} href="/inventory/balances" />
            <KPICard title={locale === 'ar' ? 'شحنات توريد متأخرة' : 'Late Inbound Deliveries'} value={`${metrics.late_po_count} ${locale === 'ar' ? 'شحنة' : 'POs'}`} icon={Clock} colorVariant="crimson" href="/purchasing/orders" />
          </div>

          {/* طابور التجهيز والشحن بالمستودع */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Truck className="w-4 h-4 text-sky-400" /> {locale === 'ar' ? 'طابور تجهيز وشحن طلبيات السوبرماركت' : 'Fulfillment Dispatch Queue'}</h2>
              <button onClick={() => router.push('/sales/orders')} className="text-xs text-sky-400 font-semibold">{locale === 'ar' ? 'فتح أوامر البيع' : 'View Orders'}</button>
            </div>
            <div className="divide-y divide-slate-800/60 mt-2">
              {metrics.warehouse_queue?.map((q: any, idx: number) => (
                <div key={idx} onClick={() => router.push('/sales/orders')} className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                  <div>
                    <p className="font-bold text-white">{q.customer_name} — <span className="font-mono text-sky-400">{q.order_number}</span></p>
                    <p className="text-[10px] text-slate-400">{q.location_name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {q.status === 'APPROVED' ? (locale === 'ar' ? 'معتمد للتجهيز' : 'Approved') : q.status === 'PREPARING' ? (locale === 'ar' ? 'قيد التجهيز' : 'Preparing') : (locale === 'ar' ? 'جاهز للشحن' : 'Ready')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          4. 🚚 لوحة مسؤول المشتريات (PURCHASING)
      ======================================================== */}
      {role === 'PURCHASING' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title={locale === 'ar' ? 'أصناف تحتاج إعادة طلب' : 'Reorder Needed'} value={`${metrics.low_stock_count} ${locale === 'ar' ? 'صنف' : 'items'}`} icon={PackageAlert} colorVariant="amber" href="/inventory/balances" />
            <KPICard title={locale === 'ar' ? 'أصناف نفدت بالكامل' : 'Out of Stock SKUs'} value={`${metrics.out_of_stock_count} ${locale === 'ar' ? 'صنف' : 'items'}`} icon={PackageAlert} colorVariant="crimson" href="/inventory/balances" />
            <KPICard title={locale === 'ar' ? 'شحنات متأخرة من الموردين' : 'Late Supplier Deliveries'} value={`${metrics.late_po_count} ${locale === 'ar' ? 'أمر شراء' : 'POs'}`} icon={Clock} colorVariant="crimson" href="/purchasing/orders" />
            <KPICard title={locale === 'ar' ? 'أذون الاستلام المخزني' : 'Inbound Receipts'} value={locale === 'ar' ? 'سجل الأذون' : 'Receipts'} icon={PackageCheck} colorVariant="emerald" href="/purchasing/receipts" />
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><PackageAlert className="w-4 h-4 text-amber-400" /> {locale === 'ar' ? 'نواقص المخزون المقترحة لإصدار أوامر شراء فورية' : 'Procurement Reorder Queue'}</h2>
              <button onClick={() => router.push('/purchasing/orders')} className="text-xs text-sky-400 font-semibold">{locale === 'ar' ? 'إصدار أمر شراء' : 'Create PO'}</button>
            </div>
            <div className="divide-y divide-slate-800/60 mt-2">
              {metrics.reorder_items?.map((item: any, idx: number) => (
                <div key={idx} onClick={() => router.push('/purchasing/orders')} className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                  <div>
                    <p className="font-bold text-white">{item.product_name} (<span className="font-mono text-sky-400">{item.product_code}</span>)</p>
                    <p className="text-[10px] text-slate-400">{item.warehouse_name}</p>
                  </div>
                  <div className="text-right rtl:text-left font-mono">
                    <span className="text-xs font-bold text-amber-400">{formatQuantity(item.on_hand_qty)} رصيد حالي</span>
                    <span className="text-[10px] text-slate-500 block">حد النواقص: {formatQuantity(item.min_stock_level)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          5. 💼 لوحة مسؤول المبيعات (SALES)
      ======================================================== */}
      {role === 'SALES' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title={locale === 'ar' ? 'مبيعات اليوم المحققة' : "Today's Delivered Sales"} value={formatCurrency(metrics.today_sales, locale)} icon={DollarSign} colorVariant="emerald" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'طلبيات معتمدة ومحجوزة' : 'Approved & Reserved'} value={`${metrics.orders_to_prepare} ${locale === 'ar' ? 'طلبية' : 'orders'}`} icon={CheckSquare} colorVariant="sky" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'طلبيات جاهزة للتسليم' : 'Ready for Delivery'} value={`${metrics.orders_ready} ${locale === 'ar' ? 'شحنة' : 'shipments'}`} icon={Truck} colorVariant="purple" href="/sales/orders" />
            <KPICard title={locale === 'ar' ? 'عملاء محظورون ائتمانياً' : 'Blocked Supermarkets'} value={`${metrics.blocked_cust_count} ${locale === 'ar' ? 'عميل' : 'clients'}`} icon={ShieldAlert} colorVariant="crimson" href="/customers" />
          </div>

          <RecentOrdersTable orders={recentOrders} />
        </>
      )}
    </div>
  )
}
