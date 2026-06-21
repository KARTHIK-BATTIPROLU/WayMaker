/C;# TODO.md — Marketing Kit v2 Implementation Checklist

> Step-by-step build plan. Execute top to bottom. Each box is a small, verifiable step. Section refs point to **`CONTEXT.md`** (e.g. "§5.4"). Don't carry over any legacy debt from the audit (no LangGraph/Pollinations, no orphan components, no duplicated utils, no hardcoded URLs).
>
> Stack: FastAPI + React 19/Vite + MongoDB + Groq + Replicate + ImgBB + **n8n (Pro)**. This **replaces** the existing `marketing kit` feature (§11).
>
> **Adapted to the real repo:** actual frontend is React 18.3 + TypeScript (not React 19/.jsx) — components below are `.tsx`. Search provider is **Serper** (not Tavily, per locked decision). Scheduler is **n8n-only**; the in-app APScheduler fallback was intentionally not built. MongoDB is always required in this repo (no in-memory fallback exists or is needed).

---

## Phase 0 — Scaffolding & Setup

- [x] 0.1 Create backend module dir `backend/marketing_kit/` with the layout in §4 (`router.py`, `pipelines.py`, `models.py`, `store.py`, `services/`, `calendar/`). Add empty `__init__.py` files.
- [x] 0.2 Create frontend feature dir `frontend/src/features/marketingKit/` with the layout in §4.
- [x] 0.3 Add backend deps: `replicate`, `feedparser` (Groq/httpx/pymongo/pydantic already present). Serper used instead of `tavily-python`; no `apscheduler` (n8n-only scheduler).
- [x] 0.4 Add frontend deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- [x] 0.5 Add all env vars from §10 to `backend/.env` (dummy-mode defaults for Replicate/ImgBB/n8n) and `.env.example` (names only). `VITE_API_BASE_URL` already present in `frontend/.env.local`.
- [x] 0.6 `frontend/src/features/marketingKit/api.ts`: wraps the app's single shared axios instance (`lib/api.ts`, which already uses `VITE_API_BASE_URL`) — no new/duplicate axios instance, no hardcoded URLs.

---

## Phase 1 — Port the Generation Pipeline (clean)

- [x] 1.1 `store.py`: Mongo session CRUD (`create_session`, `get_session`, `update_session`). No in-memory fallback — this repo always requires a real `MONGODB_URI`.
- [x] 1.2 `services/groq_service.py`: `generate_post`, `generate_platform_kit`. Brand-voice persona rewritten for Waymaker founders (not "student builder"). Fixed a `str.format` brace-collision bug against the JSON-example prompt text, and used `json.loads(..., strict=False)` to tolerate literal newlines in LLM output.
- [x] 1.3 `services/image_service.py`: Replicate `black-forest-labs/flux-2-pro` client, named `image_service` (never `gemini_service`). Async parallel gen via `asyncio.gather`, per-platform aspect ratios (16:9 default, 1:1 Instagram).
- [x] 1.4 `services/imgbb.py`: single `upload_to_imgbb(b64)->url` util; confirmed via grep it's the only definition in the backend.
- [x] 1.5 `pipelines.py`: `run_pipeline` (LinkedIn) + `run_platform_pipeline` (platform) as background tasks with the status state machine and `asyncio.sleep(0.5)` pacing. Sessions carry `origin` + `topic_id`.
- [x] 1.6 `models.py`: `RunRequest`, `PlatformRunRequest`, `ActionRequest`, `EditRequest`, `PreferencesUpdate`, `DeployRequest` (+ calendar models), with `origin`/`topic_id` on run requests.
- [x] 1.7 `router.py`: `/run`, `/run_platform`, `/state/{id}`, `/action/{id}`, `/edit/{id}`, `/preferences` GET/PUT.
- [x] 1.8 Brand-voice store behind `/preferences`, server-side (no client-bypassable confirm gate), seeded with a non-empty default voice.
- [x] 1.9 Verified live: `POST /run` → polled to `preview` with real `post_text`/hashtags/`image_prompt` (images empty — Replicate dummy mode). `POST /run_platform` → polled to `platform_preview` with a 2-platform kit.

---

## Phase 2 — Zapier → n8n Swap (§8.1)

