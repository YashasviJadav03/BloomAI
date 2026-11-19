# Member C preview app (dev only)

A tiny Vite shell to view the check-in and progress features before Member B's app exists.
It is not the product app. Delete this folder once `frontend/` has B's real app.

Start the backend first (from the repo root), then:

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: features' unit tests
npm run typecheck
```

No backend? Run with mock data from the API contract:

```bash
VITE_USE_MOCK=true npm run dev
```
