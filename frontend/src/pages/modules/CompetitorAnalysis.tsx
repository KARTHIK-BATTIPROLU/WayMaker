import { useProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { CheckCircle, XCircle, Zap, Users, ExternalLink, ShieldCheck, ShieldAlert, Waves, RefreshCw } from 'lucide-react'
import { isLegacyCompetitorsShape } from '../../types/research'

const accentColors = ['#2dd4bf', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#fb923c', '#a78bfa']

export default function CompetitorAnalysis() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)

  if (isLoading) return <div className="p-8"><SkeletonGrid count={3} /></div>

  const raw = project?.competitors

  if (!raw || (Array.isArray(raw) && raw.length === 0)) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-sm">
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#3f3f52' }} />
        <p className="text-white font-semibold mb-1">No competitor data yet</p>
        <p className="text-zinc-500 text-sm">Run the AI pipeline from the dashboard.</p>
      </div>
    </div>
  )

  if (isLegacyCompetitorsShape(raw)) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-md">
        <RefreshCw className="w-12 h-12 mx-auto mb-4" style={{ color: '#fbbf24' }} />
        <p className="text-white font-semibold mb-1">This project's competitor data is out of date</p>
        <p className="text-zinc-500 text-sm">It was generated before the upgraded, web-grounded competitive intelligence module. Re-run the AI pipeline from the dashboard to upgrade it.</p>
      </div>
    </div>
  )

  const ci = raw
  const competitors = ci.competitors ?? []

  return (
    <div className="p-8 max-w-5xl animate-fade-in-up space-y-10">
      <div className="mb-1">
        <div className="section-label mb-1">AI-Generated · competitor_intelligence.v1 (web-grounded)</div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">Competitor Analysis</h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', color: '#818cf8' }}>
            {competitors.length} identified
          </span>
        </div>
        <p className="text-zinc-500 text-sm mt-1">Every competitor and source below was verified by a real HTTP check, not training-knowledge recall</p>
      </div>

      {/* Competitor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {competitors.map((comp, i) => {
          const color = accentColors[i % accentColors.length]
          return (
            <div key={i} className="glass-card flex flex-col overflow-hidden transition-all hover:border-white/[0.12]">
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold truncate">{comp.name}</h2>
                  {comp.is_status_quo && <span className="text-zinc-600 text-[10px]">status quo alternative</span>}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 gap-4">
                {(comp.pricing || comp.funding) && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {comp.pricing && <div><div className="text-zinc-600 text-[10px] uppercase font-bold mb-0.5">Pricing</div><div className="text-zinc-300">{comp.pricing}</div></div>}
                    {comp.funding && <div><div className="text-zinc-600 text-[10px] uppercase font-bold mb-0.5">Funding</div><div className="text-zinc-300">{comp.funding}</div></div>}
                  </div>
                )}

                {comp.positioning_statement && <p className="text-zinc-500 text-xs italic leading-relaxed">"{comp.positioning_statement}"</p>}

                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#34d399' }}>Strengths</span>
                  </div>
                  <ul className="space-y-1.5">
                    {comp.strengths?.map((s, j) => (
                      <li key={j} className="flex gap-2 items-start">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                        <span className="text-zinc-400 text-xs leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>Weaknesses</span>
                  </div>
                  <ul className="space-y-1.5">
                    {comp.weaknesses?.map((w, j) => (
                      <li key={j} className="flex gap-2 items-start">
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                        <span className="text-zinc-400 text-xs leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {(comp.review_themes?.praise?.length > 0 || comp.review_themes?.complaints?.length > 0) && (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-black/20 rounded-lg p-3">
                    <div>
                      <div className="text-teal-400 text-[10px] uppercase font-bold mb-1">Review praise</div>
                      {comp.review_themes.praise.map((p, j) => <div key={j} className="text-zinc-400 text-[11px]">· {p}</div>)}
                    </div>
                    <div>
                      <div className="text-amber-400 text-[10px] uppercase font-bold mb-1">Review complaints</div>
                      {comp.review_themes.complaints.map((c, j) => <div key={j} className="text-zinc-400 text-[11px]">· {c}</div>)}
                    </div>
                  </div>
                )}

                <div className="mt-auto rounded-xl p-4"
                  style={{ background: 'linear-gradient(135deg,rgba(45,212,191,0.07),rgba(129,140,248,0.05))', border: '1px solid rgba(45,212,191,0.18)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Gap to Exploit</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(45,212,191,0.75)' }}>{comp.gap}</p>
                </div>

                {comp.sources?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {comp.sources.map((s, j) => (
                      <a key={j} href={s.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] bg-white/[0.03] border border-white/[0.06] rounded-full px-2 py-0.5 hover:border-teal-400/40 transition-colors"
                        style={{ color: s.verified ? '#71717a' : '#f87171' }}>
                        {s.verified ? <ShieldCheck className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
                        <ExternalLink className="w-2.5 h-2.5" /> {s.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature matrix */}
      {ci.feature_matrix?.rows?.length > 0 && (
        <section>
          <div className="section-label mb-4">Feature Matrix</div>
          <div className="glass-card overflow-hidden">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competitor</th>
                    {ci.feature_matrix.features.map((f) => <th key={f}>{f}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ci.feature_matrix.rows.map((row, i) => (
                    <tr key={i}>
                      <td className={row.competitor === 'Your Idea' ? 'font-bold' : 'text-white font-medium'}
                        style={row.competitor === 'Your Idea' ? { color: '#2dd4bf' } : undefined}>
                        {row.competitor}
                      </td>
                      {ci.feature_matrix.features.map((f) => {
                        const support = row.support?.[f]
                        const color = support === 'yes' ? '#34d399' : support === 'partial' ? '#fbbf24' : '#52525b'
                        return <td key={f}><span style={{ color }}>{support === 'yes' ? '✓' : support === 'partial' ? '◐' : '—'}</span></td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Positioning map */}
      {ci.positioning_map?.points?.length > 0 && (
        <section>
          <div className="section-label mb-4">Positioning Map</div>
          <div className="glass-card p-6 inline-block">
            <div className="relative" style={{ width: 300, height: 300 }}>
              <div className="absolute inset-0" style={{ borderLeft: '2px solid rgba(255,255,255,0.12)', borderBottom: '2px solid rgba(255,255,255,0.12)' }} />
              <span className="absolute text-[10px]" style={{ bottom: -20, right: 0, color: '#52525b' }}>{ci.positioning_map.x_axis} →</span>
              <span className="absolute text-[10px]" style={{ top: -4, left: 2, color: '#52525b' }}>↑ {ci.positioning_map.y_axis}</span>
              {ci.positioning_map.points.map((p, i) => {
                const isYours = p.name === 'Your Idea'
                const lx = Math.min(Math.max(p.x ?? 0.5, 0.04), 0.96)
                const bt = Math.min(Math.max(p.y ?? 0.5, 0.04), 0.96)
                return (
                  <div key={i} className="absolute" style={{ left: `${lx*100}%`, bottom: `${bt*100}%`, transform: 'translate(-50%,50%)' }}>
                    <div className="rounded-full" style={isYours
                      ? { width:14, height:14, background:'#2dd4bf', border:'2px solid #fff', boxShadow:'0 0 12px rgba(45,212,191,0.6)' }
                      : { width:10, height:10, background:'rgba(255,255,255,0.3)' }} />
                    <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium"
                      style={{ color: isYours ? '#2dd4bf' : '#71717a' }}>{p.name}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Blue ocean */}
      {ci.blue_ocean?.length > 0 && (
        <section>
          <div className="section-label mb-4 flex items-center gap-2"><Waves className="w-3.5 h-3.5" /> Blue Ocean Candidates</div>
          <div className="space-y-2">
            {ci.blue_ocean.map((b, i) => (
              <div key={i} className="glass-card p-4 text-sm text-zinc-300 leading-relaxed" style={{ borderLeft: '3px solid rgba(45,212,191,0.4)' }}>{b}</div>
            ))}
          </div>
        </section>
      )}

      {/* Opportunities */}
      {ci.opportunities?.length > 0 && (
        <section>
          <div className="section-label mb-4">Scored Opportunities</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ci.opportunities.map((o, i) => (
              <div key={i} className="glass-card p-4">
                <h4 className="text-white text-sm font-medium mb-1">{o.title}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed mb-3">{o.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['Impact', o.impact], ['Feasibility', o.feasibility], ['Differentiation', o.differentiation]].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="text-white font-bold text-sm">{val}/10</div>
                      <div className="text-zinc-700 text-[9px] uppercase">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Strategic recommendations */}
      {ci.strategic_recommendations?.length > 0 && (
        <section>
          <div className="section-label mb-4">Strategic Recommendations</div>
          <ul className="space-y-2">
            {ci.strategic_recommendations.map((rec, i) => (
              <li key={i} className="text-zinc-300 text-sm leading-relaxed flex gap-2.5">
                <span className="text-indigo-400">→</span> {rec}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ci.flags && ci.flags.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div className="text-sm" style={{ color: 'rgba(248,113,113,0.85)' }}>
            <p className="font-semibold mb-1">Persisted with validation flags:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90">
              {ci.flags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        </div>
      )}

      <p className="text-zinc-700 text-[11px] italic leading-relaxed border-t border-white/[0.05] pt-4">{ci.disclaimer}</p>
    </div>
  )
}
