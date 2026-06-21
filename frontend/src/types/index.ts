import type { MarketIntelligence, CompetitorIntelligence, CustomerDiscovery, LegacyCompetitor } from './research';

// ── Ideation types ────────────────────────────────────────────────────────

export interface DimensionScores {
  problem: number;
  targetCustomer: number;
  solutionWedge: number;
  alternatives: number;
  valueAndWillingness: number;
}

export interface ExtractedIdea {
  problem: string;
  targetCustomer: string;
  solutionWedge: string;
  alternatives: string;
  valueAndWillingness: string;
  industry: string;
  location: string;
}

export interface IdeationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface IdeationData {
  messages: IdeationMessage[];
  extracted: ExtractedIdea;
  dimensionScores: DimensionScores;
  confidence: number;
  ready: boolean;
  status: 'ideating' | 'ready' | 'analyzed';
}

export interface IdeateResponse {
  reply: string;
  nextQuestion: string;
  extracted: ExtractedIdea;
  dimensionScores: DimensionScores;
  confidence: number;
  ready: boolean;
  messages: IdeationMessage[];
}

// ── Existing types ─────────────────────────────────────────────────────────

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
  hackathonMode?: boolean;
  marketResearch?: MarketIntelligence;
  // competitor_intelligence.v1 once regenerated; may still be the legacy LegacyCompetitor[]
  // shape for projects that haven't been re-run since the v2 research pipeline shipped.
  competitors?: CompetitorIntelligence | LegacyCompetitor[];
  customerValidation?: CustomerDiscovery;
  websiteCode?: string;
  fundingOpportunities: FundingOpportunity[];
  competitorAnalytics: any[];
  webhookUrl?: string;
  zapierWebhookUrl?: string;
  marketingKitGenerated?: boolean;
  ideation?: IdeationData;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
