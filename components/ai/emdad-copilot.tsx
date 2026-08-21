'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, X, Send, Bot, User, RefreshCw, MessageSquare } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'assistant' | 'user'
  text: string
  timestamp: string
}

export function EmdadCopilot() {
  const { locale } = useI18n()
  const supabase = createClient()
  const isAr = locale === 'ar'

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>('ADMIN')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadContext() {
      const { data } = await supabase.rpc('rpc_get_my_profile_and_role')
      if (data) {
        const r = (data as any).role_code || 'ADMIN'
        setUserRole(r)
        // Initial Greeting
        setMessages([
          {
            role: 'assistant',
            text: isAr 
              ? `أهلاً بك! أنا **مساعد إمْـــدَاد الذكي**. كيف يمكنني مساعدتك في عملياتك اليوم بصفتك (${r})؟`
              : `Welcome! I am **EMDAD AI Copilot**. How can I assist with your operations today as (${r})?`,
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      }
    }
    loadContext()
  }, [locale])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // أسئلة مقترحة ذكية بحسب الدور الوظيفي
  const quickPrompts: Record<string, string[]> = {
    ADMIN: isAr 
      ? ['ما هي مبيعات اليوم ومبيعات الشهر؟', 'ما هي الأصناف التي وصلت لحد النواقص؟', 'من هم العملاء المتأخرون عن السداد؟']
      : ["What are today's sales?", 'Which items are low on stock?', 'Who are the overdue customers?'],
    WAREHOUSE: isAr
      ? ['ما هي الأصناف التي وصلت لحد النواقص؟', 'ما هي الطلبيات الجاهزة للتجهيز والشحن بالمستودع؟']
      : ['Which products are low on stock?', 'Which orders are ready for picking?'],
    SALES: isAr
      ? ['ما هي الأصناف المتاحة للبيع حالياً؟', 'هل يوجد عملاء محظورون ائتمانياً؟']
      : ['What products are available for sale?', 'Are there any blocked customers?'],
    PURCHASING: isAr
      ? ['ما هي النواقص التي تحتاج أمر شراء عاجل؟', 'هل توجد أوامر توريد متأخرة من الموردين؟']
      : ['What items need immediate reorder?', 'Are there any late purchase orders?'],
    FINANCE: isAr
      ? ['ما هي فواتير المديونيات المتأخرة؟', 'كم إجمالي المديونيات المعلقة في السوق؟']
      : ['What are the overdue invoices?', 'What is the total outstanding debt?'],
  }

  const currentPrompts = quickPrompts[userRole] || quickPrompts.ADMIN

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const userMsg: Message = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, locale }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        role: 'assistant',
        text: data.reply || (isAr ? 'تعذر الحصول على رد من المساعد.' : 'Unable to generate response.'),
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: isAr ? 'حدث خطأ في الاتصال بالمساعد الذكي.' : 'Error connecting to AI assistant.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }

    setLoading(false)
  }

  return (
    <>
      {/* 🌟 Floating Copilot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 end-6 z-50 p-4 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-2xl shadow-sky-500/30 transition-all hover:scale-105 flex items-center gap-2 font-bold text-xs"
        title="مساعد إمْـــدَاد الذكي"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline">{isAr ? 'مساعد إمْـــدَاد الذكي' : 'EMDAD Copilot'}</span>
      </button>

      {/* 🌟 Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-24 end-6 z-50 w-[92vw] sm:w-[420px] h-[560px] max-h-[85vh] rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-xs text-start animate-in fade-in slide-in-from-bottom-5">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  {isAr ? 'مساعد إمْـــدَاد الذكي' : 'EMDAD AI Copilot'}
                  <span className="text-[9px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                    {userRole}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">{isAr ? 'متصل لحظياً بقاعدة بيانات إمْـــدَاد' : 'Live Connected to EMDAD ERP'}</p>
              </div>
            </div>

            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => {
              const isAssistant = m.role === 'assistant'
              return (
                <div key={idx} className={`flex gap-2.5 items-start ${isAssistant ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white ${isAssistant ? 'bg-indigo-600' : 'bg-sky-600'}`}>
                    {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${isAssistant ? 'bg-slate-800/80 text-slate-200 border border-slate-700/50' : 'bg-sky-600 text-white font-medium'}`}>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    <span className={`block text-[9px] mt-1 font-mono ${isAssistant ? 'text-slate-400' : 'text-sky-200'}`}>{m.timestamp}</span>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>{isAr ? 'جاري فحص البيانات وتوليد الإجابة...' : 'Analyzing live database...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-950/40 flex gap-1.5 overflow-x-auto">
            {currentPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[10px] whitespace-nowrap transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAr ? 'اسأل عن المخزون، الديون، أو الطلبيات...' : 'Ask about stock, orders, receivables...'}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white disabled:opacity-40 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  )
}
