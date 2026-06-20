import { useProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ExternalLink, DollarSign, Award, TrendingUp, Users, Building2, Zap } from 'lucide-react'

const typeMap: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  grant:       { icon: Award,      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)' },
  vc:          { icon: TrendingUp, color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)' },
  venture:     { icon: TrendingUp, color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)' },
  accelerator: { icon: Zap,        color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)' },
  angel:       { icon: Users,      color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)' },
  government:  { icon: Building2,  color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
  gov:         { icon: Building2,  color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)' },
}
const getType = (t: string) => {
  const k = t.toLowerCase()
  return Object.entries(typeMap).find(([key]) => k.includes(key))?.[1]
    ?? { icon: DollarSign, color: '#71717a', bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.2)' }
}

export default function FundingMatcher() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)

  if (isLoading) return <div className="p-8"><SkeletonGrid count={4} /></div>

  const funding = project?.fundingOpportunities || []

  if (funding.length === 0) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-sm">
        <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: '#3f3f52' }} />
        <p className="text-white font-semibold mb-1">No funding matches yet</p>
        <p className="text-zinc-500 text-sm">Run the AI pipeline from the dashboard.</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl animate-fade-in-up">
      <div className="mb-7">
        <div className="section-label mb-1">AI-Matched</div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">Funding Opportunities</h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
            {funding.length} matches
          </span>
        </div>
        <p className="text-zinc-500 text-sm mt-1">Grants, VCs, accelerators & government programs tailored to your idea</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {funding.map((f: any, i: number) => {
          const cfg = getType(f.type)
          const Icon = cfg.icon
          return (
            <div key={i} className="glass-card flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.color }}>{f.type}</div>
                    <h2 className="text-white font-semibold text-sm leading-tight">{f.name}</h2>
                  </div>
                </div>
                {f.link && (
                  <a href={f.link} target="_blank" rel="noreferrer"
                    className="p-1.5 rounded-lg transition-all shrink-0"
                    style={{ color: '#52525b' }}
                    onMouseOver={e => (e.currentTarget.style.color = cfg.color)}
                    onMouseOut={e => (e.currentTarget.style.color = '#52525b')}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Amount */}
                <div className="inline-flex">
                  <span className="px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                    {f.amount}
                  </span>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed flex-1">{f.description}</p>

                {/* Match reason */}
                <div className="rounded-xl p-4"
                  style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.12)' }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(45,212,191,0.6)' }}>Why You Match</div>
                  <p className="text-zinc-400 text-xs leading-relaxed">{f.matchReason}</p>
                </div>

                {f.link && (
                  <a href={f.link} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.07)', color: '#71717a' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseOut={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = '' }}>
                    Visit Website <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
