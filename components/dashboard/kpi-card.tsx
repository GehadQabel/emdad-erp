'use client'

import React from 'react'
import { LucideIcon, ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  colorVariant: 'emerald' | 'sky' | 'amber' | 'crimson' | 'indigo' | 'purple'
  href?: string
}

const colorStyles = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'from-emerald-500/10 to-transparent',
    hoverBorder: 'hover:border-emerald-500/40',
  },
  sky: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    text: 'text-sky-400',
    glow: 'from-sky-500/10 to-transparent',
    hoverBorder: 'hover:border-sky-500/40',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'from-amber-500/10 to-transparent',
    hoverBorder: 'hover:border-amber-500/40',
  },
  crimson: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'from-rose-500/10 to-transparent',
    hoverBorder: 'hover:border-rose-500/40',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    glow: 'from-indigo-500/10 to-transparent',
    hoverBorder: 'hover:border-indigo-500/40',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'from-purple-500/10 to-transparent',
    hoverBorder: 'hover:border-purple-500/40',
  },
}

export function KPICard({ title, value, subtitle, icon: Icon, colorVariant, href }: KPICardProps) {
  const style = colorStyles[colorVariant] || colorStyles.sky
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 p-5 backdrop-blur-xl shadow-lg transition-all duration-200 ${
        href ? `cursor-pointer hover:scale-[1.02] ${style.hoverBorder} group` : ''
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.glow} rounded-full blur-2xl pointer-events-none`} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 tracking-wide flex items-center gap-1">
          {title}
          {href && <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </span>
        <div className={`p-2.5 rounded-xl border ${style.bg} ${style.border} ${style.text}`}>
          {Icon ? <Icon className="w-4 h-4" /> : null}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-black text-white tracking-tight font-mono">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  )
}
