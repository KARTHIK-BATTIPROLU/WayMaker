import { NavLink, Outlet, useMatch } from 'react-router-dom'
import { Sparkles, CalendarDays, ArrowRight } from 'lucide-react'

export default function MarketingKitHome() {
  const atRoot = useMatch('/dashboard/marketing-kit')

  if (!atRoot) return <Outlet />

  return (
    <div className="p-8 max-w-3xl mx-auto pt-12 animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{ background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', color: '#f472b6' }}>
          <Sparkles className="w-3 h-3" /> Marketing Kit
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">
          <span className="text-white">What do you want to </span>
          <span className="gradient-text">post about?</span>
        </h1>
        <p className="text-zinc-500 text-sm">Bring your own idea, or pull from today's content calendar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <NavLink to="own-idea" className="glass-card-hover p-6 cursor-pointer block group relative">
          <div className="module-icon mb-4" style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#2dd4bf' }} />
          </div>
          <h3 className="text-white font-semibold text-base mb-1">Own Idea</h3>
          <p className="text-zinc-600 text-sm mb-4 leading-relaxed">Type what you want to say — we'll write the post, hashtags and image.</p>
          <div className="flex items-center justify-end">
            <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </NavLink>

        <NavLink to="calendar" className="glass-card-hover p-6 cursor-pointer block group relative">
          <div className="module-icon mb-4" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
            <CalendarDays className="w-5 h-5" style={{ color: '#818cf8' }} />
          </div>
          <h3 className="text-white font-semibold text-base mb-1">Content Calendar</h3>
          <p className="text-zinc-600 text-sm mb-4 leading-relaxed">Daily AI-researched topics with real sources, refreshed every day at 7pm IST.</p>
          <div className="flex items-center justify-end">
            <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </NavLink>
      </div>
    </div>
  )
}
