# FRAMEFORGE AI

**Autonomous Narrative-to-Visual Storyboarding Engine**

FRAMEFORGE converts raw narrative content — stories, scripts, novels, poetry, lore —
into a structured sequence of **visually consistent** storyboard scenes. It is not a
text-to-image toy: the core engineering problem it solves is

> **maintaining visual consistency across many generated scenes while preserving
> narrative continuity.**

The difference between *"generate an image for each paragraph"* and *"construct a
coherent visual representation of an evolving narrative"* is the entire architecture
below.

---

## Contents

1. [Problem statement](#problem-statement)
2. [Architecture](#architecture)
3. [AI pipeline](#ai-pipeline)
4. [Character consistency strategy](#character-consistency-strategy)
5. [Scene planning](#scene-planning)
6. [Prompt engineering](#prompt-engineering)
7. [Consistency validation](#consistency-validation)
8. [Provider architecture](#provider-architecture)
9. [Database schema](#database-schema)
10. [API reference](#api-reference)
11. [Local installation](#local-installation)
12. [Mock mode](#mock-mode)
13. [Environment variables](#environment-variables)
14. [Vercel deployment](#vercel-deployment)
15. [Storage configuration](#storage-configuration)
16. [Testing](#testing)
17. [Troubleshooting](#troubleshooting)
18. [Future: video generation & research mode](#future-video-generation--research-mode)
19. [Roadmap](#roadmap)

---

## Problem statement

Naive pipelines treat a story as a bag of paragraphs and produce disjoint,
identity-drifting images. FRAMEFORGE instead builds **bibles** (character /
environment / prop), plans scenes against narrative structure, engineers prompts
from those bibles plus **continuity memory**, and **validates every frame**
before it joins the storyboard. Failed frames are regenerated with a hard cap
(`MAX_REGENERATIONS`, default 3 — never an infinite loop).

## Architecture

```mermaid
flowchart LR
    subgraph CLIENT["Web Client"]
        UI[Storyboard Workspace]
    end
    subgraph API["FastAPI (frameforge-api)"]
        R[REST API] --> WF[Workflow Engine]
        WF --> SA[Story Analyzer]
        WF --> CA[Character Agent]
        WF --> WA[World Agent]
        WF --> SP[Scene Planner]
        WF --> PA[Prompt Engineer]
        WF --> IG[Image Generator]
        WF --> CV[Consistency Validator]
        CV -- "FAIL ≤ MAX_REGEN" --> PA
    end
    UI -->|poll run events| R
    WF --> PG[(PostgreSQL)]
    IG --> ST[(Blob Storage)]
    IG --> IP[Image Providers]
    SA --> LP[LLM Providers]
```

```
frameforge/
├── backend/
│   ├── app/
│   │   ├── api/routes.py            # REST API
│   │   ├── agents/                  # story_analyzer · character_agent · world_agent
│   │   │                            # scene_planner · prompt_agent · consistency_agent
│   │   ├── providers/
│   │   │   ├── llm/                 # base · mock · openai · gemini · anthropic
│   │   │   └── image/               # base · mock · openai · replicate · fal
│   │   ├── services/                # workflow engine · continuity memory ·
│   │   │                            # similarity · storage · exports
│   │   ├── models.py                # SQLAlchemy entities
│   │   ├── schemas.py               # Pydantic schemas (all agent I/O validated)
│   │   └── main.py
│   ├── tests/                       # 45 tests: unit · integration · failure
│   ├── requirements.txt
│   └── vercel.json
├── frontend/                        # cinematic storyboard workspace
├── sample_stories/the_last_light.txt
├── .github/workflows/ci.yml
└── .env.example
```

> The workspace ships with a dependency-free production-grade web client so the
> entire system runs as one process in dev/demo. The production Vercel topology
> (below) splits it into `frameforge-web` + `frameforge-api`.

## AI pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant W as Workflow Engine
    participant A as Agents
    participant P as Providers
    U->>W: POST /projects/{id}/run (returns run_id)
    W->>A: Story Analyzer → validated StoryAnalysis JSON
    W->>A: Character Agent → Character Bibles (immutable/variable split)
    W->>A: World Agent → Location + Prop Bibles
    W->>A: Scene Planner → ScenePlans + Continuity Memory
    loop each scene
        W->>A: Prompt Engineer (bibles + scene + continuity + previous scene)
        W->>P: ImageProvider.generate(seed, params)
        W->>A: Consistency Validator (multi-signal scoring)
        alt approved
            W->>U: event: scene approved
        else rejected (≤ MAX_REGENERATIONS)
            W->>P: regenerate with refined seed/prompt
        end
    end
    U->>W: GET /runs/{id}/events (polling → realtime-swappable)
```

Every agent output is validated through Pydantic (`schemas.py`). Unstructured LLM
text never flows through the internals.

### Continuity memory

`services/continuity.py` learns state facts from the narrative and injects them
into future prompts automatically:

* **injury** — "Kael injured his arm" → every later scene shows the wound/bandage
  until the story heals it
* **wardrobe** — "put on / took off the red cloak" tracked as half-open intervals
* **carrying** — "seized the key" → the key stays in frame
* **world state** — "the tower collapsed" changes the location rendering rules

Facts are persisted (`ContinuityFact`) and surfaced in the UI's **Memory** tab.

## Character consistency strategy

The Character Bible splits every profile into:

| Immutable (identity anchor)              | Variable (per scene)                  |
|------------------------------------------|---------------------------------------|
| facial structure, hair, eyes, skin tone  | clothing, pose, expression            |
| body proportions, identifying marks      | injuries, accessories, lighting, env  |

* Immutable attributes are **frozen into every prompt** (`CHARACTER IDENTITY` section)
  and into the negative prompt ("changed hair color, different face between scenes").
* Each character gets a **reference sheet** (front / 3-4 / side / full body) used as
  a visual identity anchor — pixel-compared against generated frames when the
  provider supports references.
* References can be **locked**; editing an immutable attribute triggers
  **change propagation**: only the affected scenes are flagged & regenerated.

## Scene planning

The planner merges and splits narrative beats to hit the requested scene count
(Auto/10/20/30/custom), then assigns per scene: characters, location, time,
weather (both **carry forward** unless the text changes them), emotion, camera
(shot/angle/movement), composition, lighting, palette, props, and continuity
constraints. Scene cards support drag-and-drop reordering, splitting and merging.

## Prompt engineering

`prompt_agent` never sends the raw scene text to the model. It assembles
ordered sections and a negative prompt:

```
SUBJECT → CHARACTER IDENTITY → WARDROBE → ACTION → LOCATION → ENVIRONMENT
→ CAMERA → COMPOSITION → LIGHTING → MOOD → ART DIRECTION → STYLE (global lock)
→ CONTINUITY CONSTRAINTS → PREVIOUS SCENE (identity carry-over)
```

Global Style Lock applies one of 10 presets (cinematic realism, anime, dark
fantasy, cyberpunk, noir, …) to **every** scene. Advanced users can override the
final prompt manually per scene (Prompt Inspector).

## Consistency validation

Four scores (0–100) computed from **multiple honest signals**:

| Axis          | Signals                                                                          |
|---------------|----------------------------------------------------------------------------------|
| Character     | identity-token adherence in prompt · wardrobe adherence · pHash vs reference      |
| Environment   | location-token adherence · hue-histogram match vs location palette                |
| Style         | style-token presence · pHash similarity to previous scene                         |
| Temporal      | active continuity constraints reflected in the prompt                             |

Below `CONSISTENCY_THRESHOLD` (72) the frame is regenerated (capped) or parked in
*needs review*. Similarity is reported as **one signal among several** — the UI
shows the full breakdown; no claim of scientific validation is made.

## Provider architecture

**LLM** (`providers/llm/`) — `generate()` + `structured_generate(task, payload, schema)`
with retries/exponential backoff and per-call timeouts:

| Provider  | Activates when            | Notes                              |
|-----------|---------------------------|------------------------------------|
| `mock`    | default                   | deterministic heuristic engine      |
| `openai`  | `OPENAI_API_KEY`          | chat completions, JSON-enforced     |
| `gemini`  | `GOOGLE_API_KEY`          | `response_mime_type: application/json` |
| `anthropic` | `ANTHROPIC_API_KEY`     | messages API, JSON-enforced         |

**Image** (`providers/image/`) — `generate()` + `generate_with_reference()`;
capabilities are declared honestly and the UI only shows supported parameters:

| Provider    | seed | steps | guidance | reference images |
|-------------|------|-------|----------|------------------|
| `mock`      | ✓    | —     | —        | ✓ (palette-anchored) |
| `openai`    | ✗    | ✗     | ✗        | ✓                |
| `replicate` | ✓    | ✓     | ✓        | ✗ (no IP-Adapter wiring) |
| `fal`       | ✓    | ✓     | ✓        | ✗                |

Seeds are stored on every generation where supported, with lock/randomize/reuse/
compare controls in the UI.

## Database schema

PostgreSQL via SQLAlchemy (SQLite fallback for dev/tests). UUID keys, timestamps,
JSON columns for flexible attributes:

```mermaid
erDiagram
    Project ||--|| Story : has
    Project ||--o{ Character : has
    Project ||--o{ LocationEntity : has
    Project ||--o{ PropEntity : has
    Project ||--o{ Scene : has
    Project ||--o{ WorkflowRun : has
    Project ||--o{ ContinuityFact : has
    Character ||--o{ CharacterVersion : versions
    LocationEntity ||--o{ LocationVersion : versions
    Scene ||--o{ SceneVersion : versions
    Scene ||--o{ Prompt : "prompt versions"
    Scene ||--o{ ImageGeneration : versions
    ImageGeneration ||--o{ ConsistencyEvaluation : scored_by
    WorkflowRun ||--o{ WorkflowEvent : trace
```

## API reference

Interactive docs at `/api/docs` (OpenAPI). Key endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/extract-text` | Upload `.txt/.md/.pdf/.docx` → normalized text |
| POST | `/api/projects` | Create project (story, style, scene target, provider) |
| POST | `/api/projects/{id}/run` | Start `full_pipeline` / `generate_images` / `character_reference` → `run_id` |
| GET | `/api/runs/{id}` · `/api/runs/{id}/events?after_seq=N` | Poll status & event stream |
| GET | `/api/projects/{id}` | Full payload: bibles, scenes, prompts, generations, evaluations, memory |
| POST | `/api/scenes/{id}/regenerate` | Preserve/change options + seed + optional prompt override |
| POST | `/api/scenes/{id}/status` | `ai_approved / ai_rejected / needs_review / human_approved / human_rejected` |
| POST | `/api/scenes/{id}/split` · `/merge-next` · `/seed` · `/select-version` | Board control |
| POST | `/api/projects/{id}/scenes/reorder` | Drag-and-drop ordering |
| PATCH | `/api/characters/{id}` | Edit bible → returns `affected_scene_ids` (change propagation) |
| POST | `/api/projects/{id}/regenerate-affected` | Regenerate **only** affected scenes |
| GET | `/api/projects/{id}/export/{pdf\|zip\|csv\|json\|contact-sheet}` | Exports |
| GET | `/api/projects/{id}/cost-estimate?scenes=N` | Estimated cost before large jobs |
| GET | `/api/dashboard` · `/api/meta` | Studio stats · providers/styles/capabilities |

## Local installation

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# open http://localhost:8000 — zero API keys required (mock mode)
```

Load the bundled sample story ("The Last Light") from the New Project screen, or
upload your own narrative.

## Mock mode

`MockLLMProvider` (deterministic heuristic narrative engine) + `MockImageProvider`
(seedable cinematic canvas renderer built on Pillow that draws characters from
their bible attributes) make the **entire** pipeline — analysis, extraction,
planning, prompting, generation, consistency validation, exports — run offline for
development, tests, demos and CI. Selecting any other provider is pure
configuration.

## Environment variables

See `.env.example`. Highlights:

```
DATABASE_URL=           # managed PostgreSQL in production
LLM_PROVIDER=mock       # mock|openai|gemini|anthropic
IMAGE_PROVIDER=mock     # mock|openai|replicate|fal
STORAGE_PROVIDER=local  # local|vercel-blob
MAX_REGENERATIONS=3
CONSISTENCY_THRESHOLD=72
```

No key is ever hard-coded; real credentials must never be committed.

## Vercel deployment

Two-project topology (recommended):

* **frameforge-api** — this repo's `backend/` with `vercel.json`
  (`@vercel/python`, routes `/api/*` → FastAPI). Long-running generation is
  **serverless-safe**: `POST .../run` returns a `run_id`; the queue-agnostic
  engine persists state/events to PostgreSQL and can be invoked by an external
  worker. Generated media lives in Vercel Blob / S3, never the ephemeral FS.
* **frameforge-web** — the production Next.js/TypeScript/Tailwind client,
  configured with `NEXT_PUBLIC_API_URL`. The bundled client in this repo serves
  the same API contract for single-process dev & demo.

Database: managed PostgreSQL (Neon/Supabase/…) via `DATABASE_URL`
(`pool_pre_ping`, small pools). Never run PostgreSQL inside Vercel.
CORS: `CORS_ORIGINS=https://<frontend-domain>` in production (no wildcard).

## Storage configuration

`StorageProvider` abstraction with `LocalStorageProvider` (dev; served at
`/media`) and `VercelBlobStorageProvider` (prod; `BLOB_READ_WRITE_TOKEN`).
Image URLs are persisted in `ImageGeneration.image_url`.

## Testing

```bash
cd backend && pytest tests/ -q        # 45 tests
```

* **Unit** — parsing, schema validation, extraction, planner, continuity memory,
  prompt construction, consistency scoring, provider abstraction & capabilities
* **Integration** — full offline pipeline story → validated storyboard,
  regeneration versioning, graceful failure on empty input
* **Failure** — malformed LLM JSON (retry exhaustion), LLM timeout, image API
  failure (scenes degrade to *needs review*, pipeline never crashes),
  regeneration-cap guarantee

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `LLM task failed after N attempts` | Real provider configured but key invalid/unreachable — or set `LLM_PROVIDER=mock` |
| `IMAGE_API_KEY ... is not set` | Export the key for your chosen `IMAGE_PROVIDER`, or use `mock` |
| Scenes stuck in *needs review* | Threshold vs model quality — lower `CONSISTENCY_THRESHOLD` or regenerate with a locked seed |
| `foreign key` errors after schema edits | Delete `data/frameforge.db` in dev (migrations via Alembic in prod) |
| Port in use | `--port 8001` and update `NEXT_PUBLIC_API_URL` |

## Future: video generation & research mode

Scenes already store animation metadata (`camera_movement`, `character_movement`,
`suggested_duration_s`, `transition`, motion description). The planned path:

```mermaid
flowchart LR
    SB[Storyboard] --> KF[Keyframes] --> VG[Video Generation] --> AS[Scene Assembly] --> F[Final Film]
```

The consistency framework (character / environment / style / temporal / overall
scores with per-signal breakdowns) is designed to support research experiments —
identity drift, prompt sensitivity, seed stability, reference-image effectiveness,
model comparison — with metrics clearly presented as **engineering signals**, not
scientifically validated measures.

## Roadmap

* **MVP (this repo)** — story input → analyzer → character/world bibles → scene
  planning → prompt engineering → image generation → consistency validation →
  storyboard with edit/reorder/regenerate/compare/approve/export
* **Phase 2** — embedding-based similarity, advanced environment references,
  dependency graph UI, prompt versioning UI, cost analytics, multi-provider A/B
* **Phase 3** — intelligent selective regeneration, automatic continuity-error
  detection (missing props, impossible geography, appearance drift), style-drift
  detection, video preparation pipeline
