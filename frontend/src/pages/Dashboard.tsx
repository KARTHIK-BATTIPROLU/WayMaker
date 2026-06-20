import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NavLink } from 'react-router-dom'
import { Sparkles, BarChart2, Users, Globe, Megaphone, DollarSign, Plug, CheckCircle, Play, ArrowRight, Lightbulb, Zap } from 'lucide-react'
import { newProjectSchema } from '../lib/schemas'
import type { z } from 'zod'
import api from '../lib/api'
import { useProjectStore } from '../store/project'
import { useProject, useOrchestrate } from '../hooks'
import { useEffect, useRef } from 'react'

type NewProjectForm = z.infer<typeof newProjectSchema>

const moduleCards = [
  { to: '/dashboard/research',    icon: BarChart2,  label: 'Market Research',     desc: 'TAM/SAM/SOM + positioning',         color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.2)',  check: (p: any) => !!p.marketResearch },
  { to: '/dashboard/competitors', icon: Users,      label: 'Competitor Analysis',  desc: 'SWOT for top 5 competitors',        color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)', check: (p: any) => p.competitors?.length > 0 },
  { to: '/dashboard/website',     icon: Globe,      label: 'Landing Page',         desc: 'AI-generated Tailwind website',     color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  check: (p: any) => !!p.websiteCode },
  { to: '/dashboard/marketing',   icon: Megaphone,  label: 'Marketing Kit',        desc: 'Social posts for 4 platforms',      color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.2)', check: (p: any) => p.marketingKit?.length > 0 },
  { to: '/dashboard/funding',     icon: DollarSign, label: 'Funding Matcher',      desc: 'Grants, VCs & accelerators',        color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  check: (p: any) => p.fundingOpportunities?.length > 0 },
  { to: '/dashboard/deployments', icon: Plug,       label: 'Deployments',          desc: 'n8n & Zapier webhook config',       color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.2)', check: () => false },
]

const pipelineSteps = [
  { id: 'web_search',      label: 'Web Research',   icon: '🌐' },
  { id: 'market_research', label: 'Market Analysis',icon: '📊' },
  { id: 'competitors',     label: 'Competitors',    icon: '🎯' },
  { id: 'website',         label: 'Landing Page',   icon: '🌐' },
  { id: 'marketing',       label: 'Marketing',      icon: '📣' },
  { id: 'funding',         label: 'Funding',         icon: '💰' },
]

export default function Dashboard() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const clearActiveProject = useProjectStore((s) => s.clearActiveProject)

  const { data: project, error: projectError } = useProject(activeProjectId)
  const orchestrate = useOrchestrate(activeProjectId || '')
  const autoStartedRef = useRef<string | null>(null)

  useEffect(() => {
    if (projectError && activeProjectId) clearActiveProject()
  }, [projectError, activeProjectId, clearActiveProject])

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<NewProjectForm>({
    resolver: zodResolver(newProjectSchema),
  })

  const onSubmit = async (data: NewProjectForm) => {
    try {
      const res = await api.post('/api/projects', data)
      setActiveProject(res.data.id)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (activeProjectId && project && !project.marketResearch && !orchestrate.isRunning &&
        orchestrate.progress === 0 && autoStartedRef.current !== activeProjectId) {
      autoStartedRef.current = activeProjectId
      orchestrate.start()
    }
  }, [activeProjectId, project, orchestrate.isRunning, orchestrate.progress, orchestrate.start])

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

          {/* Animated pulse */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center relative pulse-ring"
              style={{ background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)' }}>
              <Sparkles className="text-teal-400 w-7 h-7 relative z-10 animate-float" />
            </div>
          </div>

          {/* Step message */}
          <div className="text-center">
            <p className="text-white text-base font-medium min-h-6">{orchestrate.stepMessage}</p>
            {orchestrate.completedSteps.includes('web_search') && (
              <p className="text-teal-400 text-xs mt-1">{orchestrate.webResultCount} web results fetched</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full rounded-full overflow-hidden h-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${orchestrate.progress}%`, background: 'linear-gradient(90deg, #2dd4bf, #818cf8, #c084fc)' }} />
          </div>

          {/* Steps grid */}
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

  /* ── STATE C: Project exists ── */
  if (activeProjectId && project) {
    const allGenerated = project.marketResearch && project.competitors?.length > 0 &&
      project.websiteCode && project.marketingKit?.length > 0 && project.fundingOpportunities?.length > 0
    const doneCount = moduleCards.filter(m => m.check(project)).length

    return (
      <div className="p-8 animate-fade-in-up">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-bold gradient-text mb-2 truncate">{project.name}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              {project.industry && <span className="tag-pill">{project.industry}</span>}
              {project.targetAudience && <span className="tag-pill">{project.targetAudience}</span>}
              {project.location && <span className="tag-pill">{project.location}</span>}
            </div>
            <p className="text-zinc-600 italic text-sm max-w-2xl line-clamp-2">
              "{project.idea.substring(0, 160)}{project.idea.length > 160 ? '…' : ''}"
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            {!allGenerated && !orchestrate.isRunning && (
              <button onClick={() => { autoStartedRef.current = null; orchestrate.start() }}
                className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl">
                <Play className="w-4 h-4" /> Run AI Pipeline
              </button>
            )}
            <div className="flex items-center gap-2 text-zinc-600 text-xs">
              <div className="flex gap-1.5">
                {moduleCards.slice(0,5).map((m,i) => (
                  <div key={i} className={m.check(project) ? 'dot-done' : 'dot-pending'} />
                ))}
              </div>
              {doneCount}/5 generated
            </div>
          </div>
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map(({ to, icon: Icon, label, desc, color, bg, border, check }) => {
            const done = check(project)
            return (
              <NavLink key={to} to={to}
                className="glass-card-hover p-5 cursor-pointer block group relative">
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

  /* ── STATE A: No project ── */
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
        <p className="text-zinc-500 text-sm">Your complete startup foundation — built in ~2 minutes</p>
      </div>

      <div className="grad-border p-[1px] rounded-2xl">
        <div className="rounded-2xl p-7" style={{ background: '#0c0c1a' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Your Business Idea <span style={{ color: '#2dd4bf' }}>*</span>
              </label>
              <textarea {...register('idea')} rows={4}
                className="input-base resize-none"
                style={{ borderRadius: '14px' }}
                placeholder="Describe your business idea — what problem it solves, who it serves, how it works..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { field: 'industry', label: 'Industry', placeholder: 'e.g. FinTech' },
                { field: 'targetAudience', label: 'Target Audience', placeholder: 'e.g. SMBs' },
                { field: 'location', label: 'Location', placeholder: 'e.g. US / Global' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-zinc-500 text-xs font-medium mb-1.5">{label}</label>
                  <input type="text" {...register(field as any)} placeholder={placeholder} className="input-base" style={{ borderRadius: '10px', padding: '9px 14px' }} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={isSubmitting}
              className="btn-gradient w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {isSubmitting
                ? <><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Creating project...</>
                : <><Sparkles className="w-4 h-4" /> Launch Project</>}
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-zinc-700 text-xs mt-5">
        AI pipeline starts automatically after creation · ~2 minute generation time
      </p>
    </div>
  )
}