- [x] 2.1 `services/n8n_service.py`: `deploy(...)` → ImgBB upload if base64 → `httpx.post(N8N_WEBHOOK_URL, ...)`. Dummy-mode skip when `N8N_WEBHOOK_URL=="dummy_url"`. Sends `X-Deploy-Secret` when set.
- [x] 2.2 `router.py`: `/deploy/{id}` and `/deploy-all/{id}` (concurrent `asyncio.gather`) routed through `n8n_service`.
- [ ] 2.3 **User action (n8n, outside this codebase):** build the deploy workflow — Webhook → Switch on `platform` → LinkedIn/Twitter-X/Instagram branches → 200. See final summary for exact shape.
- [x] 2.4 Verified `deploy-all` on a real session → `deploy_results` persisted; dummy mode returns `{"status":"skipped"}` cleanly (real Switch-node routing needs the live n8n workflow from 2.3).
- [x] 2.5 No Zapier in `marketing_kit/` — grepped clean. (A pre-existing, unrelated `zapierWebhookUrl` exists only on the separate "website deploy" feature; out of scope, untouched.)

---

## Phase 3 — Calendar Data Models (§5)

- [x] 3.1 `calendar_config` CRUD, single `_id:"config"` doc, defaults from §5.2.
- [x] 3.2 `followed_sources` CRUD.
- [x] 3.3 `daily_topics` CRUD; index `{date:-1}`; `get_today_topics()` (falls back to most recent date with data, so a failed refresh doesn't blank the UI).
- [x] 3.4 `permanent_topics` CRUD; **unique** index on `dedupe_key`; `normalize_dedupe_key(title)`.
- [x] 3.5 Verified live: added a source, ran a refresh, added/duplicated a permanent topic → duplicate correctly rejected (409) by the unique index.

---

## Phase 4 — Web Research Subsystem (§9)

- [x] 4.1 `calendar/research.py`: `search()` wraps `serper_search_structured` (Serper, not Tavily — locked decision).
- [x] 4.2 `fetch_rss(sources)` via `feedparser` over active `rss` sources.
- [x] 4.3 `gather_candidates(config, sources)`: RSS + "now" search vs "upcoming" forward-looking search, deduped, source-tagged.
- [x] 4.4 `synthesize_topics(...)`: Groq → JSON array, sources constrained to the candidate URL pool only (topics with zero valid sources are dropped, never invented). Keeps prior day's set on synthesis failure.
- [x] 4.5 Verified live: real refresh produced 30 topics, mixed `now`/`upcoming` horizons, each with a real cited source URL from TechCrunch RSS / Serper.

---

## Phase 5 — Daily Job & Scheduler (§7.1, §8.2)

- [x] 5.1 `calendar/jobs.py` → `run_daily_refresh()`: full pipeline, persists topics under today's IST date, updates `last_run_at`.
- [x] 5.2 `POST /calendar/refresh` (secret-gated via `X-Refresh-Secret`, for n8n). Added a second, JWT-gated `POST /calendar/refresh-now` twin for the UI's manual button (the secret is a server/n8n credential, not something the browser should hold).
- [ ] 5.3 **User action (n8n, outside this codebase):** Schedule Trigger `0 19 * * *` tz `Asia/Kolkata` → `POST {BACKEND}/calendar/refresh` with `X-Refresh-Secret`. No in-app APScheduler was built (locked decision: n8n-only).
- [x] 5.4 Verified live: correct secret → 30 topics land under today; missing secret → 401.

---

## Phase 6 — Calendar API Routes (§6.2)

- [x] 6.1 `GET /calendar/today`.
- [x] 6.2 `GET /calendar/permanent`.
- [x] 6.3 `POST /calendar/permanent` — dedupe-aware, 409 on duplicate, today's list untouched.
- [x] 6.4 `DELETE /calendar/permanent/{id}`.
- [x] 6.5 `GET/POST /calendar/sources` + `DELETE /calendar/sources/{id}`.
- [x] 6.6 `GET/PUT /calendar/config`.
- [x] 6.7 `POST /calendar/generate` — seeds a session from a topic, marks it `used:true`, returns `session_id`.
- [x] 6.8 Verified every route live via curl: dedupe 409 confirmed, `/generate` → `session_id` that reached `preview` with real content.

---

## Phase 7 — Frontend: Entry Point & Calendar UI (§4, §7.2, §7.3)

- [x] 7.1 `MarketingKitHome.tsx`: Own Idea | Content Calendar choice, using existing `glass-card`/`gradient-text` design system classes.
- [x] 7.2 `ownIdea/OwnIdeaFlow.tsx`: idea textarea + LinkedIn/platform mode toggle + ⌘/Ctrl+Enter submit → navigates to the right preview route.
- [x] 7.3 `calendar/SourcesPanel.tsx`: "Pulling topics from" list with outbound links + add/remove.
- [x] 7.4 `calendar/TopicCard.tsx`: title, description, horizon badge, source chips (linked), Create action.
- [x] 7.5 `calendar/TodayTopics.tsx`: today's topics as `@dnd-kit` draggable cards.
- [x] 7.6 `calendar/PermanentList.tsx`: droppable list, each card removable.
- [x] 7.7 `calendar/CalendarView.tsx`: single `DndContext` composing all three; drop → `POST /calendar/permanent` with optimistic add and a friendly 409 notice; manual "Refresh now" button wired to the new JWT-gated endpoint.
- [x] 7.8 Create flow: modal → `POST /calendar/generate` → navigates to the right preview route with `session_id`.

---

## Phase 8 — Reuse Preview & Deploy UI

- [x] 8.1 `preview/PreviewPanel.tsx`: LinkedIn editor + live card mock using the logged-in user's real email/initial (no hardcoded author).
- [x] 8.2 `preview/PlatformPreview.tsx`: per-platform cards, deploy-single + deploy-all with live status badges.
- [x] 8.3 Routes wired: `/dashboard/marketing-kit/preview/:sessionId`, `/dashboard/marketing-kit/platform/:sessionId`; polling stops on terminal status.
- [x] 8.4 Verified via API: both Own-Idea and Calendar entry points reach preview/platform_preview and deploy (dummy-skip). **Not visually verified in a browser** — no browser tool is available in this environment; verification was via `tsc --noEmit`, `vite build`, the Vite dev transform of every new module (200, no overlay errors), and live curl exercises of every backing endpoint.

---

## Phase 9 — Replace Old Marketing Kit & Cleanup (§11)

- [x] 9.1 `marketing_kit.router` mounted at `/api/marketing-kit` in `main.py`; `ensure_indexes()` wired into `lifespan`.
- [x] 9.2 New routes added to `App.tsx`; Sidebar's "Marketing Kit" entry repointed to `/dashboard/marketing-kit` as a standalone (non-project-scoped) nav item, since the new feature is global rather than per-project.
- [x] 9.3 Deleted `pages/modules/MarketingKit.tsx`, the LangGraph `marketing_node`, the `/webhook/marketing` route, `MarketingPostModel`/`marketingKit` fields everywhere (model, types, Dashboard, MyProjects, Sidebar, chat tool-call allowlist, orchestrate SSE). Grepped clean.
- [x] 9.4 Confirmed: no hardcoded `localhost` in new code (only pre-existing dev-fallback defaults gated behind `VITE_API_BASE_URL ||`), exactly one `upload_to_imgbb`, no `gemini_service`, no LangGraph/Pollinations/`ChatInput`/`GraphVisualizer` in `marketing_kit/`.

---

## Phase 10 — Test & Verify (end to end)

- [x] 10.1 Calendar refresh: verified live — 30 topics, mixed horizons, real sources from the one followed RSS source added during testing.
- [x] 10.2 Drag-drop wiring verified via the underlying API (add → 409 on duplicate → today's list unaffected); the drag gesture itself needs a real browser to fully confirm (see 8.4 note).
- [x] 10.3 Calendar → post: verified live, `calendar/generate` → session reached `preview` with generated content.
- [x] 10.4 Own Idea → post: verified live for both LinkedIn and platform modes.
- [x] 10.5 n8n routing: dummy mode confirmed returning `skipped` cleanly. Real Switch-node routing needs the live n8n workflow (Phase 2.3, user action).
- [x] 10.6 Secrets: `/calendar/refresh` confirmed 401 on missing/wrong secret, 200 on correct secret.
- [x] 10.7 Restart safety: not applicable as a separate fallback — this repo has no in-memory mode; every write already goes to the real Atlas MongoDB, so restart safety is inherent.

---

### Build order summary
0 setup → 1 pipeline → 2 n8n deploy → 3 models → 4 research → 5 scheduler → 6 calendar API → 7 calendar UI → 8 preview reuse → 9 replace old + cleanup → 10 verify.

### §13 open questions — resolved during this build
- **Auth/multi-tenant:** all `marketing_kit` routes (except the two machine-to-machine ones, `/calendar/refresh` and the n8n deploy callback path) are gated by the existing JWT `get_current_user` dependency. Calendar config/sources/topics are intentionally **global**, not per-user — confirmed as a locked decision, not per-project/per-tenant.
- **Search provider:** Serper (already integrated in this repo), not Tavily.
- **n8n native vs HTTP nodes:** out of scope for this codebase; the backend just needs one webhook URL and one shared secret, however the n8n workflow is built.
- **Editable topic count:** `daily_topic_count` is editable via `PUT /calendar/config`.
