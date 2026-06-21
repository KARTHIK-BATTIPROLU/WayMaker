// TypeScript interfaces for the WayMaker Research Pipeline v2 schemas.
// Schema source: CONTEXT_research_pipeline.md (the originally-referenced verbatim spec
// docs were not found in the repo — see TODO_research_pipeline.md Phase 0.4). These
// interfaces mirror exactly what backend/agents/prompts.py's three system prompts produce.

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type Momentum = 'rising' | 'stable' | 'declining';
export type GrowthThreat = 'high' | 'medium' | 'low';

// ── market_intelligence.v1 ──────────────────────────────────────────────────

export interface MarketSizeEstimate {
  value: string;
  methodology: 'top_down' | 'bottom_up' | 'value_theory';
  description: string;
  source_urls: string[];
  confidence: Confidence;
}

export interface MarketDefinition {
  primary: string;
  secondary: string;
  adjacent: string;
  rationale: string;
}

export interface PositioningPoint {
  name: string;
  x: number;
  y: number;
}

export interface CustomerSegment {
  name: string;
  description: string;
  size_estimate: string;
  priority: Severity;
}

export interface MarketTrend {
  title: string;
  description: string;
  momentum: Momentum;
  time_horizon: string;
}

export interface DemandSignal {
  signal: string;
  source: string;
  interpretation: string;
}

export interface LandscapeEntry {
  name: string;
  marketShare: string;
  growth: GrowthThreat;
  threat: GrowthThreat;
  notes: string;
}

export interface MarketRisk {
  category: 'market' | 'regulatory' | 'technology' | 'execution';
  description: string;
  severity: Severity;
}

export interface MarketOpportunity {
  title: string;
  description: string;
  potential_impact: Severity;
}

export interface AttractivenessScores {
  market_size: number;
  growth_rate: number;
  competitive_intensity: number;
  barriers_to_entry: number;
  monetization_potential: number;
  overall: number;
  verdict: string;
}

export interface TieredSources {
  tier1: string[];
  tier2: string[];
  tier3: string[];
}

export interface MarketIntelligence {
  schema: 'market_intelligence.v1';
  executive_summary: string;
  market_definition: MarketDefinition;
  tam: MarketSizeEstimate;
  sam: MarketSizeEstimate;
  som: MarketSizeEstimate;
  positioning: { quadrant: PositioningPoint[]; pyramid: string[] };
  customer_segments: CustomerSegment[];
  trends: MarketTrend[];
  demand_signals: DemandSignal[];
  landscape: LandscapeEntry[];
  risks: MarketRisk[];
  opportunities: MarketOpportunity[];
  attractiveness: AttractivenessScores;
  strategic_recommendations: string[];
  data_gaps: string[];
  sources: TieredSources;
  confidence_overall: Confidence;
  disclaimer: string;
  flags?: string[];
}

// ── competitor_intelligence.v1 ──────────────────────────────────────────────

export interface CompetitorSource {
  name: string;
  url: string;
  verified: boolean;
}

export interface ReviewThemes {
  praise: string[];
  complaints: string[];
}

export interface CompetitorCard {
  name: string;
  is_status_quo: boolean;
  sources: CompetitorSource[];
  pricing: string;
  positioning_statement: string;
  funding: string | null;
  strengths: string[];
  weaknesses: string[];
  gap: string;
  review_themes: ReviewThemes;
}

export type FeatureSupport = 'yes' | 'no' | 'partial';

export interface FeatureMatrixRow {
  competitor: string;
  support: Record<string, FeatureSupport>;
}

export interface FeatureMatrix {
  features: string[];
  rows: FeatureMatrixRow[];
}

export interface PositioningMap {
  x_axis: string;
  y_axis: string;
  points: PositioningPoint[];
}

export interface ScoredOpportunity {
  title: string;
  description: string;
  impact: number;
  feasibility: number;
  differentiation: number;
}

export interface CompetitorIntelligence {
  schema: 'competitor_intelligence.v1';
  competitors: CompetitorCard[];
  feature_matrix: FeatureMatrix;
  positioning_map: PositioningMap;
  blue_ocean: string[];
  opportunities: ScoredOpportunity[];
  strategic_recommendations: string[];
  data_gaps: string[];
  disclaimer: string;
  confidence_overall?: Confidence;
  flags?: string[];
}

/** True for pre-v2 project docs where `competitors` is still the old flat
 * List<{name,strengths,weaknesses,gap}> instead of CompetitorIntelligence. */
export function isLegacyCompetitorsShape(competitors: unknown): competitors is LegacyCompetitor[] {
  return Array.isArray(competitors);
}

export interface LegacyCompetitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  gap: string;
}

// ── customer_discovery.v1 ───────────────────────────────────────────────────

export interface PersonaCard {
  name: string;
  role: string;
  demographics: string;
  goals: string[];
  frustrations: string[];
}

export interface ICP {
  narrative: string;
  persona_card: PersonaCard;
  jtbd: string;
}

export interface Community {
  name: string;
  platform: string;
  url: string;
  size_estimate: string;
  relevance: Severity;
  verified: boolean;
}

export interface Directory {
  name: string;
  url: string;
  verified: boolean;
}

export interface OutreachTemplate {
  channel: string;
  subject: string;
  body: string;
}

export interface ValidationExperiment {
  name: string;
  hypothesis: string;
  method: string;
  success_metric: string;
}

export interface InterviewFramework {
  discovery_questions: string[];
  problem_questions: string[];
  willingness_to_pay_questions: string[];
}

export interface Scorecard {
  fields: string[];
  threshold_legend: { go: string; maybe: string; no_go: string };
}

export interface SevenDayPlanEntry {
  day: number;
  task: string;
  who: string;
  where: string;
  success_criteria: string;
}

export interface CustomerDiscovery {
  schema: 'customer_discovery.v1';
  icp: ICP;
  communities: Community[];
  directories: Directory[];
  outreach_templates: OutreachTemplate[];
  validation_experiments: ValidationExperiment[];
  interview_framework: InterviewFramework;
  scorecard: Scorecard;
  seven_day_plan: SevenDayPlanEntry[];
  data_gaps: string[];
  disclaimer: string;
  confidence_overall?: Confidence;
  flags?: string[];
}
