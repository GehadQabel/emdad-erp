'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import en from './dictionaries/en.json'
import ar from './dictionaries/ar.json'

type Locale = 'en' | 'ar'
type Dictionary = typeof en

interface I18nContextProps {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  dir: 'ltr' | 'rtl'
}

const dictionaries: Record<Locale, Dictionary> = { en, ar }

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('minierp_lang') as Locale
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLocaleState(saved)
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = saved
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('minierp_lang', newLocale)
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLocale
  }

  const t = (path: string): string => {
    const keys = path.split('.')
    let result: any = dictionaries[locale]
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return path
      }
    }
    return typeof result === 'string' ? result : path
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: locale === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within an I18nProvider')
  return context
}
