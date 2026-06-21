# CONTEXT.md — Marketing Kit v2 (Social Post Flow + Content Calendar, n8n)

> Build context for **replacing the existing `marketing kit` feature** in the target project with a new self-contained module. Same stack as the audited `Marketing-Auto` app: **FastAPI + React 19/Vite + MongoDB + Groq + Replicate + ImgBB**, with deploys moved from **Zapier → n8n (Pro)** and a new **Content Calendar** topic source added.
>
> This document is the single source of truth. The companion `TODO.md` is the step-by-step execution plan and references the sections here (e.g. "see CONTEXT §5").

---

## 1. Goal & Scope

Replace the target project's current **Marketing Kit** feature entirely with a module that:

1. **Ports the proven Social Post Flow pipeline** from `Marketing-Auto` (idea → Groq caption/hashtags → Replicate image(s) → human preview/edit/regenerate → deploy), as a clean module — *not* a copy of the legacy debt.
2. **Swaps Zapier for n8n** on every deploy path. Backend fires one n8n webhook; n8n routes per platform.
3. **Adds a Content Calendar**: a daily 19:00 IST job that web-researches the user's domain for (a) forward-looking topics on a **6–12 month horizon** and (b) **current updates as of that evening**, attributes each topic to the **source it came from**, and surfaces the **followed channels/sources** so provenance is visible. Produces **30 topics/day** plus an **unlimited Permanent list**; topics **drag-and-drop** from today → Permanent.
4. **Gives content creation two entry points**: **Own Idea** (user writes a description) and **Content Calendar** (user picks a topic). Both feed the *same* generation + image + n8n-deploy pipeline.

Keep the user-facing name **"Marketing Kit"** for the new feature (it replaces the old one under the same nav entry).

---

## 2. What's Reused vs Net-New

| Area | Source | Action |
|---|---|---|
| Pipeline pattern (kick job → poll status → preview → deploy) | `Marketing-Auto/backend/main.py` `run_pipeline` / `run_platform_pipeline` | **Reuse pattern**, re-implement as a clean module |
| LLM copy/hashtags/kit JSON | `services/groq_service.py` | **Reuse**, keep `trust_env=False` proxy fix, rewrite persona prompts |
| Image generation (Replicate FLUX-2-pro) | `services/gemini_service.py` (misnamed) | **Reuse**, **rename → `image_service.py`** |
| ImgBB base64→URL upload | `_upload_to_imgbb` (duplicated ×4) | **Reuse as ONE shared util** |
| Session/job store (Mongo + in-memory fallback) | `db/mongo.py` | **Reuse**, add indexes for calendar collections |
| Preview/edit/regenerate UI | `PreviewPanel.jsx`, `PlatformPreview.jsx` | **Reuse**, centralize API base URL |
| Deploy transport | Zapier `*_WEBHOOK_URL` senders | **Replace with n8n** (single webhook + Switch) |
| Daily topic discovery | — | **NET-NEW** (web search + LLM synthesis + provenance) |
| Scheduler | none (BackgroundTasks only) | **NET-NEW** (n8n Schedule trigger → backend, or APScheduler) |
| Calendar data models | — | **NET-NEW** (config, sources, daily topics, permanent topics) |
| Calendar + sources UI, drag-drop | — | **NET-NEW** |
| LangGraph package, Pollinations node, `zapier_service`, `ChatInput`, `GraphVisualizer` | dead/orphaned in audit | **DO NOT port** |

---

## 3. Tech Stack (target = same as Marketing-Auto)

- **Backend:** Python 3.11, FastAPI + Uvicorn, `pymongo`, `httpx`, `pydantic`, `python-dotenv`, `groq`, `replicate`.
- **New backend deps:** `feedparser` (RSS from followed sources), a web-search provider SDK/HTTP — **Tavily recommended** (returns results *with source URLs*, ideal for the provenance requirement); `apscheduler` only if you choose the in-app scheduler over n8n.
- **Frontend:** React 19.2 + Vite 8, `react-router-dom` 7, `axios`, `lucide-react`. **New dep:** `@dnd-kit/core` (+ `@dnd-kit/sortable`) for drag-and-drop.
- **External services:** Groq (Llama 3.3 70B text), Replicate (`black-forest-labs/flux-2-pro` images), ImgBB (image hosting for webhook payloads), **n8n Pro** (deploy + optional daily trigger), Tavily (or chosen search API), MongoDB.

