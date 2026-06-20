import { useProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { Lightbulb, TrendingUp } from 'lucide-react'

export default function MarketResearch() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)

  if (isLoading) return <div className="p-8"><SkeletonGrid count={3} /></div>

  const mr = project?.marketResearch

  if (!mr) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-sm">
        <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: '#3f3f52' }} />
        <p className="text-white font-semibold mb-1">No market research yet</p>
        <p className="text-zinc-500 text-sm">Run the AI pipeline from the dashboard.</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 space-y-10 max-w-5xl animate-fade-in-up">
      {/* Page header */}
      <div>
        <div className="section-label mb-1">AI-Generated</div>
        <h1 className="font-display text-2xl font-bold text-white">Market Research</h1>
        <p className="text-zinc-500 text-sm mt-1">Live web-grounded analysis of your market opportunity</p>
      </div>

      {/* TAM / SAM / SOM */}
      <section>
        <div className="section-label mb-4">Market Size</div>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Circles viz */}
          <div className="relative w-52 h-52 shrink-0">
            <div className="absolute inset-0 rounded-full flex items-start justify-center pt-4"
              style={{ border: '2px solid rgba(129,140,248,0.3)', background: 'rgba(129,140,248,0.05)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#818cf8' }}>TAM</span>
            </div>
            <div className="absolute inset-[15%] rounded-full flex items-start justify-center pt-3"
              style={{ border: '2px solid rgba(45,212,191,0.4)', background: 'rgba(45,212,191,0.08)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#2dd4bf' }}>SAM</span>
            </div>
            <div className="absolute inset-[31%] rounded-full flex flex-col items-center justify-center"
              style={{ border: '2px solid rgba(52,211,153,0.6)', background: 'rgba(52,211,153,0.15)' }}>
              <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#34d399' }}>SOM</span>
              <span className="text-white font-bold text-sm">{mr.som.value}</span>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
            {[
              { key: 'tam', label: 'TAM', sub: 'Total Addressable Market', data: mr.tam, color: '#818cf8', borderColor: 'rgba(129,140,248,0.4)' },
              { key: 'sam', label: 'SAM', sub: 'Serviceable Available',    data: mr.sam, color: '#2dd4bf', borderColor: 'rgba(45,212,191,0.4)'  },
              { key: 'som', label: 'SOM', sub: 'Serviceable Obtainable',   data: mr.som, color: '#34d399', borderColor: 'rgba(52,211,153,0.4)'  },
            ].map(({ label, sub, data, color, borderColor }) => (
              <div key={label} className="glass-card p-5" style={{ borderLeft: `3px solid ${borderColor}` }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color }}>{label}</div>
                <div className="text-zinc-600 text-[10px] mb-2">{sub}</div>
                <div className="text-white text-xl font-bold mb-2">{data.value}</div>
                <div className="text-zinc-500 text-xs leading-relaxed">{data.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Positioning matrix */}
      {mr.positioning && (
        <section>
          <div className="section-label mb-4">Competitive Positioning</div>
          <div className="flex flex-col xl:flex-row gap-5">
            {/* Quadrant */}
            <div className="glass-card p-6 shrink-0">
              <div className="relative" style={{ width: 300, height: 300 }}>
                <div className="absolute inset-0" style={{ borderLeft: '2px solid rgba(255,255,255,0.12)', borderBottom: '2px solid rgba(255,255,255,0.12)' }} />
                <div className="absolute" style={{ left: '50%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.06)' }} />
                <div className="absolute" style={{ top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.06)' }} />

                <span className="absolute text-[9px]" style={{ bottom: -18, right: 0, color: '#3f3f52' }}>High Price →</span>
                <span className="absolute text-[9px]" style={{ top: 2, left: 2, color: '#3f3f52' }}>↑ Quality</span>

                {mr.positioning?.quadrant?.map((c: any, i: number) => {
                  const isBrand = c.name?.toLowerCase().includes('your brand') || c.name?.toLowerCase().includes('you')
                  const lx = Math.min(Math.max(c.x ?? 0.5, 0.04), 0.96)
                  const bt = Math.min(Math.max(c.y ?? 0.5, 0.04), 0.96)
                  return (
                    <div key={i} className="absolute" style={{ left: `${lx*100}%`, bottom: `${bt*100}%`, transform: 'translate(-50%,50%)' }}>
                      <div className="rounded-full transition-all"
                        style={isBrand
                          ? { width:14, height:14, background:'#2dd4bf', border:'2px solid #fff', boxShadow:'0 0 12px rgba(45,212,191,0.6)' }
                          : { width:10, height:10, background:'rgba(255,255,255,0.3)' }} />
                      <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium px-1 py-0.5 rounded"
                        style={{ color: isBrand ? '#2dd4bf' : '#71717a', background: isBrand ? 'rgba(45,212,191,0.1)' : 'transparent' }}>
                        {c.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pyramid */}
            {mr.positioning?.pyramid?.length > 0 && (
              <div className="glass-card p-6 flex-1 flex flex-col">
                <div className="section-label mb-5">Market Segments</div>
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                  {[...mr.positioning.pyramid].reverse().map((level: string, i: number, arr: string[]) => {
                    const total = arr.length
                    const w = 35 + (i / (total - 1 || 1)) * 65
                    const alpha = 0.3 + (i / (total - 1 || 1)) * 0.7
                    return (
                      <div key={i} className="flex items-center justify-center py-2.5 rounded-sm text-xs font-bold text-black transition-all hover:opacity-90"
                        style={{ width: `${w}%`, background: `rgba(45,212,191,${alpha})`, clipPath: 'polygon(4% 0%,96% 0%,100% 100%,0% 100%)' }}>
                        {level}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Landscape table */}
      {mr.landscape?.length > 0 && (
        <section>
          <div className="section-label mb-4">Market Landscape</div>
          <div className="glass-card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Company','Market Share','Growth','Threat','Notes'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {mr.landscape.map((c: any, i: number) => (
                    <tr key={i}>
                      <td className="text-white font-medium">{c.name}</td>
                      <td className="text-zinc-400">{c.marketShare}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium"
                          style={c.growth==='high' ? { background:'rgba(52,211,153,0.12)',color:'#34d399' } : c.growth==='medium' ? { background:'rgba(251,191,36,0.12)',color:'#fbbf24' } : { background:'rgba(248,113,113,0.12)',color:'#f87171' }}>
                          {c.growth}
                        </span>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium"
                          style={c.threat==='high' ? { background:'rgba(248,113,113,0.12)',color:'#f87171' } : c.threat==='medium' ? { background:'rgba(251,191,36,0.12)',color:'#fbbf24' } : { background:'rgba(52,211,153,0.12)',color:'#34d399' }}>
                          {c.threat}
                        </span>
                      </td>
                      <td className="text-zinc-600" style={{ maxWidth: 240 }}>{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Key opportunity */}
      {mr.keyOpportunity && (
        <section>
          <div className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg,rgba(45,212,191,0.08),rgba(129,140,248,0.06))', border: '1px solid rgba(45,212,191,0.2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.25)' }}>
                <Lightbulb className="w-4 h-4 text-teal-400" />
              </div>
              <span className="section-label">Key Opportunity</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(45,212,191,0.8)' }}>{mr.keyOpportunity}</p>
          </div>
        </section>
      )}
    </div>
  )
}
