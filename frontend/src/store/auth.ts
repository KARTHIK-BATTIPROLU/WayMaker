import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { useProjectStore } from './project'

interface AuthState {
  user: User | null
  accessToken: string | null
  setAuth: (user: User, token: string) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        // Always clear the active project when a new user logs in
        // This prevents stale project IDs from a different user
        useProjectStore.getState().clearActiveProject()
        set({ user, accessToken })
      },
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => {
        useProjectStore.getState().clearActiveProject()
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'waymaker_auth' }
  )
)
