import api from '../lib/api'
import type { Project } from '../types'

export const updateProject = async (
  projectId: string, 
  updates: Partial<Project>
): Promise<void> => {
  try {
    await api.patch(`/api/projects/${projectId}`, updates)
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

export const saveProject = async (
  projectId: string,
  project: Partial<Project>
): Promise<void> => {
  const mappedUpdates = {
    ...project,
    websiteCode: project.websiteCode || undefined,
    webhookUrl: project.webhookUrl || undefined,
    zapierWebhookUrl: project.zapierWebhookUrl || undefined,
  }
  await updateProject(projectId, mappedUpdates)
}
