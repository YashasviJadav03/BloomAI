# BloomAI frontend (child experience)

React 19 + Vite + TypeScript + Tailwind v4 + React Router. Owner: Member B.

```bash
npm install
cp .env.example .env     # VITE_API_MODE=mock (default) works with no backend
npm run dev              # http://localhost:5173
npm run build            # typecheck + production build
```

Switch to the real API: set `VITE_API_MODE=real` and run the FastAPI server on :8000 (Vite proxies `/api`). Nothing else changes: all calls go through `src/api/client.ts`. Mock mode answers the same URLs and JSON shapes as the contract (`src/api/mock.ts`; state kept in localStorage, reset it from ⚙ > Demo tools).

Layout: `src/pages` screens · `src/components` shared UI · `src/theme` icons/tokens (`index.css`) · `src/hooks` settings, sound, app state · `src/api` client, types, mock · `src/features/{checkin,progress,audio}` owned by Member C (stubs for now).

Docs: `../docs/design-system.md`, `wireframes.md`, `frontend-api-assumptions.md` (please review), `demo-script.md`.
