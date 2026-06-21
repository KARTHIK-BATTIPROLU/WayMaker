import { NavLink } from 'react-router-dom'
import {
  Sparkles, BarChart2, Users, UserSearch, Globe, DollarSign,
  Plug, CheckCircle, Play, ArrowRight, Lightbulb, Zap, Brain, FlaskConical,
} from 'lucide-react'
import api from '../lib/api'
import { useProjectStore } from '../store/project'
import { useProject, useOrchestrate, useIdeate } from '../hooks'
import { useEffect, useRef, useState } from 'react'
import IdeationChat from '../components/chat/IdeationChat'
import { isLegacyCompetitorsShape } from '../types/research'

const hasCompetitors = (p: any) => {
  const c = p.competitors
  return isLegacyCompetitorsShape(c) ? c.length > 0 : !!c?.competitors?.length
}

const moduleCards = [
  { to: '/dashboard/research',            icon: BarChart2,  label: 'Market Research',     desc: 'TAM/SAM/SOM + positioning',         color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.2)',  check: (p: any) => !!p.marketResearch },
  { to: '/dashboard/competitors',         icon: Users,      label: 'Competitor Analysis', desc: 'Web-grounded competitor intel',     color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)', check: hasCompetitors },
  { to: '/dashboard/customer-validation', icon: UserSearch, label: 'Customer Validation', desc: 'Verified communities & outreach',    color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)', check: (p: any) => p.customerValidation?.communities?.length > 0 },
  { to: '/dashboard/website',             icon: Globe,      label: 'Landing Page',        desc: 'AI-generated Tailwind website',     color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  check: (p: any) => !!p.websiteCode },
  { to: '/dashboard/funding',             icon: DollarSign, label: 'Funding Matcher',      desc: 'Grants, VCs & accelerators',        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)', check: (p: any) => p.fundingOpportunities?.length > 0 },
  { to: '/dashboard/deployments',         icon: Plug,       label: 'Deployments',          desc: 'n8n & Zapier webhook config',       color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)', check: () => false },
]

const pipelineSteps = [
  { id: 'web_search',          label: 'Web Research',   icon: '🌐' },
  { id: 'market_research',     label: 'Market Analysis', icon: '📊' },
  { id: 'competitors',         label: 'Competitors',    icon: '🎯' },
  { id: 'customer_validation', label: 'Customer Validation', icon: '🧭' },
  { id: 'website',             label: 'Landing Page',   icon: '🌐' },
  { id: 'funding',             label: 'Funding',         icon: '💰' },
]

