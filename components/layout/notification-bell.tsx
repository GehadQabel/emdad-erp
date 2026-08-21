'use client'

import React, { useEffect, useState } from 'react'
import { Bell, AlertTriangle, Clock, ShieldAlert, Package, CheckCircle2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'

interface NotificationItem {
  id: string
  notification_type: 'LOW_STOCK' | 'APPROVAL_REQUIRED' | 'CUSTOMER_OVERDUE' | 'LATE_PO' | 'CUSTOMER_BLOCKED'
  title: string
  message: string
  polymorphic_ref_type: string | null
  polymorphic_ref_id: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { t, locale } = useI18n()

  const fetchNotifications = async () => {
    // جلب الإشعارات غير المقروءة فقط الخاصة بالمستخدم الحالي
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setNotifications(data as NotificationItem[])
  }

  useEffect(() => {
    fetchNotifications()

    // الاستماع المباشر للإشعارات اللحظية من قاعدة البيانات Realtime
    const channel = supabase
      .channel('realtime_alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const unreadCount = notifications.length

  // عند الضغط على الإشعار: يتم تحديده كمقروء + إخفاؤه + التوجيه الذكي للصفحة المعنية فوراً
  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. تحديث قاعدة البيانات كمقروء
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notif.id)

    // 2. إخفاؤه فورياً من الواجهة
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
    setIsOpen(false)

    // 3. التوجيه الذكي المباشر للصفحة المطلوبة
    if (notif.notification_type === 'LOW_STOCK') {
      router.push('/inventory/balances')
    } else if (notif.notification_type === 'CUSTOMER_BLOCKED' || notif.notification_type === 'CUSTOMER_OVERDUE') {
      router.push('/customers')
    } else if (notif.notification_type === 'LATE_PO') {
      router.push('/purchasing/orders')
    } else if (notif.notification_type === 'APPROVAL_REQUIRED') {
      // إذا كان إشعار طلب بيع معتمد للمستودع يوجهه لطلبات البيع، وإذا كان للأدمن يوجهه للموافقات
      if (notif.polymorphic_ref_type === 'sales_orders') {
        router.push('/sales/orders')
      } else {
        router.push('/approvals')
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all shadow-sm"
        title={locale === 'ar' ? 'التنبيهات والإشعارات اللحظية' : 'Notifications'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg shadow-rose-500/50 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-sky-400" />
              {locale === 'ar' ? 'التنبيهات التشغيلية الحية' : 'Operational Alerts'}
            </h3>
            <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
              {unreadCount} {locale === 'ar' ? 'جديد' : 'unread'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto mt-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
                <span>{locale === 'ar' ? 'لا توجد تنبيهات جديدة، كل الأمور تحت السيطرة!' : 'No active alerts!'}</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="p-3 rounded-xl cursor-pointer transition-all flex gap-3 items-start bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-sky-500/40 my-1"
                >
                  <div className="p-2 rounded-lg bg-slate-900 shrink-0 mt-0.5">
                    {n.notification_type === 'LOW_STOCK' && <Package className="w-4 h-4 text-amber-400" />}
                    {n.notification_type === 'CUSTOMER_BLOCKED' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                    {n.notification_type === 'LATE_PO' && <Clock className="w-4 h-4 text-sky-400" />}
                    {n.notification_type === 'APPROVAL_REQUIRED' && <AlertTriangle className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{n.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                      {new Date(n.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
