# Frontend and API: what the frontend relies on

The frontend was first built against `api-contract.md` and then checked against the real FastAPI backend. These are the points where the real backend is the source of truth. The frontend (`api/types.ts`, `api/client.ts`, `api/mock.ts`) matches them, and the mock mirrors the same routes and JSON shapes.

| # | Real backend behaviour | Frontend handling |
|---|---|---|
| 1 | `GET /api/schedules` returns nested schedules (tasks + steps) | Home and schedule pages use it directly |
| 2 | Templates are `{id, type, name, color, icon, data}`; counts come from `data.tasks` / `data.items` | `TemplatePicker` derives counts and duration |
| 3 | Task reorder body is `{ "ordered_task_ids": [...] }` | `api.reorderTasks` |
| 4 | Steps are not renumbered by the backend. `PUT /api/steps/{id}` with `order` only changes that step | A move swaps the two steps' `order` values |
| 5 | Checklist items use `is_checked`; checklists have no icon; `reminder_time` is `"HH:MM"` | Checklist pages |
| 6 | `POST /api/checkins` returns `{id, focus_score, emotion_score, label, safe_mode}` | Check-in page |
| 7 | `POST /api/calm-reply` returns `{message, suggested_activity, source}` (`breathing`, `movement`, `stretching`, `none`) | Check-in page; `stretching` opens the movement tab |
| 8 | `GET /api/progress/summary` returns points, current and best streak, tasks today and this week | Header, Home, My Garden |
| 9 | `GET /api/progress/mood?days=N` returns only days that have check-ins | Rhythm chart and Feelings Calendar draw gaps for other days |

## Not provided by the API (handled on the device only)
- **Done today per task:** remembered in `localStorage` (`lib/doneToday.ts`).
- **Garden rewards:** thresholds in `lib/garden.ts`, computed from real `total_points` and `best_streak`. Visual rewards only; nothing is saved to the backend.
- **Weekly goal:** chosen by the child, saved on the device.

## Safety flow
- `/safe` always renders, even if the server is down.
- If `/api/checkins` returns `safe_mode: true`, the frontend goes to `/safe` immediately and never calls `/api/calm-reply`.

## Not in the frontend
- Audio check-ins (Member C's task in the plan) and video are not implemented. The check-in is emoji + text.
