import { useProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Compass, RefreshCw } from 'lucide-react'

const CONFIDENCE_COLOR: Record<string, string> = { HIGH: '#34d399', MEDIUM: '#fbbf24', LOW: '#f87171' }
const SEVERITY_COLOR: Record<string, string> = { HIGH: '#f87171', MEDIUM: '#fbbf24', LOW: '#34d399' }

function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null
  const color = CONFIDENCE_COLOR[level] ?? '#71717a'
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${color}1a`, border: `1px solid ${color}40`, color }}>
      {level}
    </span>
  )
}

function MomentumIcon({ momentum }: { momentum: string }) {
  if (momentum === 'rising') return <TrendingUp className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
  if (momentum === 'declining') return <TrendingDown className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
  return <Minus className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
}

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

  if (mr.schema !== 'market_intelligence.v1') return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-md">
        <RefreshCw className="w-12 h-12 mx-auto mb-4" style={{ color: '#fbbf24' }} />
        <p className="text-white font-semibold mb-1">This project's market research is out of date</p>
        <p className="text-zinc-500 text-sm">It was generated before the upgraded market intelligence module. Re-run the AI pipeline from the dashboard to upgrade it.</p>
      </div>
    </div>
  )

  const attractiveness = mr.attractiveness
  const attractivenessRows = attractiveness ? [
    { label: 'Market Size', value: attractiveness.market_size },
    { label: 'Growth Rate', value: attractiveness.growth_rate },
    { label: 'Competitive Intensity', value: attractiveness.competitive_intensity },
    { label: 'Barriers to Entry', value: attractiveness.barriers_to_entry },
    { label: 'Monetization Potential', value: attractiveness.monetization_potential },
  ] : []

  return (
    <div className="p-8 space-y-10 max-w-5xl animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="section-label mb-1">AI-Generated · market_intelligence.v1</div>
          <h1 className="font-display text-2xl font-bold text-white">Market Research</h1>
          <p className="text-zinc-500 text-sm mt-1">Live web-grounded analysis of your market opportunity</p>
        </div>
        <ConfidenceBadge level={mr.confidence_overall} />
      </div>

      {mr.flags && mr.flags.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div className="text-sm" style={{ color: 'rgba(248,113,113,0.85)' }}>
            <p className="font-semibold mb-1">Persisted with validation flags — treat with extra caution:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90">
              {mr.flags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Executive summary */}
      <section>
        <div className="section-label mb-2">Executive Summary</div>
        <p className="text-zinc-300 text-sm leading-relaxed">{mr.executive_summary}</p>
      </section>

      {/* Market definition */}
      {mr.market_definition && (
        <section className="glass-card p-6">
          <div className="section-label mb-4">Market Definition</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Primary', value: mr.market_definition.primary },
              { label: 'Secondary', value: mr.market_definition.secondary },
              { label: 'Adjacent', value: mr.market_definition.adjacent },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#818cf8' }}>{label}</div>
                <div className="text-white text-sm">{value}</div>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed italic">{mr.market_definition.rationale}</p>
        </section>
      )}

      {/* TAM / SAM / SOM */}
      <section>
        <div className="section-label mb-4">Market Size</div>
        <div className="flex flex-col lg:flex-row gap-6 items-center">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
            {[
              { key: 'tam', label: 'TAM', sub: 'Total Addressable Market', data: mr.tam, color: '#818cf8', borderColor: 'rgba(129,140,248,0.4)' },
              { key: 'sam', label: 'SAM', sub: 'Serviceable Available',    data: mr.sam, color: '#2dd4bf', borderColor: 'rgba(45,212,191,0.4)'  },
              { key: 'som', label: 'SOM', sub: 'Serviceable Obtainable',   data: mr.som, color: '#34d399', borderColor: 'rgba(52,211,153,0.4)'  },
            ].map(({ label, sub, data, color, borderColor }) => (
              <div key={label} className="glass-card p-5" style={{ borderLeft: `3px solid ${borderColor}` }}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</div>
                  <ConfidenceBadge level={data.confidence} />
                </div>
                <div className="text-zinc-600 text-[10px] mb-2">{sub} · {data.methodology.replace('_', ' ')}</div>
                <div className="text-white text-xl font-bold mb-2">{data.value}</div>
                <div className="text-zinc-500 text-xs leading-relaxed mb-2">{data.description}</div>
                {data.source_urls.length > 0 && (
                  <div className="text-zinc-700 text-[10px]">{data.source_urls.length} source{data.source_urls.length > 1 ? 's' : ''}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer segments */}
      {mr.customer_segments?.length > 0 && (
        <section>
          <div className="section-label mb-4">Customer Segments</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mr.customer_segments.map((seg, i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-white font-semibold text-sm">{seg.name}</h3>
                  <span className="text-[10px] font-bold uppercase" style={{ color: SEVERITY_COLOR[seg.priority] }}>{seg.priority}</span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed mb-2">{seg.description}</p>
                <div className="text-zinc-700 text-[10px]">Est. size: {seg.size_estimate}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trends + demand signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mr.trends?.length > 0 && (
          <section>
            <div className="section-label mb-4">Trends</div>
            <div className="space-y-3">
              {mr.trends.map((t, i) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MomentumIcon momentum={t.momentum} />
                    <h4 className="text-white text-sm font-medium">{t.title}</h4>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-1">{t.description}</p>
                  <span className="text-zinc-700 text-[10px]">{t.time_horizon}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {mr.demand_signals?.length > 0 && (
          <section>
            <div className="section-label mb-4">Demand Signals</div>
            <div className="space-y-3">
              {mr.demand_signals.map((d, i) => (
                <div key={i} className="glass-card p-4">
                  <p className="text-white text-sm mb-1">{d.signal}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed">{d.interpretation}</p>
                  {d.source?.startsWith('http') && (
                    <a href={d.source} target="_blank" rel="noreferrer" className="text-teal-400 text-[10px] hover:underline">source ↗</a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Positioning matrix */}
      {mr.positioning && (
        <section>
          <div className="section-label mb-4">Competitive Positioning</div>
          <div className="flex flex-col xl:flex-row gap-5">
            <div className="glass-card p-6 shrink-0">
              <div className="relative" style={{ width: 300, height: 300 }}>
                <div className="absolute inset-0" style={{ borderLeft: '2px solid rgba(255,255,255,0.12)', borderBottom: '2px solid rgba(255,255,255,0.12)' }} />
                <div className="absolute" style={{ left: '50%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.06)' }} />
                <div className="absolute" style={{ top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.06)' }} />
                <span className="absolute text-[9px]" style={{ bottom: -18, right: 0, color: '#3f3f52' }}>High Price →</span>
                <span className="absolute text-[9px]" style={{ top: 2, left: 2, color: '#3f3f52' }}>↑ Quality</span>
                {mr.positioning.quadrant?.map((c, i) => {
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

            {mr.positioning.pyramid?.length > 0 && (
              <div className="glass-card p-6 flex-1 flex flex-col">
                <div className="section-label mb-5">Market Segments</div>
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                  {[...mr.positioning.pyramid].reverse().map((level, i, arr) => {
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
                  <tr>{['Company','Market Share','Growth','Threat','Notes'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {mr.landscape.map((c, i) => (
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

      {/* Risks */}
      {mr.risks?.length > 0 && (
        <section>
          <div className="section-label mb-4">Risks</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mr.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-3 glass-card p-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: SEVERITY_COLOR[r.severity] }} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{r.category}</span>
                    <span className="text-[10px] font-bold uppercase" style={{ color: SEVERITY_COLOR[r.severity] }}>{r.severity}</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Opportunities */}
      {mr.opportunities?.length > 0 && (
        <section>
          <div className="section-label mb-4">Opportunities</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mr.opportunities.map((o, i) => (
              <div key={i} className="flex items-start gap-3 glass-card p-4">
                <Target className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white text-sm font-medium">{o.title}</h4>
                    <span className="text-[10px] font-bold uppercase" style={{ color: SEVERITY_COLOR[o.potential_impact] }}>{o.potential_impact} impact</span>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{o.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Attractiveness */}
      {attractiveness && (
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="section-label">Market Attractiveness</div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{attractiveness.overall}/10</span>
            </div>
          </div>
          <div className="space-y-3 mb-5">
            {attractivenessRows.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-zinc-500 text-xs w-44 shrink-0">{label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(value/10)*100}%`, background: 'linear-gradient(90deg,#2dd4bf,#818cf8)' }} />
                </div>
                <span className="text-white text-xs font-semibold w-6 text-right">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(45,212,191,0.85)' }}>{attractiveness.verdict}</p>
        </section>
      )}

      {/* Strategic recommendations */}
      {mr.strategic_recommendations?.length > 0 && (
        <section>
          <div className="section-label mb-4">Strategic Recommendations</div>
          <ul className="space-y-2">
            {mr.strategic_recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Compass className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
                <span className="text-zinc-300 text-sm leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Data gaps */}
      {mr.data_gaps?.length > 0 && (
        <section className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Data Gaps</div>
          <ul className="space-y-1">
            {mr.data_gaps.map((gap, i) => <li key={i} className="text-zinc-600 text-xs">· {gap}</li>)}
          </ul>
        </section>
      )}

      {/* Sources */}
      {mr.sources && (mr.sources.tier1?.length || mr.sources.tier2?.length || mr.sources.tier3?.length) ? (
        <section>
          <div className="section-label mb-3">Sources</div>
          <div className="space-y-2">
            {(['tier1', 'tier2', 'tier3'] as const).map((tier) =>
              mr.sources[tier]?.length > 0 && (
                <div key={tier} className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-zinc-700 text-[10px] uppercase font-bold w-12">{tier}</span>
                  {mr.sources[tier].map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="text-[10px] text-zinc-500 hover:text-teal-400 bg-white/[0.03] border border-white/[0.06] rounded-full px-2 py-0.5 truncate max-w-[200px]">
                      {url.replace(/^https?:\/\//, '')}
                    </a>
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      ) : null}

      {/* Disclaimer */}
      <p className="text-zinc-700 text-[11px] italic leading-relaxed border-t border-white/[0.05] pt-4">{mr.disclaimer}</p>
    </div>
  )
}