---

## 4. Architecture

**Pattern:** two-tier client–server, identical to the audited app. New work lives in a **self-contained module** so it can replace the old marketing kit cleanly.

### Suggested module layout (adapt paths to the target repo's conventions)

```
backend/
├── marketing_kit/                     # ← the whole new feature, mountable as one router
│   ├── router.py                      # all routes (§5) — APIRouter, mounted by the app
│   ├── pipelines.py                   # run_pipeline / run_platform_pipeline (background tasks)
│   ├── models.py                      # pydantic request/response models
│   ├── services/
│   │   ├── groq_service.py            # copy / hashtags / platform-kit JSON
│   │   ├── image_service.py           # Replicate FLUX-2-pro (renamed from gemini_service)
│   │   ├── imgbb.py                   # single shared _upload_to_imgbb util
│   │   └── n8n_service.py             # deploy via n8n webhook (replaces all Zapier senders)
│   ├── calendar/
│   │   ├── research.py                # search + RSS + LLM synthesis → 30 topics w/ sources
│   │   ├── scheduler.py               # APScheduler hook OR no-op if using n8n schedule
│   │   └── jobs.py                    # the daily refresh job entrypoint (called by /refresh)
│   └── store.py                       # Mongo CRUD for sessions + calendar collections
└── (existing app: main.py mounts marketing_kit.router; OLD marketing kit removed)

frontend/src/features/marketingKit/    # ← the whole new feature UI
├── api.js                             # axios client using VITE_API_BASE_URL (NO hardcoded URLs)
├── MarketingKitHome.jsx               # entry: choose "Own Idea" | "Content Calendar"
├── ownIdea/OwnIdeaFlow.jsx            # existing textarea → /run or /run_platform
├── calendar/
│   ├── CalendarView.jsx               # layout: sources panel + today + permanent
│   ├── SourcesPanel.jsx               # shows followed channels (provenance/transparency)
│   ├── TodayTopics.jsx                # 30 draggable topic cards (horizon + source chips)
│   ├── PermanentList.jsx              # unlimited droppable list, removable cards
│   └── TopicCard.jsx                  # shared card (badge, source chips, "Create" action)
├── preview/PreviewPanel.jsx           # ported, centralized API base
└── preview/PlatformPreview.jsx        # ported, centralized API base
```

### How the pieces connect
- App mounts `marketing_kit.router`; the **old marketing kit routes/components are deleted** and the nav entry repointed (§11).
- Backend returns a `session_id` immediately; heavy work runs in a FastAPI `BackgroundTask`; the frontend **polls** `GET /state/{id}` (~1.2–1.5s) and renders by `status` — unchanged from the audited pattern.
- Both entry points converge on the same pipeline: **Own Idea** seeds `user_input` from the textarea; **Content Calendar** seeds it from the chosen topic (title + description) and tags the session with `origin:"calendar"` + `topic_id`.
- Deploy calls `n8n_service.deploy(...)` → POSTs to a single **n8n webhook**; n8n's **Switch** node routes on `platform`.
- The **daily job** is triggered by an **n8n Schedule node** (cron 19:00 `Asia/Kolkata`) hitting `POST /calendar/refresh` with a shared secret — or by in-app APScheduler if you prefer not to depend on n8n for timing.

---

## 5. Data Layer & Models

MongoDB, schemaless, same `db.marketing_auto` style. Add the collections below. Add indexes where noted (the audit had none).

### 5.1 Session documents (ported, lightly extended)

**LinkedIn pipeline session** — same fields as audit §4 (`_id`, `user_input`, `preferences`, `post_text`, `images[]`, `image_urls[]`, `hashtags[]`, `status`, `approved`, `action`, `edit_post_text`, `error`) **plus**:
- `origin`: `"own_idea" | "calendar"`
- `topic_id`: str | null (links back to the calendar topic if origin=calendar)

**Platform pipeline session** — same as audit §4 (`_id`, `user_input`, `target_platforms[]`, `marketing_kit[]`, `status`, `deploy_results`, `error`) **plus** `origin`, `topic_id`.
Drop the vestigial `preference_confirm_count`.

