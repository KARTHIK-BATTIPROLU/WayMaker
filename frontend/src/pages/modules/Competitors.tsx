import { useProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { CheckCircle, XCircle, Zap, Users } from 'lucide-react'

const accentColors = ['#2dd4bf','#818cf8','#f472b6','#fbbf24','#34d399']

export default function Competitors() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)

  if (isLoading) return <div className="p-8"><SkeletonGrid count={3} /></div>

  const competitors = project?.competitors || []

  if (competitors.length === 0) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-sm">
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#3f3f52' }} />
        <p className="text-white font-semibold mb-1">No competitor data yet</p>
        <p className="text-zinc-500 text-sm">Run the AI pipeline from the dashboard.</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl animate-fade-in-up">
      <div className="mb-7">
        <div className="section-label mb-1">AI-Generated</div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">Competitor Analysis</h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8' }}>
            {competitors.length} identified
          </span>
        </div>
        <p className="text-zinc-500 text-sm mt-1">SWOT analysis with exploitable gaps</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {competitors.map((comp: any, i: number) => {
          const color = accentColors[i % accentColors.length]
          return (
            <div key={i} className="glass-card flex flex-col overflow-hidden transition-all hover:border-white/[0.12]">
              {/* Card header */}
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                  {i + 1}
                </div>
                <h2 className="text-white font-semibold">{comp.name}</h2>
              </div>

              <div className="p-5 flex flex-col flex-1 gap-4">
                {/* Strengths */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#34d399' }}>Strengths</span>
                  </div>
                  <ul className="space-y-1.5">
                    {comp.strengths?.map((s: string, j: number) => (
                      <li key={j} className="flex gap-2 items-start">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                        <span className="text-zinc-400 text-xs leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>Weaknesses</span>
                  </div>
                  <ul className="space-y-1.5">
                    {comp.weaknesses?.map((w: string, j: number) => (
                      <li key={j} className="flex gap-2 items-start">
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                        <span className="text-zinc-400 text-xs leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gap */}
                <div className="mt-auto rounded-xl p-4"
                  style={{ background: 'linear-gradient(135deg,rgba(45,212,191,0.07),rgba(129,140,248,0.05))', border: '1px solid rgba(45,212,191,0.18)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Gap to Exploit</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(45,212,191,0.75)' }}>{comp.gap}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
