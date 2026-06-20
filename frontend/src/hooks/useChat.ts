import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { ChatMessage } from '../types'

export function useChat(projectId: string | null) {
  const queryClient = useQueryClient()

  const history = useQuery<ChatMessage[]>({
    queryKey: ['chat', projectId],
    queryFn: () => api.get(`/api/projects/${projectId}/chat/history`).then((r) => r.data),
    enabled: !!projectId,
  })

  const sendMessage = useMutation({
    mutationFn: (message: string) =>
      api.post(`/api/projects/${projectId}/chat`, { message }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat', projectId] })
      if (data.updates) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      }
    },
  })

  return { history, sendMessage }
}
