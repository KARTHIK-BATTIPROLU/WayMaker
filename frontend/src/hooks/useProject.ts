import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Project } from '../types'

export function useProject(projectId: string | null) {
  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const r = await api.get(`/api/projects/${projectId}`)
      return r.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry 403 or 404 — these are permanent failures (wrong user or deleted project)
      if (error?.response?.status === 403 || error?.response?.status === 404) return false
      return failureCount < 2
    },
  })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: Partial<Project>) =>
      api.patch(`/api/projects/${projectId}`, updates).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['project', projectId], data)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
