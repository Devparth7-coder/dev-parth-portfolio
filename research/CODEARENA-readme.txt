# CodeArena — Full-stack Online Judge

A complete online judge MVP with authentication, curated problems, four-language code execution, hidden tests, verdicts, progress analytics, submission history, a leaderboard, and admin problem management.

## Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173` (API: port 3001).

**Demo user:** `demo@codearena.dev` / `demo123`  
**Admin:** `admin@codearena.dev` / `admin123`

## Production
```bash
npm run build
NODE_ENV=production JWT_SECRET="use-a-long-random-secret" npm start
```

## Security note
The included temp-directory judge is for controlled demos. Before public deployment, move execution to hardened, network-disabled containers or microVMs with CPU, memory, process, syscall, filesystem, and output limits. Vercel functions cannot safely compile arbitrary submissions; host the judge/API on a container service or integrate a dedicated judge provider.
