'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/context'
import { formatCurrency, formatQuantity } from '@/lib/utils'
import { KPICard } from '@/components/dashboard/kpi-card'
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table'
import { 
  DollarSign, FileText, PackageAlert, ShieldAlert, 
  TrendingUp, ShoppingBag, Award, Building2, Flame, RefreshCw, Layers
} from 'lucide-react'

export default function DashboardPage() {
  const { t, locale } = useI18n()
  const supabase = createClient()

  const [analytics, setAnalytics] = useState<any>({
    today_sales: 0,
    month_sales: 0,
    month_orders_count: 0,
    avg_order_value: 0,
    open_receivables: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    blocked_cust_count: 0,
    top_products: [],
    top_customers: [],
    sales_trend: [],
  })

  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadDashboardData() {
    setLoading(true)

    // تشغيل فحص النواقص لضمان دقة المنبه
    await supabase.rpc('rpc_evaluate_low_stock_alerts')

    // 1. جلب التحليلات الشاملة والأصناف الأكثر مبيعاً
    const { data: analyticsData } = await supabase.rpc('rpc_get_dashboard_analytics')
    if (analyticsData) setAnalytics(analyticsData as any)

    // 2. جلب أحدث أوامر البيع للجدول
    const { data: recentSo } = await supabase
      .from('sales_orders')
      .select('id, order_number, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6)

    setRecentOrders(recentSo || [])
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{locale === 'ar' ? 'لوحة العمليات والتحليلات التنفيذية' : 'Executive Operations & Analytics'}</span>
            <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              {locale === 'ar' ? 'إمْـــدَاد ERP' : 'EMDAD LIVE'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === 'ar' ? 'مؤشرات الأداء اللحظية، مبيعات الشهر، الأصناف الأكثر طلباً، وكبار العملاء' : 'Real-time revenue, top selling food products, and customer insights'}
          </p>
        </div>

        <button
          onClick={() => loadDashboardData()}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. Main Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* مبيعات اليوم */}
        <KPICard
          title={locale === 'ar' ? 'مبيعات اليوم المحققة' : "Today's Sales"}
          value={formatCurrency(analytics.today_sales, locale)}
          subtitle={locale === 'ar' ? 'تم التسليم والفاتورة' : 'Delivered & Invoiced'}
          icon={DollarSign}
          colorVariant="emerald"
          href="/sales/orders"
        />

        {/* مبيعات الشهر الإجمالية */}
        <KPICard
          title={locale === 'ar' ? 'إجمالي مبيعات الشهر' : 'Monthly Delivered Sales'}
          value={formatCurrency(analytics.month_sales, locale)}
          subtitle={locale === 'ar' ? `${analytics.month_orders_count} طلبيات منفذة` : `${analytics.month_orders_count} completed orders`}
          icon={TrendingUp}
          colorVariant="sky"
          href="/sales/orders"
        />

        {/* متوسط قيمة الطلب AOV */}
        <KPICard
          title={locale === 'ar' ? 'متوسط قيمة الطلبية (AOV)' : 'Average Order Value'}
          value={formatCurrency(analytics.avg_order_value, locale)}
          subtitle={locale === 'ar' ? 'معدل الطلب الواحد' : 'Per delivered order'}
          icon={ShoppingBag}
          colorVariant="indigo"
          href="/sales/orders"
        />

        {/* المديونيات المعلقة للتحصيل */}
        <KPICard
          title={locale === 'ar' ? 'إجمالي المديونيات المعلقة' : 'Outstanding Receivables'}
          value={formatCurrency(analytics.open_receivables, locale)}
          subtitle={locale === 'ar' ? `${analytics.blocked_cust_count} عميل محظور` : `${analytics.blocked_cust_count} blocked accounts`}
          icon={FileText}
          colorVariant={analytics.blocked_cust_count > 0 ? 'crimson' : 'sky'}
          href="/finance/receivables"
        />
      </div>

      {/* 2. Top Performers Grid: Top Products + Top Supermarkets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🌟 الأصناف الأكثر مبيعاً (Top Selling Products) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              {locale === 'ar' ? 'الأصناف الأكثر طلباً ومبيعاً' : 'Top Selling Food Products'}
            </h2>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {locale === 'ar' ? 'الأعلى مبيعاً' : 'Top 5'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {analytics.top_products.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                {locale === 'ar' ? 'لا توجد مبيعات مسجلة حتى الآن' : 'No product sales recorded yet'}
              </p>
            ) : (
              analytics.top_products.map((p: any, idx: number) => (
                <div key={p.product_id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-sky-400 font-mono font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{p.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{p.product_code} • {p.category_name}</p>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <p className="font-bold text-emerald-400 font-mono text-xs">
                      {formatQuantity(p.total_qty_sold)} {locale === 'ar' ? 'كرتونة/عبوة' : 'units'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatCurrency(p.total_revenue, locale)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🌟 كبار سلاسل السوبرماركت الأكثر شراءً (Top Customers) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              {locale === 'ar' ? 'كبار العملاء وسلاسل السوبرماركت' : 'Top Supermarket Chains'}
            </h2>
            <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              {locale === 'ar' ? 'حجم التعامل' : 'Volume'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 mt-2">
            {analytics.top_customers.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                {locale === 'ar' ? 'لا توجد تعاملات مسجلة حتى الآن' : 'No customer volume recorded'}
              </p>
            ) : (
              analytics.top_customers.map((c: any, idx: number) => (
                <div key={c.customer_id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{c.customer_name}</p>
                      <p className="text-[10px] text-slate-500">{c.total_orders_count} {locale === 'ar' ? 'طلبيات منفذة' : 'orders delivered'}</p>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <p className="font-bold text-white font-mono text-sm">
                      {formatCurrency(c.total_spent, locale)}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {locale === 'ar' ? 'عميل نشط ممتاز' : 'Top Tier'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 3. Recent Sales Orders Feed */}
      <RecentOrdersTable orders={recentOrders} />
    </div>
  )
}
