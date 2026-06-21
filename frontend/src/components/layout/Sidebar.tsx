import { NavLink, useNavigate } from 'react-router-dom'
import { Sparkles, BarChart2, Users, UserSearch, Globe, Megaphone, DollarSign, Plug, Plus, FolderOpen, LogOut } from 'lucide-react'
import { useProjectStore } from '../../store/project'
import { useAuthStore } from '../../store/auth'
import { useProject } from '../../hooks/useProject'
import api from '../../lib/api'

const modules = [
  { to: '/dashboard/research',             icon: BarChart2,  label: 'Market Research',      key: 'marketResearch',       color: '#2dd4bf' },
  { to: '/dashboard/competitors',          icon: Users,      label: 'Competitor Analysis',  key: 'competitors',          color: '#818cf8' },
  { to: '/dashboard/customer-validation',  icon: UserSearch, label: 'Customer Validation',  key: 'customerValidation',   color: '#f472b6' },
  { to: '/dashboard/website',              icon: Globe,      label: 'Landing Page',          key: 'websiteCode',          color: '#34d399' },
  { to: '/dashboard/funding',              icon: DollarSign, label: 'Funding',               key: 'fundingOpportunities', color: '#fbbf24' },
  { to: '/dashboard/marketing-kit',        icon: Megaphone,  label: 'Marketing Kit',         key: 'marketingKitGenerated', color: '#fb923c' },
  { to: '/dashboard/deployments',          icon: Plug,       label: 'Deployments',           key: null,                   color: '#c084fc' },
]

const PROGRESS_MODULE_COUNT = 6

function isDone(project: any, key: string | null): boolean {
  if (!project || !key) return false
  const v = project[key]
  return Array.isArray(v) ? v.length > 0 : !!v
}

export default function Sidebar() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const clearActiveProject = useProjectStore(s => s.clearActiveProject)
  const { user, clearAuth } = useAuthStore()
  const { data: project } = useProject(activeProjectId)
  const navigate = useNavigate()

  const doneCount = modules.slice(0, PROGRESS_MODULE_COUNT).filter(m => isDone(project, m.key)).length
  const pct = Math.round((doneCount / PROGRESS_MODULE_COUNT) * 100)

  const handleNewProject = () => { clearActiveProject(); navigate('/dashboard') }
  const handleLogout = async () => {
    clearAuth(); navigate('/login')
    try { await api.post('/api/auth/logout') } catch {}
  }

  return (
    <aside className="w-[220px] min-h-screen flex flex-col shrink-0"
      style={{ background: '#09090f', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(45,212,191,0.3)]"
            style={{ background: 'linear-gradient(135deg,#2dd4bf,#818cf8)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm font-display tracking-tight leading-none">Waymaker</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#3f3f52' }}>AI Business Builder</div>
          </div>
        </div>
      </div>

      {/* Active project card */}
      {activeProjectId && project && (
        <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.12)' }}>
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(45,212,191,0.6)' }}>Active Project</div>
          <div className="text-white text-xs font-semibold truncate mb-2">{project.name}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2dd4bf,#818cf8)' }} />
            </div>
            <span className="text-[10px] shrink-0" style={{ color: '#52525b' }}>{doneCount}/{PROGRESS_MODULE_COUNT}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {activeProjectId && (
          <>
            <div className="text-[9px] font-bold uppercase tracking-widest px-3 mb-2 pt-1" style={{ color: '#3f3f52' }}>Modules</div>
            {modules.map(({ to, icon: Icon, label, key, color }) => {
              const done = isDone(project, key)
              return (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all ${
                      isActive ? 'nav-active font-medium' : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }>
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? color : undefined }} />
                        <span>{label}</span>
                      </div>
                      {done && (
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </>
        )}

        {!activeProjectId && (
          <div className="px-3 pt-4">
            <p className="text-zinc-700 text-xs leading-relaxed">Create or open a project to access modules.</p>
          </div>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="pb-4">
        <div className="mx-3 my-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="px-3 space-y-0.5">
          <button onClick={handleNewProject}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all">
            <Plus className="w-3.5 h-3.5" /> New Project
          </button>
          <NavLink to="/dashboard/projects"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all ${isActive ? 'text-white bg-white/[0.06]' : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'}`
            }>
            <FolderOpen className="w-3.5 h-3.5" /> My Projects
          </NavLink>
        </div>

        <div className="mx-3 my-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <div className="px-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(45,212,191,0.3),rgba(129,140,248,0.3))', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
            {user?.email?.[0] ?? '?'}
          </div>
          <div className="text-[11px] text-zinc-500 truncate flex-1">{user?.email}</div>
          <button onClick={handleLogout} title="Log out"
            className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
