import api from '../lib/api'
import type { Project } from '../types'

const handleAIError = (error: unknown): never => {
  console.error('AI Error:', error)
  const message = (error as any)?.response?.data?.detail
  throw new Error(message || (error instanceof Error ? error.message : 'Failed to generate AI data.'))
}

export const generateWebsiteCode = async (project: Project): Promise<string> => {
  try {
    const res = await api.post(`/api/projects/${project.id}/regenerate-website`)
    return res.data.websiteCode
  } catch (error) {
    return handleAIError(error)
  }
}
