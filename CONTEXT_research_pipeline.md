# CONTEXT.md — WayMaker Research Pipeline v2 (3 Intelligence Agents)

> Build context for upgrading the existing **2-module** AI research pipeline to **3 modules** that match the WayMaker agent specs:
> - **Market Intelligence** (`waymaker.market_intelligence.v1`) — replaces the current basic market_research output
> - **Competitive Intelligence** (`waymaker.competitor_intelligence.v1`) — replaces the current 5-competitor output, now web-grounded
> - **Customer Access & Validation** (`waymaker.customer_discovery.v1`) — **new third module**
>
> The three uploaded agent spec documents are the **authoritative system-prompt + output-schema source**. This file is how they get wired into the existing stack. Companion `TODO.md` is the ordered execution plan and references sections here ("see §5").
>
> **Core principle: preserve the working harness** (LangGraph graph + SSE streaming + per-node Mongo write + state-delta returns + `reduce_errors`). We change node internals, output schemas, the node count (2→3), and the frontend views — not the harness.

---

## 1. Goal & Scope

1. **Upgrade** `market_research_node` and `competitors_node` so they emit the rich v1 schemas instead of the current free-form dicts, and **ground the competitor node in live Serper data** (it currently uses Groq training knowledge only — the flagged accuracy gap).
2. **Add** a `customer_validation_node` that consumes the market + competitor outputs (per the spec dependency) and emits `customer_discovery.v1`.
3. **Rewrite the two frontend module pages** to render the richer schemas, and **add a third page** for customer validation.
4. Keep everything else — the graph wiring style, SSE event-per-node, write-to-Mongo-inside-node, React Query reads from the persisted doc, the error reducer — intact.

Out of scope: the roadmap agent (referenced by the specs but not provided); `website_node` / `funding_node` (unchanged, they just keep their slots).

---

## 2. Current State (the baseline we're replacing)

**Pipeline** (`backend/agents/graph.py`), one run per project, triggered from the Dashboard "Run AI Pipeline" button via SSE:

```
START → web_search_node → market_research_node → competitors_node → website_node → funding_node → END
```

- `web_search_node` (`nodes/web_search.py`) → Serper `fetch_real_world_context(idea + industry)` → writes markdown to `state["web_search_context"]`.
- `market_research_node` (`nodes/market_research.py`) → injects `web_search_context` into the Groq user message → grounded TAM/SAM/SOM. **Output:** free-form `dict` `{tam, sam, som, positioning:{quadrant[], pyramid[]}, landscape[], keyOpportunity}` (untyped, `Optional[dict]`).
- `competitors_node` (`nodes/competitors.py`) → uses only `idea/industry/target_audience/location`, asks Groq (Llama 3.3 70B) for 5 competitors **from training knowledge — no web grounding**. Runs after market research purely for rate-limit ordering. **Output:** `List[dict]` of exactly 5 `{name, strengths[], weaknesses[], gap}`, typed via `CompetitorModel`.

**Per-node mechanics (identical pattern, to be preserved):**
1. Build a user message from project fields (+ web context for market).
2. `groq_chat()` with a strict-JSON system prompt (`MARKET_RESEARCH_SYSTEM` / `COMPETITORS_SYSTEM` in `prompts.py`).
3. `extract_json()` strips fences → `json.loads()`.
4. Write result directly to Mongo (`db.projects.update_one`) **inside the node** (so a mid-pipeline refresh shows partial data).
5. Return a state delta: the data field, `current_step`, appended `completed_steps`. Exceptions → state-level `error` via the `reduce_errors` reducer in `state.py` (graph never crashes).

**SSE** (`routers/orchestrate.py`) wraps `orchestrator.astream(...)`, emits one event per node:
- `{"step":"market_research","data":{...}}`, `{"step":"competitors","data":[...],"count":5}`.
- Frontend `useOrchestrate` reads `data.step`/`data.message` for the progress UI only. **The actual module data is NOT consumed from SSE** — `MarketResearch.tsx`/`Competitors.tsx` call `useProject()` (React Query) and read `project.marketResearch`/`project.competitors` from the persisted Mongo doc after the run.

**Frontend (read-only):** `pages/modules/MarketResearch.tsx` (concentric TAM/SAM/SOM circles + 3 stat cards + price/quality quadrant from `positioning.quadrant` + segment pyramid from `positioning.pyramid` + landscape table + Key Opportunity callout). `pages/modules/Competitors.tsx` (5 cards, strengths/weaknesses/gap, rotating accent colors). No edit/regenerate — only re-running the whole pipeline regenerates.

