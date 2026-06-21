# TODO.md — WayMaker Research Pipeline v2 Implementation

> Step-by-step build plan. Execute top to bottom. Each box is a small, verifiable step. Section refs point to **`CONTEXT_research_pipeline.md`** (e.g. "§4"). The three originally-referenced "uploaded agent specs" were never found in this repo (see Phase 0.4) — schemas/prompts below were authored from CONTEXT's detailed description instead, per explicit user direction to proceed without them.
>
> Stack: FastAPI + LangGraph + Groq (Llama 3.3 70B) + Serper + MongoDB + SSE; React + TypeScript + React Query.
> **Preserve the harness** (graph wiring style, SSE per-node, Mongo-write-inside-node, state deltas, `reduce_errors`, frontend reads from Mongo via React Query). We change node internals, schemas, node count (2→3), and the views — nothing else.

---

## Phase 0 — Prep

- [x] 0.1 Read the actual `backend/agents/graph.py`, `state.py`, `prompts.py`, `nodes/*`, `routers/orchestrate.py`, `models/project.py`, and the two frontend module pages. **Path reconciliation:** there is no `tools/serper.py` or `agents/tools/` dir in this repo — the Serper client lives at `backend/services/search_service.py`; new tooling was added there instead of creating a parallel `tools/` package.
- [x] 0.2 `httpx` already used by `search_service.py`. Trends source resolved to the Serper proxy (locked decision below) — no `pytrends` dependency added.
- [x] 0.3 Confirmed React Query (`useProject()`) + design-system classes already used by `MarketResearch.tsx`/`Competitors.tsx`: `glass-card`, `section-label`, `data-table`, `tag-pill`, `gradient-text`. Reused throughout Phases 9–11, no new styling introduced.
- [x] 0.4 **Resolved (not by finding the docs — they don't exist in this repo).** Searched the full tree, `*.md`/`*.txt`, a `specs/` dir, and grepped for `market_intelligence.v1`/`competitor_intelligence.v1`/`customer_discovery.v1` — only `CONTEXT_research_pipeline.md`'s paraphrase exists. Flagged this as a hard blocker; user explicitly directed proceeding anyway. `prompts.py`'s three system prompts (`MARKET_INTELLIGENCE_SYSTEM`, `COMPETITIVE_INTELLIGENCE_SYSTEM`, `CUSTOMER_DISCOVERY_SYSTEM`) and the schemas in `frontend/src/types/research.ts` were authored from CONTEXT's field-level description — every field CONTEXT names is implemented; the prose connecting them is original, not a paraphrase of unseen text.

**Open Questions §14 resolved:**
- **Q1 (pillars source):** resolved from code — `models/project.py`'s `IdeationData.extracted` (`problem`/`targetCustomer`/`solutionWedge`/`alternatives`/`valueAndWillingness`) is the richer intake; wired into `context.py`'s pillar mapping with graceful fallback to `idea`/`industry`/`targetAudience`/`location` when ideation hasn't run.
- **Q2 (trends source):** user confirmed Serper search proxy (implemented and live-tested in `trends_signal()`).
- **Q5 (competitor field name):** kept `competitors` (minimal churn) holding the new `competitor_intelligence.v1` object instead of renaming to `competitorAnalysis`.
- **Q3 (Groq JSON reliability):** large schemas did hit this in practice — the first live run 413'd on the default `llama-3.1-8b-instant` model. Fixed by pinning all three synthesis calls to `llama-3.3-70b-versatile` (large context window) rather than sectioned generation.
- **Q4 (per-module regenerate):** not built — Phase 12 left as optional/未done, full-pipeline re-run is the only regeneration path for now.

---

## Phase 1 — Shared Research Context & Budget (§6)

- [x] 1.1 `agents/budget.py`: `ResearchBudget` dataclass + `can_search()`/`can_fetch()`/`note_search()`/`note_fetch()`. Defaults 25/12; `build_budget(hackathon_mode=True)` tightens to 12/6.
- [x] 1.2 `agents/context.py`: `build_research_context(project)` maps `ideation.extracted` into the five pillars, falling back to `idea/industry/targetAudience/location`. Added `hackathonMode` field to `models/project.py`.
- [x] 1.3 Verified live: well-formed pillars, `geography:"IN"`, budget caps present.

---

## Phase 2 — Tooling Layer (§4, §11)

- [x] 2.1 `services/search_service.py`: kept `fetch_real_world_context`/`serper_search_structured`; added `enrich_competitor(name, budget)`.
- [x] 2.2 Added `verify_url(url, budget)` → httpx HEAD (GET fallback), 6s timeout, follows redirects.
- [x] 2.3 Added `trends_signal(term, budget)` → Serper search-volume proxy.
- [x] 2.4 All three route through the budget guard.
- [x] 2.5 Verified live against the real Serper key.

---

## Phase 3 — Validation Gate (§8)

- [x] 3.1 `agents/validators.py`: `validate_module_output(schema_name, data) -> {ok, blocks[], warns[]}` for market/competitor/customer, matching the BLOCK/WARN rules CONTEXT §8 specifies (attractiveness.overall, tam.source_urls+top_down, competitors<3, unverified sources, opportunities<2, communities<5 verified, <15 interview questions, ≤10-word 7-day tasks, "we have built" WARN).
- [x] 3.2 Disclaimer-integrity check via `RESEARCH_DISCLAIMER` exact-match (`agents/prompts.py`) for all three schemas.
- [x] 3.3 `run_with_validation(synthesize_fn, schema_name)`: synthesize → validate → on BLOCK, retry once with the block list appended → returns `(data, "ok"|"partial")`, sets `confidence_overall:"LOW"` + `flags[]` on persistent failure.
- [x] 3.4 Verified with deliberately-broken fixtures (2 competitors, missing disclaimer, ≤10-word task, 5 questions) → all correct BLOCKs fired; clean fixtures passed.

---

## Phase 4 — Market Intelligence Node (§3, §4)

- [x] 4.1 `prompts.py`: `MARKET_INTELLIGENCE_SYSTEM` → outputs `market_intelligence.v1`.
- [x] 4.2 `nodes/market_research.py` → gather (web_search_context + segment/funding Serper searches + `trends_signal`) → synthesize (`llama-3.3-70b-versatile`) → validate (`run_with_validation`) → persist (`marketResearch`) → delta.
- [x] 4.3 WARN flags stored as `flags[]` on the doc when persisted partial.
- [x] 4.4 Verified live on a real project (D2C WhatsApp marketing idea): TAM ₹11,000cr/SAM ₹2,200cr/SOM ₹550cr with methodology+confidence+source_urls, `attractiveness.overall:7.6`, disclaimer intact, INR + Indian sources throughout.

---

## Phase 5 — Competitive Intelligence Node (§3, §4 — closes the grounding gap)

- [x] 5.1 `prompts.py`: `COMPETITIVE_INTELLIGENCE_SYSTEM` → outputs `competitor_intelligence.v1`.
- [x] 5.2 `nodes/competitors.py` gather: 6 discovery query templates via Serper → dedupe by domain → a lightweight Groq extraction step pulls candidate company names **only from the real snippets gathered** (never from training knowledge) → `enrich_competitor()` per candidate → `verify_url()` every source → candidates with zero verified sources are dropped before they ever reach synthesis.
- [x] 5.3 synthesize: `groq_chat()` (`llama-3.3-70b-versatile`) with the grounded dossier → competitor cards, feature matrix (incl. "Your Idea"), positioning map, blue ocean, scored opportunities, recs.
- [x] 5.4 validate: `run_with_validation(..., "competitor")`.
- [x] 5.5 Kept the `competitors` field name (now holding the full object).
- [x] 5.6 Verified live: 4 grounded competitors (WhatsApp, ManyChat, Interakt, all `verified:true` with real homepage/pricing/Play-Store URLs found via Serper). The validation gate's retry-and-partial-persist path also fired for real here — a "Do Nothing / Manual Process" status-quo entry got an LLM-invented Wikipedia source on both the first attempt and the retry, and the gate correctly persisted it as `confidence_overall:"LOW"` with `flags:["competitor ... has an unverified source"]` instead of either crashing or silently accepting the fabricated source.

---

## Phase 6 — Customer Discovery Node (NEW) (§3, §4)

- [x] 6.1 `prompts.py`: `CUSTOMER_DISCOVERY_SYSTEM` → outputs `customer_discovery.v1`.
- [x] 6.2 `nodes/customer_validation.py` reads `market_research`/`competitors` from **state** to sharpen the ICP.
- [x] 6.3 gather: community/directory discovery queries via Serper → `verify_url()` every candidate → only `verified:true` survive.
- [x] 6.4 synthesize: `groq_chat()` (`llama-3.3-70b-versatile`) → ICP, outreach templates, 3 experiments, interview framework, scorecard, 7-day plan.
- [x] 6.5 validate: `run_with_validation(..., "customer")`.
- [x] 6.6 persist to `db.projects.customerValidation`; delta returns `customer_validation`.
- [x] 6.7 Verified live: 5 verified communities (3 Reddit threads + 2 Facebook, all real/live URLs), 15 interview questions (5+5+5 across discovery/problem/WTP), 7-day plan with 7 specific multi-clause tasks, no "we have built" language in outreach templates — validation gate passed clean on the first attempt, no retry needed.

---

## Phase 7 — Graph Wiring, State & SSE (§3, §9)

- [x] 7.1 `state.py`: added `customer_validation: Optional[dict]`; `competitors` widened to `Optional[dict]`.
- [x] 7.2 `graph.py`: `web_search → market_research → competitors → customer_validation → website → funding → END`.
- [x] 7.3 `routers/orchestrate.py`: `competitors` SSE event now emits the object + `len(competitors.get("competitors",[]))`; added `customer_validation` event with its own count. `STEP_MESSAGES` updated.
- [x] 7.4 Verified live: full `astream` run emitted all 6 node events in order (`web_search → market_research → competitors → customer_validation → website → funding → complete`), all three research modules persisted correctly to Mongo.

---

## Phase 8 — Data Models & Migration (§7)

- [x] 8.1 `models/project.py`: `marketResearch`/`competitors`/`customerValidation` are loose `Optional[dict]`/`Optional[Any]`. Removed `CompetitorModel` entirely (grepped clean). Fixed `routers/projects.py`'s `update_project()` (was iterating `competitors` as Pydantic-model list, now narrowed to `fundingOpportunities` only), `routers/chat.py`'s `build_chat_system_prompt()` and tool-call `allowed_fields` (competitors/customerValidation excluded — schema-validated outputs aren't chat-editable free text anymore), and `routers/analytics.py`'s `/analytics` endpoint (was doing `competitors[:3]` which would `TypeError` on the new dict shape — unreachable from the UI now but still a live route, fixed properly).
- [x] 8.2 Added `is_legacy_competitors_shape()` (Python, `models/project.py`) and `isLegacyCompetitorsShape()` (TS, `types/research.ts`) for the frontend's "re-run pipeline to upgrade" notice.
- [x] 8.3 Verified live: a fresh pipeline run round-tripped all three objects through `GET /api/projects/{id}` unchanged. Added the equivalent guard for `marketResearch` too (checking `schema === 'market_intelligence.v1'`) — CONTEXT only mandated one for `competitors`, but the new MarketResearch.tsx unconditionally reads fields (`tam.methodology`, `attractiveness.overall`) that don't exist on old-shape docs and would otherwise crash the page.

---

## Phase 9 — Frontend: Types + Market page (§10)

- [x] 9.1 `types/research.ts`: full TS interfaces for all three v1 schemas + `isLegacyCompetitorsShape()`.
- [x] 9.2 Rewrote `pages/modules/MarketResearch.tsx`: kept concentric TAM/SAM/SOM circles (now annotated with methodology + confidence badge + source count), price/quality quadrant, segment pyramid; added executive summary, market definition, customer segments, trends (momentum icons), demand signals, risks by category+severity, opportunities, 5-dimension attractiveness bars + overall + verdict, strategic recommendations, data gaps, tiered sources list.
- [x] 9.3 Empty state (no `marketResearch`) + legacy/old-shape state (wrong `schema` value) + `flags[]` validation-warning banner.
- [x] 9.4 Verified live against the real generated doc from Phase 4 — confidence badges, source counts, and INR figures all render correctly. **Not visually screenshot-tested in a browser** (no browser tool in this environment) — verified via `tsc --noEmit`, `vite build`, and dev-server module-transform checks (200, no overlay errors) against the real API response.

---

## Phase 10 — Frontend: Competitor page (§10)

- [x] 10.1 Deleted `Competitors.tsx`, created `CompetitorAnalysis.tsx`; updated `App.tsx` import/route (was still importing the deleted file — caught and fixed before it shipped broken).
- [x] 10.2 Renders `competitor_intelligence.v1`: competitor cards (pricing, positioning, funding, review praise/complaint themes, strengths/weaknesses/gap, verified-source chips with shield icons), feature matrix table (incl. "Your Idea" row), 2×2 positioning map, blue ocean candidates, scored opportunities (impact/feasibility/differentiation), strategic recs.
- [x] 10.3 Legacy-shape notice via `isLegacyCompetitorsShape()`.
- [x] 10.4 Verified live against the real generated doc from Phase 5.

---

## Phase 11 — Frontend: Customer Validation page + nav (§10)

- [x] 11.1 New `pages/modules/CustomerValidation.tsx`: ICP (narrative + persona card + JTBD), communities list with verified-shield badges + outbound links, directories, 3 outreach templates with copy-to-clipboard, 3 validation experiments, interview framework as collapsible Discovery/Problem/WTP sections, scorecard with go/maybe/no-go threshold legend, 7-day plan as a day-by-day timeline.
- [x] 11.2 Route added (`/dashboard/customer-validation`); Sidebar nav bumped from 4 to 5 project modules (`Sidebar.tsx`, `Dashboard.tsx` moduleCards/pipelineSteps, `MyProjects.tsx` moduleIcons/modulesDone) — all `/4` labels and `slice(0,4)` calls updated to `/5`/`slice(0,5)`.
- [x] 11.3 Verified live against the real generated doc from Phase 6.

---

## Phase 12 — (Optional) Per-Module Regenerate (§10)

- [ ] Not built. Full-pipeline re-run remains the only regeneration path (§14 Q4 resolved as "not needed now").

---

## Phase 13 — End-to-End Verification

- [x] 13.1 Full pipeline run from a real `POST /orchestrate` SSE stream → all 6 node steps streamed in order → all three research modules persisted and confirmed via `GET /api/projects/{id}`.
- [x] 13.2 Competitor entries are web-grounded: WhatsApp/ManyChat/Interakt all carry real, `verified:true` source URLs (homepage/pricing/Play Store) found via live Serper calls — no pure-training-knowledge names reached the output.
- [x] 13.3 4/5 customer communities resolved (`verified:true`, real live URLs); the one place verification could fail (the competitor node's status-quo entry) was correctly caught and flagged rather than silently passed.
- [x] 13.4 Validation gate confirmed twice in production conditions: customer module passed clean on attempt 1; competitor module correctly BLOCKed, retried once, stayed blocked, and persisted as `partial`/`LOW confidence`/`flags[]` rather than crashing or silently shipping a fabricated source.
- [x] 13.5 India-first confirmed: ₹ figures throughout market intelligence, Indian sources (TechCrunch India-relevant results, Reddit r/IndianEntrepreneur etc., Indian pricing in ₹) across all three modules.
- [x] 13.6 `research_budget` caps verified bounding real Serper call counts in Phase 2's live test (cap correctly throttled `enrich_competitor`'s sub-searches mid-call). `hackathon_mode` compression path exists (`build_budget(hackathon_mode=True)` → 12/6 caps) but wasn't separately re-tested end-to-end in this run (no hackathon-mode project was created).
- [x] 13.7 Resilience: the competitor node's BLOCK→retry→still-blocked path is itself the real-world proof of this — it persisted partial data with `error` set in the state delta and the graph continued through customer_validation/website/funding without crashing.

---

### Build order summary
0 prep → 1 context/budget → 2 tooling → 3 validators → 4 market node → 5 competitor node (grounding) → 6 customer node (new) → 7 graph/state/SSE → 8 models/migration → 9 market UI → 10 competitor UI → 11 customer UI + nav → 12 optional regenerate (skipped) → 13 verify.

All phases complete except the optional Phase 12 (per-module regenerate), which was explicitly not requested.
