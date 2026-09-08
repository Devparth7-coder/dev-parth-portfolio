# AURA — Autonomous Unified Research &amp; Analysis

AURA is an **agentic AI research platform** that takes a research question and
runs it through a coordinated multi-agent pipeline — planning, retrieval,
evidence extraction, reasoning, sandboxed experimentation, critical
verification and evaluation — to produce a **reproducible, fully-cited
report**.

> V1 goal (implemented): *"Compare transformer-based and CNN-based deepfake
> detection methods."* → search papers → retrieve 10 relevant papers → extract
> evidence → synthesize findings → **every claim gets a citation** → generate
> **Executive Summary · Literature Review · Comparison Table · Research Gap ·
> References**.

It runs with **zero API keys** (deterministic synthesis, hashing embeddings,
in-memory vector store), and upgrades gracefully: hosted LLMs
(OpenAI/Anthropic), sentence-transformers embeddings, and a Qdrant vector DB
are opt-in.

---

## Quickstart

```bash
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Open http://localhost:8000 — type a question, hit **Run research**.

Command line:

```bash
python -m backend.cli --question "Compare transformer-based and CNN-based deepfake detection methods."
python -m backend.cli --benchmark          # LLM-only vs RAG vs Hybrid-RAG vs AURA
```

Tests:

```bash
python -m pytest
```

Docker (with Qdrant):

```bash
docker compose up
```

---

## Architecture

```
 USER → PLANNER → {PAPER, WEB, DATA} agents → EVIDENCE ENGINE (retrieve+rank+cite)
      → REASONING (synthesize claims) → EXPERIMENT (sandboxed) → CRITIC/VERIFIER
      → EVALUATION ENGINE → RESEARCH REPORT
```

Orchestrated as a LangGraph state machine in
[`backend/graph/research_graph.py`](backend/graph/research_graph.py):

```text
START → plan → retrieve → evidence → reason → experiment → critique
      → (retry on failed claims) → evaluate → report → END
```

See [`docs/architecture.md`](docs/architecture.md) for the full module map.

### The multi-agent layer

| Agent | File | Role |
|---|---|---|
| Planner | `agents/planner.py` | Decomposes the question into entities, sub-questions, queries, facets, tasks |
| Paper / Web / Data | `agents/researcher.py` | arXiv + Semantic Scholar + web + datasets (live APIs) |
| Evidence engine | `agents/retrieval.py` | Sentence-level hybrid search (BM25 + dense), rerank, citations |
| Reasoning | `agents/reasoning.py` | Synthesizes citable claims + comparison table |
| Experiment | `agents/experiment.py` | Sandboxed meta-analysis of reported metrics (CNN vs Transformer) |
| Critic | `agents/critic.py` | Verifies citation consistency + evidence groundedness |
| Evaluation | `evaluation/*.py` | Retrieval & generation metrics, benchmark harness |

---

## Repository layout

```
aura/
├── backend/
│   ├── main.py                # FastAPI app (API + static frontend)
│   ├── cli.py                 # CLI entry point
│   ├── config.py              # env-driven settings (AURA_*)
│   ├── models.py              # Paper, Evidence, Claim, Report, …
│   ├── llm.py                 # deterministic / OpenAI / Anthropic
│   ├── report.py              # ReportBuilder (5-section report)
│   ├── agents/                # planner, researcher, retrieval, reasoning, experiment, critic
│   ├── graph/research_graph.py# LangGraph orchestration
│   ├── retrieval/             # embeddings, qdrant, hybrid_search, reranker
│   ├── ingestion/             # pdf_parser, chunker, metadata
│   ├── experiments/           # sandbox, executor, metrics
│   ├── evaluation/            # retrieval, generation, benchmark
│   └── api/                   # research, papers, experiments
├── frontend/                  # no-build SPA (app/, components/, lib/)
├── datasets/                  # local corpora & relevance labels
├── experiments/output/        # generated reports & benchmarks
├── tests/                     # pytest suite
├── docs/                      # architecture, evaluation, API
├── docker-compose.yml
└── README.md
```

---

## Configuration

All settings are read from environment variables prefixed with `AURA_`:

| Variable | Default | Purpose |
|---|---|---|
| `AURA_MAX_PAPERS` | `10` | target paper count (V1 spec) |
| `AURA_EMBEDDING_BACKEND` | `hashing` | `hashing` or `sentence-transformers` |
| `AURA_VECTOR_STORE_BACKEND` | `memory` | `memory` or `qdrant` |
| `AURA_HYBRID_ALPHA` | `0.5` | lexical↔dense trade-off |
| `AURA_LLM_BACKEND` | `deterministic` | `deterministic`, `openai`, `anthropic` |
| `AURA_OPENAI_API_KEY` | — | enables hosted synthesis |
| `AURA_ANTHROPIC_API_KEY` | — | enables hosted synthesis |
| `AURA_EXPERIMENT_ENABLED` | `true` | toggle the experiment agent |
| `AURA_MAX_CRITIC_ITERATIONS` | `2` | self-correction loop bound |

---

## Making it yours (Section 14)

The platform includes its own research problem scaffold:

> **Can multi-agent research systems improve citation correctness and
> evidence-grounded reasoning compared with conventional RAG systems?**

`python -m backend.cli --benchmark` compares **LLM-only vs Standard RAG vs
Hybrid RAG vs AURA** on citation coverage, citation validity, faithfulness and
hallucination risk — the metrics a paper on AURA would report in its Results
and Ablation sections.

---

## Safety note

The experiment sandbox (`experiments/sandbox.py`) combines AST import
allowlisting, an isolated subprocess and OS resource limits. It is a
best-effort containment layer, **not a hard security boundary** — run AURA
inside a container for untrusted code.

## License

MIT — see [LICENSE](LICENSE).
