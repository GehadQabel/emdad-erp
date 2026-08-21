'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Languages } from 'lucide-react'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-semibold"
    >
      <Languages className="w-4 h-4 text-sky-400" />
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  )
}
