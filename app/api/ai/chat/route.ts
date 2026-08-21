import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { message, locale } = await request.json()

    // 1. Verify User Session & Role Context
    const { data: userContext, error: authError } = await supabase.rpc('rpc_get_my_profile_and_role')
    if (authError || !userContext) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const profile = userContext as any
    const roleCode = profile.role_code || 'ADMIN'
    const fullName = profile.full_name || 'User'

    // 2. Fetch Role-Authorized Live Database Snapshot
    let liveDataContext: any = {}

    if (['ADMIN', 'WAREHOUSE', 'PURCHASING', 'SALES'].includes(roleCode)) {
      const { data: inventory } = await supabase.rpc('rpc_get_inventory_balances')
      liveDataContext.inventory = inventory || []
    }

    if (['ADMIN', 'FINANCE', 'SALES'].includes(roleCode)) {
      const { data: receivables } = await supabase.rpc('rpc_get_finance_receivables')
      liveDataContext.receivables = receivables || []
    }

    if (['ADMIN', 'SALES', 'WAREHOUSE'].includes(roleCode)) {
      const { data: orders } = await supabase.rpc('rpc_get_sales_orders')
      liveDataContext.sales_orders = orders || []
    }

    if (['ADMIN', 'PURCHASING'].includes(roleCode)) {
      const { data: poOrders } = await supabase.rpc('rpc_get_purchasing_orders')
      liveDataContext.purchase_orders = poOrders || []
    }

    if (['ADMIN'].includes(roleCode)) {
      const { data: analytics } = await supabase.rpc('rpc_get_dashboard_analytics')
      liveDataContext.analytics = analytics || {}
    }

    // 3. System Prompt Formulation
    const systemPrompt = `
You are "EMDAD Copilot" (مساعد إمْـــدَاد الذكي), an expert AI ERP Operations Assistant for a major Egyptian Food Products Distribution system (منظومة إمْـــدَاد لتوزيع المنتجات الغذائية).
The current user interacting with you is: "${fullName}" with Role: "${roleCode}".
Selected language/locale: "${locale === 'ar' ? 'Arabic' : 'English'}".

CRITICAL ROLE-BASED PRIVACY RULES:
1. WAREHOUSE users must NEVER be told selling prices, profit margins, or cost prices (Prices are confidential to them).
2. SALES users must NEVER be told purchase costs from suppliers (Costs are confidential to them).
3. PURCHASING users must NEVER be told customer sales debt.
4. FINANCE users focus on customer receivables, due dates, and collections.
5. All monetary amounts must be stated in Egyptian Pound (EGP / ج.م).
6. Answer clearly, professionally, concisely, with bullet points and friendly formatting in the requested language (${locale === 'ar' ? 'Arabic' : 'English'}).

LIVE REAL-TIME DATABASE SNAPSHOT (Authorized for this user):
${JSON.stringify(liveDataContext, null, 2)}
`

    // 4. Call Google Gemini API (if GEMINI_API_KEY exists) or use Smart Fallback
    const apiKey = process.env.GEMINI_API_KEY

    if (apiKey) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 800,
            },
          }),
        }
      )

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json()
        const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (reply) {
          return NextResponse.json({ reply })
        }
      }
    }

    // 5. Intelligent Built-in Fallback (Answers directly from Database Snapshot)
    const reply = generateSmartFallbackReply(message, roleCode, liveDataContext, locale)
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('AI Chat Error:', err)
    return NextResponse.json({ error: 'Failed to process AI query.' }, { status: 500 })
  }
}

// Built-in intelligent engine when external API key is pending
function generateSmartFallbackReply(
  query: string,
  role: string,
  data: any,
  locale: string
): string {
  const q = query.toLowerCase()
  const isAr = locale === 'ar'

  // Low Stock / النواقص
  if (q.includes('نواقص') || q.includes('قرب يخلص') || q.includes('low stock') || q.includes('reorder')) {
    const items = (data.inventory || []).filter(
      (i: any) => Number(i.on_hand_qty) <= Number(i.min_stock_level) && Number(i.on_hand_qty) > 0
    )
    const outItems = (data.inventory || []).filter((i: any) => Number(i.on_hand_qty) <= 0)

    if (isAr) {
      let text = `📦 **تقرير النواقص الحالي بالمستودعات:**\n\n`
      if (outItems.length > 0) {
        text += `🔴 **أصناف نفدت بالكامل (${outItems.length}):**\n`
        outItems.slice(0, 4).forEach((item: any) => {
          text += `• ${item.product_name} (${item.product_code}) في ${item.warehouse_name} - الرصيد: 0\n`
        })
      }
      if (items.length > 0) {
        text += `\n🟡 **أصناف وصلت لحد النواقص (${items.length}):**\n`
        items.slice(0, 4).forEach((item: any) => {
          text += `• ${item.product_name} - الرصيد: ${item.on_hand_qty} (حد الإنذار: ${item.min_stock_level})\n`
        })
      }
      return text
    } else {
      return `📦 **Current Low Stock Report:**\n• ${outItems.length} items out of stock.\n• ${items.length} items below reorder threshold in active warehouses.`
    }
  }

  // Debt / Receivables / الديون
  if (q.includes('ديون') || q.includes('مديونيات') || q.includes('متأخر') || q.includes('receivable') || q.includes('debt') || q.includes('overdue')) {
    if (role === 'WAREHOUSE') {
      return isAr ? '⚠️ عذراً، بيانات المديونيات والتحصيلات محجوبة عن صلاحيات المستودع.' : 'Access restricted for warehouse role.'
    }

    const overdue = (data.receivables || []).filter((r: any) => r.is_overdue)
    const totalDebt = (data.receivables || []).reduce((acc: number, r: any) => acc + Number(r.outstanding_amount), 0)

    if (isAr) {
      let text = `💳 **تقرير المديونيات والتحصيل:**\n• إجمالي الديون المعلقة في السوق: **${totalDebt.toLocaleString('ar-EG')} ج.م**\n`
      if (overdue.length > 0) {
        text += `\n🔴 **فواتير متأخرة عن موعد السداد (${overdue.length}):**\n`
        overdue.slice(0, 3).forEach((r: any) => {
          text += `• ${r.customer_name} - متبقي ${r.outstanding_amount.toLocaleString('ar-EG')} ج.م (متأخر ${r.overdue_days} يوم)\n`
        })
      }
      return text
    } else {
      return `💳 **Receivables Summary:**\n• Total open debt: **EGP ${totalDebt.toLocaleString('en-US')}**\n• ${overdue.length} overdue invoices requiring collection.`
    }
  }

  // General Overview / ملخص عام
  if (isAr) {
    return `مرحباً بك! أنا **مساعد إمْـــدَاد الذكي**. أنا متصل لحظياً بقاعدة بيانات المستودعات والمبيعات الخاصة بحسابك بصلاحية (**${role}**).\n\nيمكنك سؤالي عن:
• **نواقص المخزون والأصناف النافدة**
• **أوامر البيع الجاهزة للشحن والتجهيز**
• **فواتير المديونيات ومواعيد استحقاق السوبرماركت**
• **ملخص الأداء والمبيعات اليوم**`
  }

  return `Hello! I am your **EMDAD AI Copilot**, live-connected to your Supabase PostgreSQL operational data for role **${role}**. Ask me about stock levels, orders, overdue debts, or reorders!`
}
