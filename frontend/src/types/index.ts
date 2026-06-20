export interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  gap: string;
}

export interface MarketingPost {
  platform: 'Instagram' | 'LinkedIn' | 'Twitter' | 'Facebook';
  content: string;
  hashtags: string[];
  imagePrompt: string;
}

export interface FundingOpportunity {
  type: 'Grant' | 'VC' | 'Accelerator' | 'Angel' | 'Government Program';
  name: string;
  amount: string;
  description: string;
  matchReason: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  idea: string;
  industry?: string;
  targetAudience?: string;
  location?: string;
  marketResearch?: MarketResearchData;
  competitors: Competitor[];
  websiteCode?: string;
  marketingKit: MarketingPost[];
  fundingOpportunities: FundingOpportunity[];
  competitorAnalytics: any[];
  webhookUrl?: string;
  zapierWebhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketResearchData {
  tam: { value: string; description: string };
  sam: { value: string; description: string };
  som: { value: string; description: string };
  positioning: {
    quadrant: Array<{ name: string; x: number; y: number }>;
    pyramid: string[];
  };
  landscape: Array<{
    name: string;
    marketShare: string;
    growth: 'high' | 'medium' | 'low';
    threat: 'high' | 'medium' | 'low';
    notes: string;
  }>;
  keyOpportunity: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
