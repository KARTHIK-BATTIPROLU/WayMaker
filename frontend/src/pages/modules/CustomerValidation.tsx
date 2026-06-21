import { useState } from 'react'
import { useProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import {
  UserSearch, ExternalLink, ShieldCheck, ShieldAlert, Copy, Check, FlaskConical,
  ChevronDown, ClipboardList, CalendarCheck, Target,
} from 'lucide-react'

const RELEVANCE_COLOR: Record<string, string> = { HIGH: '#34d399', MEDIUM: '#fbbf24', LOW: '#71717a' }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${
        copied ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-zinc-400 hover:text-teal-400 bg-white/[0.05] border-white/[0.08] hover:border-teal-400/50'
      }`}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function CollapsibleQuestions({ title, questions }: { title: string; questions: string[] }) {
  const [open, setOpen] = useState(false)
  if (!questions?.length) return null
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="text-white font-medium text-sm">{title} <span className="text-zinc-600 text-xs">({questions.length})</span></span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2.5 text-sm text-zinc-300">
              <span className="text-zinc-600 shrink-0">{i + 1}.</span> {q}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CustomerValidation() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)

  if (isLoading) return <div className="p-8"><SkeletonGrid count={3} /></div>

  const cd = project?.customerValidation

  if (!cd) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-10 text-center max-w-sm">
        <UserSearch className="w-12 h-12 mx-auto mb-4" style={{ color: '#3f3f52' }} />
        <p className="text-white font-semibold mb-1">No customer validation yet</p>
        <p className="text-zinc-500 text-sm">Run the AI pipeline from the dashboard.</p>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl animate-fade-in-up space-y-10">
      <div>
        <div className="section-label mb-1">AI-Generated · customer_discovery.v1</div>
        <h1 className="font-display text-2xl font-bold text-white">Customer Validation</h1>
        <p className="text-zinc-500 text-sm mt-1">Real, verified places to find your first customers this week</p>
      </div>

      {cd.flags && cd.flags.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div className="text-sm" style={{ color: 'rgba(248,113,113,0.85)' }}>
            <p className="font-semibold mb-1">Persisted with validation flags:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90">
              {cd.flags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ICP */}
      {cd.icp && (
        <section className="glass-card p-6">
          <div className="section-label mb-4">Ideal Customer Profile</div>
          <p className="text-zinc-300 text-sm leading-relaxed mb-5">{cd.icp.narrative}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cd.icp.persona_card && (
              <div className="bg-black/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf' }}>
                    {cd.icp.persona_card.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{cd.icp.persona_card.name}</div>
                    <div className="text-zinc-500 text-xs">{cd.icp.persona_card.role}</div>
                  </div>
                </div>
                <p className="text-zinc-500 text-xs mb-3">{cd.icp.persona_card.demographics}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-teal-400 text-[10px] uppercase font-bold mb-1">Goals</div>
                    {cd.icp.persona_card.goals?.map((g, i) => <div key={i} className="text-zinc-400">· {g}</div>)}
                  </div>
                  <div>
                    <div className="text-amber-400 text-[10px] uppercase font-bold mb-1">Frustrations</div>
                    {cd.icp.persona_card.frustrations?.map((f, i) => <div key={i} className="text-zinc-400">· {f}</div>)}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl p-4 flex flex-col justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(129,140,248,0.08),rgba(45,212,191,0.05))', border: '1px solid rgba(129,140,248,0.18)' }}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">Jobs-to-be-Done</div>
              <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(129,140,248,0.9)' }}>{cd.icp.jtbd}</p>
            </div>
          </div>
        </section>
      )}

      {/* Communities + Directories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="section-label mb-4">Communities ({cd.communities?.length ?? 0})</div>
          <div className="space-y-2.5">
            {cd.communities?.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noreferrer"
                className="glass-card p-4 flex items-start justify-between gap-3 hover:border-white/[0.12] transition-colors block">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white text-sm font-medium truncate">{c.name}</h4>
                    {c.verified ? <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#34d399' }} /> : <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: '#f87171' }} />}
                  </div>
                  <div className="text-zinc-600 text-xs">{c.platform} · {c.size_estimate}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold uppercase" style={{ color: RELEVANCE_COLOR[c.relevance] }}>{c.relevance}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="section-label mb-4">Directories ({cd.directories?.length ?? 0})</div>
          {cd.directories?.length > 0 ? (
            <div className="space-y-2.5">
              {cd.directories.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noreferrer"
                  className="glass-card p-4 flex items-center justify-between gap-3 hover:border-white/[0.12] transition-colors block">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white text-sm font-medium">{d.name}</h4>
                    {d.verified ? <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> : <ShieldAlert className="w-3.5 h-3.5" style={{ color: '#f87171' }} />}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm italic">No verified directories found for this idea.</p>
          )}
        </section>
      </div>

      {/* Outreach templates */}
      {cd.outreach_templates?.length > 0 && (
        <section>
          <div className="section-label mb-4">Outreach Templates</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cd.outreach_templates.map((t, i) => (
              <div key={i} className="glass-card p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">{t.channel}</span>
                  <CopyButton text={`${t.subject}\n\n${t.body}`} />
                </div>
                <div className="text-white text-xs font-semibold mb-1.5">{t.subject}</div>
                <p className="text-zinc-400 text-xs leading-relaxed flex-1">{t.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Validation experiments */}
      {cd.validation_experiments?.length > 0 && (
        <section>
          <div className="section-label mb-4 flex items-center gap-2"><FlaskConical className="w-3.5 h-3.5" /> Validation Experiments</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cd.validation_experiments.map((e, i) => (
              <div key={i} className="glass-card p-4">
                <h4 className="text-white text-sm font-semibold mb-2">{e.name}</h4>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-zinc-600">Hypothesis:</span> <span className="text-zinc-400">{e.hypothesis}</span></div>
                  <div><span className="text-zinc-600">Method:</span> <span className="text-zinc-400">{e.method}</span></div>
                  <div><span className="text-zinc-600">Success:</span> <span className="text-teal-400">{e.success_metric}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interview framework */}
      {cd.interview_framework && (
        <section>
          <div className="section-label mb-4 flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5" /> Interview Framework</div>
          <div className="space-y-3">
            <CollapsibleQuestions title="Discovery" questions={cd.interview_framework.discovery_questions} />
            <CollapsibleQuestions title="Problem" questions={cd.interview_framework.problem_questions} />
            <CollapsibleQuestions title="Willingness to Pay" questions={cd.interview_framework.willingness_to_pay_questions} />
          </div>
        </section>
      )}

      {/* Scorecard */}
      {cd.scorecard && (
        <section className="glass-card p-6">
          <div className="section-label mb-4 flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Interview Scorecard</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {cd.scorecard.fields?.map((f, i) => (
              <span key={i} className="tag-pill">{f.replace(/_/g, ' ')}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="text-[10px] font-bold uppercase text-emerald-400 mb-1">Go</div>
              <div className="text-zinc-400">{cd.scorecard.threshold_legend?.go}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="text-[10px] font-bold uppercase text-amber-400 mb-1">Maybe</div>
              <div className="text-zinc-400">{cd.scorecard.threshold_legend?.maybe}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <div className="text-[10px] font-bold uppercase text-red-400 mb-1">No-Go</div>
              <div className="text-zinc-400">{cd.scorecard.threshold_legend?.no_go}</div>
            </div>
          </div>
        </section>
      )}

      {/* 7-day plan */}
      {cd.seven_day_plan?.length > 0 && (
        <section>
          <div className="section-label mb-4 flex items-center gap-2"><CalendarCheck className="w-3.5 h-3.5" /> 7-Day Plan</div>
          <div className="space-y-3">
            {cd.seven_day_plan.map((entry, i) => (
              <div key={i} className="glass-card p-4 flex gap-4">
                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold"
                  style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf' }}>
                  <span className="text-[8px] uppercase leading-none">Day</span>
                  <span className="text-sm leading-none">{entry.day}</span>
                </div>
                <div className="flex-1">
                  <p className="text-zinc-300 text-sm leading-relaxed mb-1.5">{entry.task}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-600">
                    <span><span className="text-zinc-700">Who:</span> {entry.who}</span>
                    <span><span className="text-zinc-700">Where:</span> {entry.where}</span>
                    <span><span className="text-zinc-700">Success:</span> {entry.success_criteria}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data gaps */}
      {cd.data_gaps?.length > 0 && (
        <section className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Data Gaps</div>
          <ul className="space-y-1">
            {cd.data_gaps.map((gap, i) => <li key={i} className="text-zinc-600 text-xs">· {gap}</li>)}
          </ul>
        </section>
      )}

      <p className="text-zinc-700 text-[11px] italic leading-relaxed border-t border-white/[0.05] pt-4">{cd.disclaimer}</p>
    </div>
  )
}