**Confirmed stack:** FastAPI + LangGraph + Groq (Llama 3.3 70B) + **Serper** (web search) + MongoDB; SSE via `astream`. Frontend: React + **TypeScript (.tsx)** + **React Query** + (existing design system). *Note for assumptions: this stack uses Serper, not Tavily; SSE + React Query, not polling.*

---

## 3. Target State

**New pipeline** (customer_validation inserted after competitors — it depends on both prior outputs):

```
START → web_search_node → market_research_node → competitors_node → customer_validation_node → website_node → funding_node → END
```

| Node | Was | Becomes |
|---|---|---|
| `market_research_node` | basic dict | **Market Intelligence agent** → `market_intelligence.v1` |
| `competitors_node` | 5 dicts, no web | **Competitive Intelligence agent** → `competitor_intelligence.v1`, **Serper-grounded** |
| `customer_validation_node` | — | **NEW** Customer Discovery agent → `customer_discovery.v1`, consumes market + competitor state |
| `web_search_node`, `website_node`, `funding_node` | unchanged | unchanged (keep slots) |

Every node keeps the 5-step mechanic from §2, with the gather phase expanded (see §4).

---

## 4. The Upgraded Node Pattern (the key change)

Each research node becomes **gather → synthesize → validate → persist → delta**, an expansion of the existing single-call pattern:

1. **gather()** — deterministic Serper calls in code (bounded by `research_budget`, §6). This is where the spec's "RESEARCH PROCESS" steps live:
   - *Market:* reuse `web_search_context` + a few targeted queries (segment / funding / trend signals).
   - *Competitor:* run the spec's 15–20 discovery queries → dedupe candidates by domain → enrich top ~8 (homepage / pricing / Tracxn / Play Store via `serper_search_structured`) → review-mining searches per competitor. **This closes the no-grounding gap.**
   - *Customer:* run community / directory discovery queries → **verify each candidate URL exists in code** (httpx HEAD/GET or Serper resolve) so `verified:true` is real, not LLM-claimed → assemble verified communities + directories. Pull `market_intelligence` + `competitor_intelligence` from **state** to sharpen the ICP.
2. **synthesize()** — one `groq_chat()` call with the agent's system prompt (the uploaded spec text) + the gathered context as the user message. Groq's job is synthesis into the strict schema, **not** browsing.
3. **validate()** — run the schema's BLOCK/WARN rules (§8). On BLOCK, retry synthesize once with a corrective note; if still blocked, persist `partial` + set `error`.
4. **persist()** — `extract_json()` → `json.loads()` → `db.projects.update_one` inside the node (preserved).
5. **delta** — return data field + `current_step` + appended `completed_steps`; exceptions → `reduce_errors` (preserved).

> Rationale: this matches your existing `web_search → market_research` split (gather in code, synthesize with Groq) and avoids a Groq tool-calling loop. The heavy spec processes become deterministic Python; Groq only shapes the JSON.

---

## 5. Module Layout

Adapt to the actual repo; keep existing files where they already exist.

```
backend/agents/
├── graph.py                      # add customer_validation_node to the chain (§3)
├── state.py                      # + customer_validation field; reduce_errors preserved
├── prompts.py                    # REPLACE market/competitor system prompts with the v1 spec text;
│                                 #   ADD CUSTOMER_DISCOVERY_SYSTEM (the 3rd spec verbatim)
├── context.py                    # NEW: build_research_context() → SharedResearchContext (§6)
├── budget.py                     # NEW: ResearchBudget caps + a call-counter guard
├── validators.py                # NEW: validate_module_output(schema, data) → BLOCK/WARN (§8)
├── tools/
│   ├── serper.py                 # existing fetch_real_world_context + serper_search_structured;
│   │                             #   ADD enrich_competitor(name), verify_url(url), trends_signal(term)
│   └── ...
└── nodes/
    ├── web_search.py             # unchanged
    ├── market_research.py        # → Market Intelligence (gather→synthesize→validate→persist)
    ├── competitors.py            # → Competitive Intelligence (now Serper-grounded)
    ├── customer_validation.py    # NEW node
    ├── website.py / funding.py   # unchanged

backend/
├── routers/orchestrate.py        # add customer_validation SSE event; keep astream wrapper
└── models/project.py             # field/shape changes + migration (§7)

frontend/src/
├── types/research.ts             # NEW: TS interfaces for the 3 v1 schemas
└── pages/modules/
    ├── MarketResearch.tsx        # rewrite for market_intelligence.v1
    ├── CompetitorAnalysis.tsx    # rewrite (rename from Competitors.tsx) for competitor_intelligence.v1
    └── CustomerValidation.tsx    # NEW page for customer_discovery.v1
```

---

## 6. Shared Research Context & Budget

