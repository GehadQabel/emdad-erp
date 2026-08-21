import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'

export const metadata: Metadata = {
  title: 'إمْـــدَاد (EMDAD ERP) — منظومة إدارة وتوزيع المنتجات الغذائية',
  description: 'Food Products Distribution & Supply Chain ERP Platform (EMDAD ERP)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-[#080c14] text-slate-100">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
