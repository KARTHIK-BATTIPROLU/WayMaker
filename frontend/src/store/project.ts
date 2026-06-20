import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProjectState {
  activeProjectId: string | null
  setActiveProject: (id: string) => void
  clearActiveProject: () => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      setActiveProject: (id) => set({ activeProjectId: id }),
      clearActiveProject: () => set({ activeProjectId: null }),
    }),
    { name: 'waymaker_project' }
  )
)
