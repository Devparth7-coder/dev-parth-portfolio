# Dev Parth / Engineering Portfolio

A custom graphite-and-acid-green portfolio built with React 19, TypeScript, Vite, inline SVG diagrams, and self-hosted fonts. No UI framework, animation framework, 3D engine, or tracking scripts.

## Run

```sh
npm ci
npm run dev
```

The dev server listens on `0.0.0.0:5173` and accepts the Arena preview host. Browser code never calls localhost for API data.

```sh
npm run build
npm run preview
```

Deploy `dist/` to Vercel, Netlify, Cloudflare Pages, or any static HTTPS host. Build command: `npm run build`. Output: `dist`. No backend, credentials, or environment variables are required to render the portfolio.

## Before publishing

1. Set `email` in `src/data/profile.ts`. Until then the Email button explains that a public address is unavailable and offers LinkedIn. No address is invented.
2. Supply your final domain. Replace the relative Open Graph and Twitter image URL in `index.html` with `https://YOUR-DOMAIN/og-image.png`; add a canonical URL and `og:url` for that same domain. The included PNG is 1200×630. No guessed domain has been embedded.
3. Review content, links, and external deployments. External demo availability is outside this portfolio's control; an accessible frontend does not prove backend functionality or production-grade isolation.
4. Run the tests. No performance score, real-world CWV, or complete accessibility certification is claimed without measurement on the final deployment.

## Architecture

- `src/data/profile.ts` — identity, education, contact configuration
- `src/data/projects.ts` — exactly 10 curated projects, all case-study copy and URLs
- `src/data/skills.ts` — repository-backed toolkit, examples linking to case studies
- `src/data/achievements.ts` — verified Codeforces fallback, CodeChef snapshot export, author-supplied journey
- `src/data/codechef-snapshot.json` — verified CodeChef competitive and DSA statistics with source/date
- `src/data/socials.ts` — social destinations
- `src/data/github-snapshot.json` — verified calendar, language bytes, selected repository metadata and events
- `src/components/SystemGraph.tsx` — keyboard-operable conceptual execution graph
- `src/components/ProjectVisual.tsx` — genuine screenshot previews and explicitly labelled conceptual diagrams
- `src/components/CaseStudy.tsx` — lazy-loaded native dialog; ten-section project narratives
- `src/components/BuildLog.tsx` — curated GitHub API view and graceful snapshot fallback
- `src/App.tsx` — sections, navigation, filtering, contact, interactive stack
- `src/styles.css` — custom responsive design system, reduced-motion rules

## Content integrity

See `CONTENT-SOURCES.md`. Source review date: **2026-09-08**.

- Codeforces API returned **2137 / Master**. The page refreshes from the public API at runtime. On failure it displays the dated, verified snapshot.
- CodeChef was accessible on recheck: **2169 / 5-star / Division 1**, global rank **385**, country rank **244**. Its separate DSA rating is **2268**. The card explicitly labels this as a dated verified snapshot, not a live API response. Refresh before deployment with `npm run refresh:codechef`; failures preserve the verified snapshot.
- Project 05 is **FRAMEFORGE**, replacing CodeArena throughout the curated selection, case studies, diagrams, technology proof links, and GitHub language aggregates. Its storyboard consistency signals are not presented as scientifically validated guarantees; no demo URL was supplied.
- GitHub repo metadata and recent public events refresh client-side. They remain curated to the exact ten projects. API failure does not block content.
- Contributions and language distribution are explicitly dated snapshots, not fabricated activity. Contributions cover the public GitHub calendar, not just the selected projects; language bytes cover only the ten selected repositories.
- Research-paper has two distinct statuses: the root manuscript is pre-experimental; the nested `MAS-RELIAB/README.md` documents a stochastic synthetic-agent simulation pilot. The UI does not conflate this with real LLM experiments or peer-reviewed research.
- AI Command Center's deterministic local runtime is distinguished from optional production/provider adapters.
- Deepfake-detection1 retains its exact name. A ResNeXt/LSTM architecture is not presented as a validated trained checkpoint: the implementation's forensic fallback is documented.
- Screenshots are actual repository images or captures of the author's supplied live deployments. Interface demo metrics are not portfolio impact statistics.

## Interaction & accessibility

Sticky navigation, focus-trapped native mobile drawer and dialogs, Escape dismissal and focus restoration, keyboard-operated stack tabs, graph node selection and replay, seven working filters, reduced-motion support, hover illumination, pointer-following ambient light, restrained magnetic primary action, lazy case-study loading, semantic headings and a skip link.

Graph animation stops offscreen; reduced-motion users receive a static graph. SVG diagrams are conceptual, never live telemetry. No fake counter or performance chart is used.

## Tests

```sh
npx playwright install --with-deps chromium
npm test
```

Tests cover all six requested widths (1440, 1280, 1024, 768, 390, 375), exactly ten projects, filters, all ten case-study dialogs, keyboard focus restoration, mobile navigation, stack keys, the system graph, contact fallback, and failed external APIs. The initial desktop page also passed an automated axe WCAG A/AA scan with no detected violations; automated checks are not a substitute for manual assistive-technology testing.

## Assets & privacy

Fonts: Barlow Condensed, DM Sans, IBM Plex Mono, self-hosted and compressed to WOFF2. SIL Open Font License notices in `public/licenses/`. Lucide icons: ISC license, distributed via npm. Project screenshots belong to their respective project author; no AI-generated screenshots or stock imagery are used.

Runtime network requests go directly to the public GitHub and Codeforces APIs. They do not include authentication credentials. No cookies, analytics, form submissions, or user data collection.

## Portable preview

`npm run portable` produces `../Dev-Parth-Portfolio.html` with bundled JS, CSS, fonts, and images. It works without a server; API requests fall back gracefully when blocked by a file viewer. For publishing, prefer the Vite build's cached, separate assets and lazy-loaded case-study chunk.