export default function Dashboard() {
  const activeProjectId  = useProjectStore((s) => s.activeProjectId)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const clearActiveProject = useProjectStore((s) => s.clearActiveProject)

  const { data: project, error: projectError } = useProject(activeProjectId)
  const orchestrate = useOrchestrate(activeProjectId || '')

  // ── Idea text + mode for the initial idea box (State A) ───────────────────
  const [ideaInput, setIdeaInput] = useState('')
  const [creating, setCreating] = useState(false)
  // "dynamic" = Idea Lab chat (default) | "static" = skip chat, run pipeline immediately
  const [mode, setMode] = useState<'dynamic' | 'static'>('dynamic')

  // ── Static-mode pipeline trigger ──────────────────────────────────────────
  // WHY a useEffect instead of calling orchestrate.start() directly:
  // After setActiveProject(newId), useOrchestrate still has the old projectId
  // (empty string) captured in its useCallback closure. We must wait for the
  // re-render so the hook re-instantiates start() with the correct id.
  const [pendingStaticStart, setPendingStaticStart] = useState(false)

  useEffect(() => {
    if (pendingStaticStart && activeProjectId && !orchestrate.isRunning) {
      setPendingStaticStart(false)
      orchestrate.start()
    }
  // orchestrate.start changes when projectId changes — that's exactly when we want to run.
  }, [pendingStaticStart, activeProjectId, orchestrate.isRunning, orchestrate.start])

  // ── Ideation chat state ───────────────────────────────────────────────────
  // Seeded from project.ideation if available (restores on refresh)
  const ideate = useIdeate(activeProjectId || '', project?.ideation)

  // Sync ideation state when project data loads / changes
  const hydratedRef = useRef<string | null>(null)
  useEffect(() => {
    if (project?.id && hydratedRef.current !== project.id) {
      hydratedRef.current = project.id
      ideate.hydrate(project.ideation)
    }
  }, [project?.id, project?.ideation])

  // Cleanup on project error
  useEffect(() => {
    if (projectError && activeProjectId) clearActiveProject()
  }, [projectError, activeProjectId, clearActiveProject])

  // ── DISABLED: DO NOT auto-start the pipeline on project creation ─────────
  // Previously there was a useEffect here that called orchestrate.start()
  // automatically when a project had no marketResearch. That auto-start has
  // been REMOVED. The pipeline only fires when the user clicks "Continue to
  // Analysis" after completing the ideation chat.

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Step 1: create the project, Step 2: branch on mode */
  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = ideaInput.trim()
    if (!trimmed || creating) return
    setCreating(true)
    try {
      const res = await api.post('/api/projects', { idea: trimmed })
      setActiveProject(res.data.id)

      if (mode === 'dynamic') {
        // ── DYNAMIC: enter the Idea Lab chat (unchanged) ──────────────────
        // Small delay so setActiveProject propagates to useIdeate
        setTimeout(() => {
          ideate.sendMessage(trimmed)
        }, 50)
      } else {
        // ── STATIC: mark analyzed immediately, then set flag to start pipeline
        try {
          await api.post(`/api/projects/${res.data.id}/ideate`, {
            message: '__analyzed__',
          })
        } catch (err) {
          console.error('[Dashboard] mark analyzed error', err)
        }
        setPendingStaticStart(true)
      }
    } catch (err) {
      console.error('[Dashboard] create project error', err)
    } finally {
      setCreating(false)
    }
  }

  /** "Continue to Analysis" — synthesise idea from extracted, PATCH project, trigger pipeline */
  const handleContinue = async () => {
    if (!activeProjectId || !project) return

    const ex = ideate.extracted
    const synthesized = [
      ex.problem      && `Problem: ${ex.problem}`,
      ex.targetCustomer && `Target customer: ${ex.targetCustomer}`,
      ex.solutionWedge  && `Solution: ${ex.solutionWedge}`,
      ex.alternatives   && `Current alternatives: ${ex.alternatives}`,
      ex.valueAndWillingness && `Value & willingness to pay: ${ex.valueAndWillingness}`,
    ]
      .filter(Boolean)
      .join('. ')

    const finalIdea = synthesized || project.idea

    try {
      await api.patch(`/api/projects/${activeProjectId}`, {
        idea: finalIdea,
        ...(ex.industry       && { industry: ex.industry }),
        ...(ex.targetCustomer && { targetAudience: ex.targetCustomer }),
        ...(ex.location       && { location: ex.location }),
      })
    } catch (err) {
      console.error('[Dashboard] patch project error', err)
    }

    // Mark ideation as analyzed so status updates to "analyzed"
    try {
      await api.post(`/api/projects/${activeProjectId}/ideate`, {
        message: '__analyzed__',
      }).catch(() => {/* non-critical */})
    } catch { /* ignore */ }

    orchestrate.start()
  }

  // ── Determine which state we are in ──────────────────────────────────────

  /* ── STATE B: Pipeline running ── */
  if (activeProjectId && orchestrate.isRunning) {
    const doneCount = orchestrate.completedSteps.filter(s => s !== 'starting').length
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full">
        <div className="w-full animate-fade-in-up space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
              <Sparkles className="w-3 h-3" /> AI Orchestrator Running
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Building Your Business Foundation</h2>
            <p className="text-zinc-500 text-sm">Sit back — our AI pipeline is working for you</p>
          </div>

          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center relative pulse-ring"
              style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)' }}>
              <Sparkles className="text-teal-400 w-7 h-7 relative z-10 animate-float" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-white text-base font-medium min-h-6">{orchestrate.stepMessage}</p>
            {orchestrate.completedSteps.includes('web_search') && (
              <p className="text-teal-400 text-xs mt-1">{orchestrate.webResultCount} web results fetched</p>
            )}
          </div>

          <div className="w-full rounded-full overflow-hidden h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${orchestrate.progress}%`, background: 'linear-gradient(90deg, #2dd4bf, #818cf8, #c084fc)' }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pipelineSteps.map((step) => {
              const done = orchestrate.completedSteps.includes(step.id)
              const active = orchestrate.currentStep === step.id
              return (
                <div key={step.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: done ? 'rgba(45,212,191,0.08)' : active ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${done ? 'rgba(45,212,191,0.25)' : active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                  }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                    style={{ background: done ? 'linear-gradient(135deg,#2dd4bf,#818cf8)' : 'rgba(255,255,255,0.08)', color: done ? '#000' : '#666' }}>
                    {done ? '✓' : step.id === orchestrate.currentStep ? '…' : ''}
                  </div>
                  <span className="text-xs font-medium" style={{ color: done ? '#2dd4bf' : active ? '#fff' : '#52525b' }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="text-center text-zinc-700 text-xs">{doneCount} of {pipelineSteps.length} modules complete · takes ~2 minutes</p>
        </div>
      </div>
    )
  }

  // ── Show Loading state if activeProjectId is set but project is not loaded ──
  if (activeProjectId && !project && !projectError) {
    return (
      <div className="p-8 max-w-2xl mx-auto pt-12 flex flex-col items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
        <p className="text-zinc-500 text-sm mt-4">Loading project...</p>
      </div>
    )
  }

  /* ── STATE C: Project exists with analysis ── */
  if (activeProjectId && project && project.marketResearch) {
    const allGenerated = project.marketResearch && hasCompetitors(project) &&
      (project.customerValidation?.communities?.length ?? 0) > 0 &&
      project.websiteCode && project.fundingOpportunities?.length > 0
    const doneCount = moduleCards.slice(0, 5).filter(m => m.check(project)).length

    return (
      <div className="p-8 animate-fade-in-up">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-bold gradient-text mb-2 truncate">{project.name}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              {project.industry      && <span className="tag-pill">{project.industry}</span>}
              {project.targetAudience && <span className="tag-pill">{project.targetAudience}</span>}
              {project.location       && <span className="tag-pill">{project.location}</span>}
            </div>
            <p className="text-zinc-600 italic text-sm max-w-2xl line-clamp-2">
              "{project.idea.substring(0, 160)}{project.idea.length > 160 ? '…' : ''}"
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            {!allGenerated && !orchestrate.isRunning && (
              <button
                onClick={() => orchestrate.start()}
                className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
              >
                <Play className="w-4 h-4" /> Run AI Pipeline
              </button>
            )}
            <div className="flex items-center gap-2 text-zinc-600 text-xs">
              <div className="flex gap-1.5">
                {moduleCards.slice(0, 5).map((m, i) => (
                  <div key={i} className={m.check(project) ? 'dot-done' : 'dot-pending'} />
                ))}
              </div>
              {doneCount}/5 generated
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map(({ to, icon: Icon, label, desc, color, bg, border, check }) => {
            const done = check(project)
            return (
              <NavLink key={to} to={to} className="glass-card-hover p-5 cursor-pointer block group relative">
                <div className="module-icon mb-4" style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{label}</h3>
                <p className="text-zinc-600 text-xs mb-4 leading-relaxed">{desc}</p>
                <div className="flex items-center justify-between">
                  {done
                    ? <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#34d399' }}>
                        <CheckCircle className="w-3 h-3" /> Generated
                      </span>
                    : <span className="text-zinc-700 text-xs">Not generated</span>
                  }
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </NavLink>
            )
          })}
        </div>

        {!allGenerated && (
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <p className="text-amber-200/60 text-sm">
              Some modules are missing. Click <strong className="text-amber-300">Run AI Pipeline</strong> to generate them.
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ── STATE D: Project has been analyzed/submitted, but pipeline is not running and no analysis exists ── */
  if (activeProjectId && project && project.ideation?.status === 'analyzed' && !project.marketResearch) {
    return (
      <div className="p-8 max-w-2xl mx-auto pt-12 flex flex-col items-center justify-center min-h-[400px] animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center mb-5">
          <Sparkles className="text-teal-400 w-7 h-7" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Ready for Analysis</h2>
        <p className="text-zinc-500 text-sm mb-6 text-center max-w-sm">
          Your idea "{project.name}" has been registered. Click the button below to start the AI orchestrator pipeline.
        </p>
        <button
          onClick={() => orchestrate.start()}
          className="btn-gradient flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl"
        >
          <Play className="w-4 h-4" /> Run AI Pipeline
        </button>
      </div>
    )
  }

  /* ── STATE A: No project yet OR project exists but ideation in progress ── */

  // Has an active project been created in DYNAMIC mode? Show ideation chat.
  // We check if the project has been analyzed or is being analyzed in static mode.
  if (activeProjectId && project && project.ideation?.status !== 'analyzed' && !pendingStaticStart) {
    return (
      <div className="flex flex-col h-full animate-fade-in-up" style={{ minHeight: 0 }}>
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)' }}
              >
                <Brain className="w-4 h-4 text-teal-400" />
              </div>
              <h1 className="font-display text-lg font-bold text-white">Idea Lab</h1>
            </div>
            <p className="text-zinc-600 text-xs pl-9">
              Sharpening: <span className="text-zinc-400 italic">{project.name}</span>
            </p>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.15)', color: '#2dd4bf' }}
          >
            <Zap className="w-3 h-3" /> AI Co-founder
          </div>
        </div>

        {/* Chat panel — fills remaining height */}
        <div
          className="flex-1 mx-4 mb-4 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(8,8,16,0.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            minHeight: 0,
          }}
        >
          <IdeationChat
            messages={ideate.messages}
            dimensionScores={ideate.dimensionScores}
            extracted={ideate.extracted}
            confidence={ideate.confidence}
            ready={ideate.ready}
            loading={ideate.loading}
            error={ideate.error}
            onSend={ideate.sendMessage}
            onContinue={handleContinue}
          />
        </div>
      </div>
    )
  }

  // No project at all — show idea input box
  return (
    <div className="p-8 max-w-2xl mx-auto pt-12 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
          <Zap className="w-3 h-3" /> AI-Powered
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">
          <span className="text-white">Start a New </span>
          <span className="gradient-text">Project</span>
        </h1>
        <p className="text-zinc-500 text-sm">
          Drop your raw idea below — your AI co-founder will sharpen it before analysis
        </p>
      </div>

      <div className="grad-border p-[1px] rounded-2xl">
        <div className="rounded-2xl p-7" style={{ background: '#0c0c1a' }}>
          <form onSubmit={handleIdeaSubmit} className="space-y-5">

            {/* ── Mode toggle ──────────────────────────────────────────── */}
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {(
                [
                  { value: 'dynamic', icon: Brain,        label: 'Idea Lab',          hint: 'Guided — sharpens idea first' },
                  { value: 'static',  icon: FlaskConical,  label: 'Direct to Analysis', hint: 'Runs pipeline immediately'    },
                ] as const
              ).map(({ value, icon: Icon, label, hint }) => {
                const active = mode === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(45,212,191,0.18), rgba(129,140,248,0.18))',
                      border: '1px solid rgba(45,212,191,0.35)',
                      color: '#2dd4bf',
                      boxShadow: '0 0 12px rgba(45,212,191,0.1)',
                    } : {
                      color: '#52525b',
                      border: '1px solid transparent',
                    }}
                    title={hint}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                )
              })}
            </div>

            {/* ── Idea textarea ─────────────────────────────────────────── */}
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Your Business Idea <span style={{ color: '#2dd4bf' }}>*</span>
              </label>
              <textarea
                rows={5}
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                className="input-base resize-none w-full"
                style={{ borderRadius: '14px' }}
                placeholder={mode === 'dynamic'
                  ? 'Describe your idea — your AI co-founder will ask the right questions to sharpen it…'
                  : 'Describe your business idea in as much detail as you can — what problem it solves, who it serves, how it works…'
                }
                required
              />
            </div>

            {/* ── Submit button ─────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={creating || !ideaInput.trim()}
              className="btn-gradient w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {creating
                ? <><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Creating…</>
                : mode === 'dynamic'
                  ? <><Brain className="w-4 h-4" /> Start Idea Lab</>
                  : <><Sparkles className="w-4 h-4" /> Run Analysis</>
              }
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-zinc-700 text-xs mt-5">
        {mode === 'dynamic'
          ? 'Your AI co-founder will ask clarifying questions before running analysis · ~2 min'
          : 'Pipeline runs immediately on your raw idea · ~2 min generation time'
        }
      </p>
    </div>
  )
}