### 5.2 `calendar_config` (single document; key `_id:"config"`)
| Field | Type | Meaning |
|---|---|---|
| `domain` | str | the niche to research, e.g. "AI agents / LLM tooling" |
| `keywords` | list[str] | optional extra search seeds |
| `timezone` | str | default `"Asia/Kolkata"` |
| `daily_topic_count` | int | default `30` |
| `forward_horizon_months` | int | default `12` (the "6–12 months down the road" window) |
| `active` | bool | whether the daily job runs |
| `last_run_at` | datetime | last successful refresh |

> Single global config mirrors the app's single global `preferences.md`. If the target app is multi-user, key these per `user_id` instead (noted in TODO).

### 5.3 `followed_sources` (collection)
| Field | Type | Meaning |
|---|---|---|
| `_id` | str | source id |
| `name` | str | display name (shown in SourcesPanel) |
| `type` | str | `"rss" \| "website" \| "twitter" \| "youtube" \| "blog"` |
| `url` | str | RSS/feed URL or site/handle |
| `active` | bool | included in the daily pull |
These power both the research pass (RSS via `feedparser`, sites via search) **and** the transparency panel.

### 5.4 `daily_topics` (collection — refreshed each run, dated)
| Field | Type | Meaning |
|---|---|---|
| `_id` | str | topic id |
| `date` | str | `YYYY-MM-DD` (IST date of the run) |
| `title` | str | concise topic title |
| `description` | str | 1–2 sentence angle for the post |
| `horizon` | str | `"now"` (current update) \| `"upcoming"` (6–12mo) |
| `category` | str | optional grouping/tag |
| `sources` | list[{`name`,`url`}] | provenance — which source(s) this came from |
| `created_at` | datetime | |
| `used` | bool | whether a post was generated from it |
Index: `{date: -1}`. Query "today" = max date / today's IST date.

### 5.5 `permanent_topics` (collection — unlimited, persists)
Same shape as `daily_topics` plus:
| Field | Type | Meaning |
|---|---|---|
| `added_at` | datetime | when dragged in |
| `source_daily_topic_id` | str | provenance back to the daily topic |
| `dedupe_key` | str | normalized title hash — unique index to prevent dupes |
Index: unique on `dedupe_key`.

---

## 6. API Surface

All under the `marketing_kit` router. No auth in the audited app; if the target app has auth, gate these. The `/calendar/refresh` endpoint **must** be secret-protected (it's the n8n trigger).

### 6.1 Ported generation/deploy routes
| Method | Path | Purpose | Body | Response |
|---|---|---|---|---|
| POST | `/run` | Start LinkedIn pipeline | `{user_input, origin?, topic_id?}` | `{session_id}` |
| POST | `/run_platform` | Start platform pipeline | `{user_input, target_platforms[], origin?, topic_id?}` | `{session_id}` |
| GET | `/state/{session_id}` | Poll session doc | — | session doc · 404 |
| POST | `/action/{session_id}` | approve / regenerate_post / regenerate_images | `{action}` | updated doc |
| POST | `/edit/{session_id}` | Stage manual edit to `post_text` | `{post_text}` | `{status:"success"}` |
| POST | `/deploy/{session_id}` | Deploy ONE platform via n8n | `{platform}` | `{status, platform, response?}` |
| POST | `/deploy-all/{session_id}` | Deploy all kit platforms via n8n | — | `{status:"deployed", results}` |
| GET / PUT | `/preferences` | Read/overwrite brand-voice md | `{content}` | `{content}` / `{status:"updated"}` |

> Fix the audit's Instagram single-deploy gap: either generate an Instagram kit entry, or document that single `/deploy` Instagram reuses the Twitter post (as `/deploy-all` already does).

### 6.2 New Content Calendar routes
| Method | Path | Purpose | Body | Response |
|---|---|---|---|---|
| GET | `/calendar/today` | Today's 30 topics | — | `[topic]` |
| GET | `/calendar/permanent` | Permanent list (unlimited) | — | `[topic]` |
| POST | `/calendar/permanent` | Add topic (drag-drop target) | `{topic_id}` or full topic | added topic (deduped) · 409 on dup |
| DELETE | `/calendar/permanent/{id}` | Remove from permanent | — | `{status:"deleted"}` |
| GET | `/calendar/sources` | Followed sources (for SourcesPanel) | — | `[source]` |
| POST | `/calendar/sources` | Add a source | `{name,type,url}` | created source |
| DELETE | `/calendar/sources/{id}` | Remove a source | — | `{status:"deleted"}` |
| GET / PUT | `/calendar/config` | Read/update domain config | `{domain,keywords,...}` | config |
| POST | `/calendar/refresh` | Run the daily job now (n8n trigger + manual) | header `X-Refresh-Secret` | `{status, count, date}` |
| POST | `/calendar/generate` | Seed a session from a topic & start pipeline | `{topic_id, mode:"linkedin"\|"platform", target_platforms?}` | `{session_id}` |

`/calendar/generate` looks up the topic, builds `user_input` = `"{title}. {description}"`, calls the same pipeline entrypoint as `/run`/`/run_platform` with `origin:"calendar"` + `topic_id`, marks the topic `used:true`, returns `session_id`. The frontend then navigates to the existing preview route.

---

## 7. Content Calendar — Feature Spec

### 7.1 Daily job (`calendar/jobs.py` → `run_daily_refresh()`)
Triggered at **19:00 IST**. Steps:
1. Load `calendar_config` (domain, keywords, horizon) and `active` followed sources.
2. **Pass A — current updates (horizon `now`):** for each `active` RSS source, pull latest items via `feedparser`; plus a web-search pass (Tavily) scoped to the domain + "latest/today" for fresh items. Collect candidate items with their source name + URL.
3. **Pass B — forward-looking (horizon `upcoming`):** web-search the domain for trends, upcoming releases, events, and seasonal angles landing in the next `forward_horizon_months` (default 12). Collect with sources.
4. **Synthesis (Groq):** feed the deduped candidate items + their sources into an LLM prompt that returns a **JSON array of `daily_topic_count` (30) topics**, each `{title, description, horizon, category, sources:[{name,url}]}`. Strip markdown fences, `json.loads`, validate; on failure keep prior day's set and log (don't blank the calendar).
5. **Persist:** insert the 30 topics with today's IST `date`; update `config.last_run_at`. Keep raw `sources` so the UI can show provenance.