The specs expect a `SharedResearchContext` (pillars, business_brief, goal_profile, geography=IN default, hackathon_mode, research_budget, run_metadata). Implement `build_research_context(project)` in `context.py`:

- **Pillar mapping:** the current project doc has `idea / industry / target_audience / location`. Map these into the five-pillar shape the agents expect (`problem / customer / solution / market / business_model`), filling what's available and leaving the rest empty — the agents already degrade gracefully via their `[UNKNOWN]` / `data_gaps` handling. **If a richer intake exists in the project, wire those fields in here** (see Open Questions).
- **geography:** default `"IN"` (drives India-first + INR in all three agents).
- **hackathon_mode:** pass through from the project; the agent prompts compress output when true.
- **research_budget** (`budget.py`): `{max_search_queries, max_url_fetches, max_tokens}`. The gather phase must check the counter before each Serper call and stop expanding once a cap is hit (competitor + customer nodes now make many calls — this bounds cost/latency). Defaults e.g. `max_search_queries=25`, `max_url_fetches=12` per node; tighten under hackathon_mode.

Inject the built context into every node's user message (alongside the gathered Serper results).

---

## 7. Data Layer & Models

MongoDB, same `db.projects` doc. Field-level changes:

| Field | Was | Becomes |
|---|---|---|
| `marketResearch` | basic dict, `Optional[dict]` | full `market_intelligence.v1` object, **keep `Optional[dict]`** |
| `competitors` | `List[dict]` (5), `CompetitorModel` | full `competitor_intelligence.v1` object (has `competitors[]` inside) — **shape change** |
| `customerValidation` | — | **NEW** `customer_discovery.v1` object, `Optional[dict]` |

- **Pydantic** (`models/project.py`): keep all three as **loose `Optional[dict]`** in `ProjectUpdate`/`ProjectOut` (the schemas are deeply nested and LLM-shaped — same reasoning that kept market untyped). **Drop the strict `CompetitorModel`** (superseded). Enforce structure at runtime via `validators.py` (§8), not Pydantic.
- **Migration:** the new `competitors` object shape is incompatible with the old `List[dict]`. Old project docs won't render in the new frontend — acceptable, since regeneration = re-run the pipeline. Add a frontend guard: if `competitors` is an array (legacy), show a "re-run pipeline to upgrade" notice.
- Keep the per-node Mongo write; add the `customerValidation` write in the new node.

---

## 8. Validation Gate

Implement the uploaded **OUTPUT VALIDATION RULES** as `validate_module_output(schema_name, data) -> {ok, blocks[], warns[]}`, called in each node's validate() step. Enforce (from the spec):

- **Market:** BLOCK if `market_attractiveness.overall` absent; BLOCK if `tam.source_urls` empty AND methodology `top_down`; BLOCK if disclaimer missing/modified; WARN if `confidence_overall=LOW` and `data_gaps` empty.
- **Competitor:** BLOCK if `competitors` < 3; BLOCK if any competitor `sources` empty; BLOCK if any competitor source `verified=false` (re-run URL check in gather); BLOCK if `opportunities` < 2; BLOCK if disclaimer missing/modified.
- **Customer:** BLOCK if `communities` < 5; drop any community with `verified=false` and recount (BLOCK if then < 5); BLOCK if any 7-day task description ≤ 10 words; BLOCK if `discovery_questions` < 15; BLOCK if disclaimer missing/modified; WARN if an outreach body contains "we have built" language (flag for human review).

Policy: on BLOCK → retry synthesize once with the block list appended as a corrective instruction; if still blocked, persist with `confidence:"LOW"`/partial flag and set the state `error` (graph continues). WARN → store on the doc as `flags[]`, never block.

---

## 9. SSE & State

- `state.py`: add `customer_validation` to the state schema and accumulated fields; keep `reduce_errors`. Market + competitor outputs must remain in state so `customer_validation_node` can read them.
- `routers/orchestrate.py`: keep the `astream` wrapper and one-event-per-node emission. Update the competitor event (no longer a flat list of 5 — emit `{"step":"competitors","data":{...v1...}}`) and **add** `{"step":"customer_validation","data":{...v1...}}`. The frontend progress UI keeps reading `step`/`message`; rich data is still read from Mongo via React Query (preserved pattern).

---

## 10. Frontend

TypeScript + React Query, reading from the persisted doc via `useProject()` (preserve this — do not consume rich data from SSE).

