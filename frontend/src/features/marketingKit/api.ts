import api from '../../lib/api'
import type {
  Session, Topic, PermanentTopic, FollowedSource, CalendarConfig,
} from './types'

const BASE = '/api/marketing-kit'

export async function uploadBrandAsset(imageBase64: string) {
  const { data } = await api.post<{ url: string }>(`${BASE}/upload-asset`, { image_base64: imageBase64 })
  return data.url
}

export async function runOwnIdea(userInput: string, brandAssetUrl?: string, projectId?: string | null) {
  const { data } = await api.post<{ session_id: string }>(`${BASE}/run`, {
    user_input: userInput, origin: 'own_idea', brand_asset_url: brandAssetUrl, project_id: projectId,
  })
  return data
}

export async function runOwnIdeaPlatform(userInput: string, targetPlatforms: string[], brandAssetUrl?: string, projectId?: string | null) {
  const { data } = await api.post<{ session_id: string }>(`${BASE}/run_platform`, {
    user_input: userInput, target_platforms: targetPlatforms, origin: 'own_idea', brand_asset_url: brandAssetUrl, project_id: projectId,
  })
  return data
}

export async function getSessionState(sessionId: string) {
  const { data } = await api.get<Session>(`${BASE}/state/${sessionId}`)
  return data
}

export async function approveSession(sessionId: string) {
  const { data } = await api.post<Session>(`${BASE}/action/${sessionId}`, { action: 'approve' })
  return data
}

export async function regeneratePost(sessionId: string) {
  const { data } = await api.post<Session>(`${BASE}/action/${sessionId}`, { action: 'regenerate_post' })
  return data
}

export async function regenerateImages(sessionId: string) {
  const { data } = await api.post<Session>(`${BASE}/action/${sessionId}`, { action: 'regenerate_images' })
  return data
}

export async function editPostText(sessionId: string, postText: string) {
  await api.post(`${BASE}/edit/${sessionId}`, { post_text: postText })
}

export async function deployOne(sessionId: string, platform: string) {
  const { data } = await api.post(`${BASE}/deploy/${sessionId}`, { platform })
  return data
}

export async function deployAll(sessionId: string) {
  const { data } = await api.post(`${BASE}/deploy-all/${sessionId}`)
  return data
}

export async function getPreferences() {
  const { data } = await api.get<{ content: string }>(`${BASE}/preferences`)
  return data.content
}

export async function updatePreferences(content: string) {
  await api.put(`${BASE}/preferences`, { content })
}

// ── Content Calendar ─────────────────────────────────────────────────────────

export async function getTodayTopics() {
  const { data } = await api.get<Topic[]>(`${BASE}/calendar/today`)
  return data
}

export async function getPermanentTopics() {
  const { data } = await api.get<PermanentTopic[]>(`${BASE}/calendar/permanent`)
  return data
}

export async function addPermanentTopic(topicId: string) {
  const { data } = await api.post<PermanentTopic>(`${BASE}/calendar/permanent`, { topic_id: topicId })
  return data
}

export async function deletePermanentTopic(topicId: string) {
  await api.delete(`${BASE}/calendar/permanent/${topicId}`)
}

export async function getSources() {
  const { data } = await api.get<FollowedSource[]>(`${BASE}/calendar/sources`)
  return data
}

export async function addSource(source: { name: string; type: string; url: string }) {
  const { data } = await api.post<FollowedSource>(`${BASE}/calendar/sources`, source)
  return data
}

export async function deleteSource(sourceId: string) {
  await api.delete(`${BASE}/calendar/sources/${sourceId}`)
}

export async function getCalendarConfig() {
  const { data } = await api.get<CalendarConfig>(`${BASE}/calendar/config`)
  return data
}

export async function updateCalendarConfig(updates: Partial<CalendarConfig>) {
  const { data } = await api.put<CalendarConfig>(`${BASE}/calendar/config`, updates)
  return data
}

export async function refreshCalendarNow() {
  const { data } = await api.post(`${BASE}/calendar/refresh-now`)
  return data
}

export async function generateFromTopic(topicId: string, mode: 'linkedin' | 'platform', targetPlatforms?: string[]) {
  const { data } = await api.post<{ session_id: string }>(`${BASE}/calendar/generate`, {
    topic_id: topicId, mode, target_platforms: targetPlatforms,
  })
  return data
}
