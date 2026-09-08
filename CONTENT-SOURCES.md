# Source review — 08 September 2026

All repository README copies, tree listings, and selected implementation files inspected during the build are saved under `research/`. Project descriptions are conservative summaries, not independent technical audits. Unverified benchmark, adoption, affiliation, and impact claims in upstream READMEs were deliberately omitted.

| Portfolio project | Source of truth and implementation checks |
|---|---|
| AI COMMAND CENTER | https://github.com/Devparth7-coder/Command-Centre — README, backend/main.py, frontend/package.json; actual overview and trace explorer screenshots from docs/ |
| AURA RESEARCHER | https://github.com/Devparth7-coder/AURA-Researcher — README, backend/graph/research_graph.py, requirements.txt |
| MAS-RELIAB | https://github.com/Devparth7-coder/Research-paper — root README and MAS-RELIAB/README.md; distinct pre-experimental manuscript and simulation-pilot scopes |
| VAYUSUTRA | https://github.com/Devparth7-coder/V4 — README, vayusutra_apix/api/main.py, requirements.txt; repository architecture slide and a genuine live dashboard capture |
| FRAMEFORGE | https://github.com/Devparth7-coder/FrameForge — README, backend/app/services/workflow.py, backend/app/agents/consistency_agent.py, backend/app/services/continuity.py, backend/app/models.py, backend/requirements.txt; bounded regeneration, continuity memory, structured agent outputs, and heuristic consistency signals checked against implementation |
| APEX-STEWARD-AI | https://github.com/Devparth7-coder/APEX-STEWARD-AI — README, backend/app/main.py, frontend/package.json, route and evidence tree; unsupported headline benchmark numbers omitted |
| SATQUERY-AI | https://github.com/Devparth7-coder/SatQuery-AI — README, core/query.py, source tree; deterministic NLU, clustering and spectral rules, not a hosted VLM |
| Deepfake-detection1 | https://github.com/Devparth7-coder/Deepfake-detection1 — README, inference.py, model.py; explicitly distinguishes optional trained checkpoint from forensic fallback |
| SHORTFORGE | https://github.com/Devparth7-coder/ShortForge — README, app.py, requirements.txt |
| GOOGLETIMELINE | https://github.com/Devparth7-coder/GoogleTimeline — README and app.js; repository product is called TripReel, portfolio uses the requested GoogleTimeline title |

## Profile / activity sources

- https://codeforces.com/api/user.info?handles=dparth_7 — returned master, rating 2137, maxRating 2137.
- https://www.codechef.com/users/true_field_64 — initially HTTP 403, then accessible on recheck. Official profile shows 2169 competitive rating, 5 stars, Division 1, highest 2169, global rank 385, country rank 244, and separate DSA rating 2268. Extracted from the first competitive rating block and separate DSA rating block, stored in `src/data/codechef-snapshot.json`, and explicitly dated 2026-09-08. A build-time refresh script rejects unavailable or unparseable responses.
- https://api.github.com/users/Devparth7-coder/repos?per_page=100 — repository metadata, filtered to exact selection.
- Individual GitHub `/languages` endpoints — byte distributions, aggregated only over selected projects.
- https://api.github.com/users/Devparth7-coder/events/public?per_page=30 — public activity, filtered to selected repos.
- https://github.com/users/Devparth7-coder/contributions — actual public calendar date/level cells and contribution-count labels.
- Education, positioning, social links, and journey years: supplied by the user. Not independently verified academic records.

## Screenshot provenance

- `command.webp`: Command-Centre/docs/overview.png (repository demo UI).
- `trace.webp`: Command-Centre/docs/trace-explorer.png (repository demo UI).
- `vayu.webp`: V4/vayusutra_apix/static/img/Screenshot 2026-09-01 114400.png (technical architecture slide, not an interface).
- `vayu-live.webp`: actual browser capture of https://v4-alpha-ashen.vercel.app/ on the review date.

External frontend pages returned 200 during capture. This does not validate all backend functions or ongoing uptime. Source images were resized/compressed, never generatively edited. Other card visuals are explicitly labelled conceptual system diagrams.


## Selection revision

At the author’s request, project 05 is now FrameForge. CodeArena is removed from the portfolio UI, selected-repository fallback, runtime GitHub allowlist, and aggregate language bytes. Old CodeArena research files are retained only as historical build evidence, not displayed or bundled as portfolio content. FrameForge artwork is an explicitly labelled conceptual storyboard diagram, not a generated screenshot. No public FrameForge demo URL was found in the supplied repository metadata.
