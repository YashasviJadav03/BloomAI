# Contract gaps to agree with Member A / C (frontend assumptions)

The contract's "Key payloads" cover schedules, sessions, check-ins, praise, calm-reply, progress and safety. These were not specified, so `api/types.ts` assumes them. Please confirm or change (one PR to `api-contract.md`; I then adjust `types.ts` and `mock.ts`).

| # | Assumption | Where used |
|---|---|---|
| 1 | `Profile` = `{id, name, avatar, favourite_rewards: string[]}`; avatar and reward are string keys (`panda`, `rocket`...) | setup, rewards |
| 2 | `GET /api/schedules` returns full nested schedules (tasks + steps), same as `/schedules/{id}` | home |
| 3 | `GET /api/templates` item = `{id, type, name, color?, icon, description?}` | template picker |
| 4 | `PUT /api/schedules/{id}/tasks/reorder` body = `{"task_ids":[...]}`, returns the schedule | edit mode |
| 5 | Step reorder: `PUT /api/steps/{id}` accepts `order` (1-based). No dedicated endpoint | task editor |
| 6 | `Checklist` = `{id, name, icon, reminder_time: "HH:MM"\|null, items:[{id,text,icon,checked}]}` | checklists |
| 7 | `POST /api/checklists` with `template_id` creates from a checklist template | picker |
| 8 | DELETE and reset endpoints return any 2xx JSON (body ignored) | all |
| 9 | Task `icon` and step `icon` are icon-name strings from `src/theme/icons.tsx` (`tooth`, `sun`, ...); unknown names show ⭐ | all |
| 10 | B also calls `GET /api/progress/summary` (for the header points total). Contract lists it as "used by C" | header |
| 11 | `POST /api/praise` is called with `event: "step_completed"` or `"task_completed"` | rewards |
| 12 | Helpline `contact` that looks like a phone number becomes a `tel:` link. "set in config" placeholder must be replaced before the demo | safe screen |

Integration points with Member C (routes in `App.tsx`; C replaces the stub files in `src/features/`)
- B navigates to `/checkin?session=<session_id>` after a task ("How did that feel?").
- C: if `/api/checkins` returns `safe_mode: true`, `navigate('/safe', {replace:true})`. Never call calm-reply in that case.
- C: otherwise show the calm reply; to open the calm screen use `navigate('/calm?activity=breathing|movement', {state:{message}})`.
- `RewardOverlay` takes plain props (`message`, `points`, `rewards`...), so any praise text can be passed.
