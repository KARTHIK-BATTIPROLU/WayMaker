import { useNavigate } from 'react-router-dom'
import { useProjects, useDeleteProject } from '../hooks/useProjects'
import { useProjectStore } from '../store/project'
import { FolderOpen, Trash2, Plus, BarChart2, Users, Globe, Megaphone, DollarSign, Calendar } from 'lucide-react'

const moduleIcons = [BarChart2, Users, Globe, Megaphone, DollarSign]
const moduleColors = ['text-teal-400', 'text-indigo-400', 'text-emerald-400', 'text-rose-400', 'text-amber-400']

export default function MyProjects() {
  const { data: projects, isLoading } = useProjects()
  const { mutate: deleteProject } = useDeleteProject()
  const setActiveProject = useProjectStore((s) => s.setActiveProject)
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-40 bg-white/[0.05] rounded-lg shimmer mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="h-4 w-3/4 bg-white/[0.05] rounded shimmer" />
              <div className="h-3 w-full bg-white/[0.04] rounded shimmer" />
              <div className="h-3 w-2/3 bg-white/[0.04] rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5">
          <FolderOpen className="text-zinc-600 w-7 h-7" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">No projects yet</h2>
        <p className="text-zinc-500 text-sm mb-6 text-center max-w-xs">
          Create your first project and let AI build your complete startup foundation
        </p>
        <button
          onClick={() => {
            useProjectStore.getState().clearActiveProject()
            navigate('/dashboard')
          }}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create First Project
        </button>
      </div>
    )
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this project? This cannot be undone.')) {
      deleteProject(id)
      if (useProjectStore.getState().activeProjectId === id) {
        useProjectStore.getState().clearActiveProject()
      }
    }
  }

  const handleOpen = (id: string) => {
    setActiveProject(id)
    navigate('/dashboard')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-2xl font-bold">My Projects</h1>
          <span className="bg-teal-500/10 border border-teal-400/20 text-teal-300 text-xs px-3 py-1 rounded-full font-medium">
            {projects.length}
          </span>
        </div>
        <button
          onClick={() => {
            useProjectStore.getState().clearActiveProject()
            navigate('/dashboard')
          }}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => {
          const modulesDone = [
            !!project.marketResearch,
            (project.competitors?.length ?? 0) > 0,
            !!project.websiteCode,
            (project.marketingKit?.length ?? 0) > 0,
            (project.fundingOpportunities?.length ?? 0) > 0,
          ]
          const doneCount = modulesDone.filter(Boolean).length

          return (
            <div
              key={project.id}
              onClick={() => handleOpen(project.id)}
              className="glass-card p-5 cursor-pointer hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all group relative flex flex-col"
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, project.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Project name */}
              <h3 className="text-white font-semibold text-sm pr-8 truncate mb-1">{project.name}</h3>
              <p className="text-zinc-600 text-xs line-clamp-2 leading-relaxed mb-3">
                {project.idea.substring(0, 90)}{project.idea.length > 90 ? '...' : ''}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {project.industry && (
                  <span className="text-[10px] bg-white/[0.04] border border-white/[0.07] text-zinc-500 px-2 py-0.5 rounded">
                    {project.industry}
                  </span>
                )}
                {project.targetAudience && (
                  <span className="text-[10px] bg-white/[0.04] border border-white/[0.07] text-zinc-500 px-2 py-0.5 rounded">
                    {project.targetAudience}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1 text-zinc-600 text-[10px]">
                  <Calendar className="w-3 h-3" />
                  {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="flex items-center gap-2">
                  {/* Module icons with completion */}
                  <div className="flex gap-1">
                    {moduleIcons.map((Icon, i) => (
                      <Icon
                        key={i}
                        className={`w-3 h-3 transition-opacity ${modulesDone[i] ? moduleColors[i] : 'text-zinc-700'}`}
                      />
                    ))}
                  </div>
                  <span className="text-zinc-600 text-[10px]">{doneCount}/5</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