- `types/research.ts`: TS interfaces mirroring the three v1 schemas.
- **`MarketResearch.tsx` (rewrite):** keep the strong existing visuals where they still map — concentric TAM/SAM/SOM circles (now show `methodology` + `confidence` + source count per ring), the price/quality quadrant, the segment pyramid — and add: executive summary, market definition (primary/secondary/adjacent + rationale), customer segments, trends (with momentum arrows), demand signals, risks grouped by the four categories with severity, opportunities, the five-dimension **attractiveness scores** (radar or bars) + overall + verdict, strategic recommendations, data gaps, and a tiered sources list.
- **`CompetitorAnalysis.tsx` (rewrite, renamed from `Competitors.tsx`):** competitor cards (now with pricing, positioning, funding, and review praise/complaint themes — keep the strengths/weaknesses/gap feel), a **feature matrix** table (competitors × features incl. "Your Idea", parity/gap/differentiation), a **2×2 positioning map** (use the schema's chosen axes), blue-ocean candidates, scored opportunities (impact/feasibility/differentiation), and strategic recommendations.
- **`CustomerValidation.tsx` (new):** ICP (3 formats), **communities** list (name, platform, size, relevance, a verified badge, outbound link), directories, the **3 outreach templates** (copy-to-clipboard), **3 validation experiments**, the **interview framework** (collapsible Discovery / Problem / WTP sections), the **scorecard** (per-interview fields + threshold legend), and the **7-day plan** rendered as a day-by-day timeline/checklist.
- **Dashboard:** the research module list goes 2 → 3; add nav + route for Customer Validation. Match the existing design system (don't introduce new styling).
- **Optional** (you flagged the current views lack regenerate): per-module regenerate. The current pipeline only regenerates by full re-run; add optional `POST /projects/{id}/regenerate/{module}` endpoints that invoke a single node with the existing context and re-persist (Phase 12). Not required for parity.

---

## 11. Tooling, Cost & the Google Trends Gap

- **Serper** stays the search/fetch provider (consistent with the existing harness — *not* Tavily). Extend `tools/serper.py` with `enrich_competitor(name)`, `verify_url(url)`, and a search-based `trends_signal(term)`.
- **Google Trends:** the specs reference a `google_trends` tool, but Serper has no trends endpoint. Default: derive demand signals from **Serper search/news volume proxies** behind `trends_signal()`. Optional: add a `pytrends` adapter behind the same interface (unofficial, rate-limited) or SerpApi Google Trends (paid). Pick during build (Open Questions). Until chosen, demand signals come from search proxies and are labeled accordingly.
- **Cost/latency:** competitor + customer nodes now make many Serper calls. The `research_budget` counter (§6) caps them; gather phases must stop at the cap and let `data_gaps` record what wasn't covered.

---

## 12. Migration / Cutover Plan

1. Land the new context / budget / validators / tools modules (no behavior change yet).
2. Upgrade `market_research_node`, then `competitors_node` (add grounding), verifying each in isolation against the validation gate.
3. Add `customer_validation_node`; wire it into `graph.py` after competitors; add state + SSE.
4. Update `models/project.py` (loose dicts, drop `CompetitorModel`); add the legacy-shape guard.
5. Rewrite the two frontend pages, add the third, bump the Dashboard module list and routes.
6. Replace the old system prompts in `prompts.py` with the three spec texts.
7. Full pipeline run on a fresh project; confirm all three modules persist and render.

---

## 13. Locked Assumptions

- Same project + stack as described: FastAPI + LangGraph + Groq (Llama 3.3 70B) + Serper + MongoDB + SSE; React + TypeScript + React Query.
- The three uploaded specs are the **verbatim system prompts + output schemas**; this doc is only the harness around them.
- Heavy research runs **deterministically in the node (Serper)**, then **one Groq synthesis call** per node — no Groq tool-calling loop.
- Preserve: LangGraph graph, SSE per-node events, Mongo-write-inside-node, state deltas, `reduce_errors`, frontend reads from Mongo via React Query.
- `customer_validation_node` runs after market + competitor and reads their outputs from state.
- geography default `IN`; outputs stored as loose dicts validated at runtime.

---

## 14. Open Questions (resolve during build)

1. **Pillars source:** does the project have a richer intake than `idea/industry/target_audience/location`? If yes, map those real pillar fields in `build_research_context()`; if no, confirm graceful-degradation mapping is acceptable.
2. **Google Trends:** Serper search proxies (default), `pytrends`, or SerpApi — which trends source?
3. **Groq JSON reliability:** the v1 schemas are large. If Llama 3.3 70B truncates/malforms JSON, do we (a) generate the JSON in sections and merge, or (b) move these nodes to a larger model? (Risk noted; default = sectioned generation behind `extract_json()`.)
4. **Per-module regenerate** (Phase 12): wanted now for parity with Marketing Kit, or leave full-pipeline re-run as the only path?
5. **Competitor field shape:** keep the Mongo field name `competitors` holding the new object (minimal churn), or rename to `competitorAnalysis` for clarity?