> Provenance is mandatory: every synthesized topic must carry at least one real source URL drawn from the candidates — never let the LLM invent sources. Prompt must instruct "only cite sources from the provided list."

### 7.2 Two creation paths (frontend)
- **Own Idea:** user types a description → existing flow (`/run` or `/run_platform`).
- **Content Calendar:** user opens the calendar → sees **today's 30 topics** + the **Permanent list** + the **SourcesPanel** (followed channels). User can:
  - **Drag** a today-topic into Permanent (`POST /calendar/permanent`, copy + dedupe; today's list is unchanged).
  - **Remove** from Permanent (`DELETE`).
  - **Create** from any topic (today or permanent) → `POST /calendar/generate` → same content + image + n8n-deploy pipeline as Own Idea.

### 7.3 Source transparency
`SourcesPanel` renders `GET /calendar/sources` as "Pulling topics from: …" with each source name/type linking to its URL, and each topic card shows source chips. This is the explicit "user knows where the data is coming from" requirement.

---

## 8. n8n Integration (replaces Zapier)

### 8.1 Deploy (replaces all four Zapier senders)
- `n8n_service.deploy(platform, caption, hashtags, image_url, session_id)`:
  1. If image is base64, upload via the shared ImgBB util → public `image_url` (same reason as audit: webhooks reject large payloads).
  2. `httpx.post(N8N_WEBHOOK_URL, json={platform, caption, hashtags, image_url, session_id, posted_at})`.
  3. If `N8N_WEBHOOK_URL == "dummy_url"`, skip and return `{"status":"skipped"}` (keep the audit's safe dummy mode).
- **n8n workflow (built in n8n, not in code):** Webhook (POST) → **Switch on `{{$json.platform}}`** → per-platform branch (LinkedIn / Twitter-X / Instagram HTTP or native nodes) → respond `200`. One webhook handles all platforms; `/deploy-all` just fires it N times concurrently via `asyncio.gather`.
- Optional auth: send `X-Deploy-Secret: $N8N_DEPLOY_SECRET`; validate in the n8n webhook node.

### 8.2 Daily trigger (preferred over in-app cron)
- **n8n workflow:** Schedule Trigger (cron `0 19 * * *`, timezone `Asia/Kolkata`) → HTTP Request `POST {BACKEND}/calendar/refresh` with header `X-Refresh-Secret: $N8N_SCHEDULE_SECRET`.
- Backend `/calendar/refresh` validates the secret, runs `run_daily_refresh()`, returns count. This keeps timing/retries in n8n (which you're already running) and the backend stateless.
- **Alternative:** in-app `APScheduler` `CronTrigger(hour=19, timezone="Asia/Kolkata")` calling the same job — use only if you don't want the n8n dependency for timing.

---

## 9. Web Research Subsystem (net-new detail)

- **RSS:** `feedparser.parse(url)` per active `rss` source → recent entries (title, link, published). Cheap, exact provenance.
- **Search:** Tavily (`/search` with `include_domains` from followed `website` sources when relevant) returns results **with URLs** → ideal for `sources`. SerpAPI/Brave/Google CSE are drop-in alternatives behind a small `search(query)->[{title,url,snippet}]` interface.
- **Synthesis:** Groq Llama 3.3 70B over the candidate pool. Two-bucket prompt (now vs upcoming), forced JSON, source-citation constrained to the provided list, dedupe by topic, cap at 30. Reuse the kit-JSON parsing approach from `groq_service` (fence strip + `json.loads` + fallback).
- **Cost/rate:** one batched run/day; keep candidate pool bounded (e.g. top N per source) before synthesis.

---

## 10. Configuration & Environment

Backend `.env` (names + purpose only):

| Var | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq LLM (copy, hashtags, kit, topic synthesis) |
| `REPLICATE_API_TOKEN` | Replicate FLUX-2-pro images |
| `IMGBB_API_KEY` | base64 → public URL for n8n payloads |
| `N8N_WEBHOOK_URL` | single deploy webhook (Switch routes platforms) |
| `N8N_DEPLOY_SECRET` | optional shared secret validated in n8n webhook |
| `N8N_SCHEDULE_SECRET` | secret for `/calendar/refresh` (the 19:00 trigger) |
| `TAVILY_API_KEY` | web search for calendar research (or chosen provider) |
| `MONGODB_URI` | Mongo; absent ⇒ in-memory fallback |

Frontend: **one** `VITE_API_BASE_URL` in `.env` (kills the audit's 6× hardcoded `localhost:8001`). All axios calls read it via `features/marketingKit/api.js`.

Drop unused `cloudinary`/`certifi` unless you intentionally switch image hosting to Cloudinary.

---

## 11. Replacement Plan (removing the old "marketing kit")

1. Locate the existing marketing kit in the target repo: its backend routes, frontend route(s)/components, and nav entry.
2. Mount `marketing_kit.router` in the app (`main.py`/app factory). Confirm it serves §6.
3. Build the new frontend feature under `features/marketingKit/` and add its route(s) to the existing `react-router-dom` config.
4. **Repoint the nav entry** "Marketing Kit" to the new `MarketingKitHome` route.
5. **Delete** the old marketing kit routes + components (and any now-dead deps). Verify nothing else imports them.
6. Smoke test both entry points end-to-end (Own Idea + Calendar) through preview to an n8n deploy.

---

## 12. Locked Assumptions

- Timezone **IST (Asia/Kolkata)**; daily job at **19:00**.
- `domain` + `followed_sources` are **user-configured** (single global config; per-user only if the app is multi-tenant).
- n8n: **single webhook + Switch** for deploys; **n8n Schedule trigger** for the daily job (APScheduler is the fallback).
- Daily list = **30**; Permanent = **unlimited**; drag = **copy into Permanent with dedupe**; today's list unaffected by drags.
- Topic selection reuses the **existing pipeline verbatim**; only the seed (`user_input`) and `origin/topic_id` differ.
- Search provider = **Tavily** (swappable behind one interface).
- Cleanups baked in: rename `gemini_service`→`image_service`, single `imgbb` util, centralized `VITE_API_BASE_URL`, no LangGraph/Pollinations/orphan code carried over.

---

## 13. Open Questions (confirm during build)

1. Does the target app have **auth/multi-tenant users**? If yes, key `calendar_config`, `followed_sources`, and topics per `user_id` and gate the routes.
2. Should the n8n deploy use **native platform nodes** (LinkedIn/X/IG) or generic HTTP requests inside n8n? (Affects the n8n workflow only, not the backend.)
3. Confirm the **search provider** (Tavily assumed) and whether you have its key.
4. Is **30 topics** fixed, or should `daily_topic_count` be user-editable in the config UI?
5. Should the **Permanent list** support categories/search/manual add, or is drag-from-today the only ingress?
6. Keep **MongoDB**, or does the target app standardize on a different DB you'd rather reuse?
