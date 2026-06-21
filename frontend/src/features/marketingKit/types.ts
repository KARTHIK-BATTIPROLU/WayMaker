export type SessionMode = 'linkedin' | 'platform'
export type SessionStatus =
  | 'starting' | 'generating_post' | 'generating_kit' | 'generating_images'
  | 'preview' | 'platform_preview' | 'error'

export interface PlatformKitItem {
  platform: string
  content: string
  hashtags: string[]
  image_prompt: string
  image_url: string | null
}

export interface DeployResult {
  status: 'deployed' | 'skipped' | 'error'
  status_code?: number
  error?: string
}

export interface Session {
  _id: string
  mode: SessionMode
  status: SessionStatus
  error: string | null
  origin: 'own_idea' | 'calendar'
  topic_id: string | null
  brand_asset_url?: string | null
  deploy_results: Record<string, DeployResult>
  user_input: string
  // linkedin mode
  post_text?: string | null
  hashtags?: string[]
  image_urls?: string[]
  image_prompt?: string
  approved?: boolean
  // platform mode
  target_platforms?: string[]
  marketing_kit?: PlatformKitItem[]
}

export interface TopicSource {
  name: string
  url: string
}

export interface Topic {
  _id: string
  title: string
  description: string
  horizon: 'now' | 'upcoming'
  category?: string
  sources: TopicSource[]
  date?: string
  used: boolean
}

export interface PermanentTopic extends Topic {
  added_at: string
  source_daily_topic_id: string | null
  dedupe_key: string
}

export interface FollowedSource {
  _id: string
  name: string
  type: 'rss' | 'website' | 'twitter' | 'youtube' | 'blog'
  url: string
  active: boolean
}

export interface CalendarConfig {
  _id: string
  domain: string
  keywords: string[]
  timezone: string
  daily_topic_count: number
  forward_horizon_months: number
  active: boolean
  last_run_at: string | null
}
