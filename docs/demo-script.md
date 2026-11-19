# Frontend demo script (about 5 minutes)

Setup: `cd frontend && npm install && npm run dev`. Mock mode needs no server. For real mode: start the backend (`uvicorn backend.app.main:app` from the repo root), then run the frontend with `VITE_API_MODE=real`. To get sample data: Settings (⚙) > Demo tools > load demo data. Use an adult role-playing a child.

1. **First launch** (20s): Bloomi says hi. Type a name, pick a buddy and up to 3 rewards. "No login, one child."
2. **Home** (40s): Bloomi greets. "My day" shows a gentle journey: done, current, and what is next. One big *Start* button. Other routines, pack-up lists, a small garden summary.
3. **Schedule** (30s): *See the whole routine*. Tap ✏️ Edit: move a task, rename, add or remove a step. Tap *Done*.
4. **Focus session** (70s): *Start*. Ready screen shows the steps. In the session only the timer, one step and one big *Done!* remain; navigation is hidden. Tap *Done!*: points, sound, praise (LLM text or template). Show the mute toggle in ⚙. The timer goes green, blue, warm orange, never red.
5. **Finish** (30s): "You did it!", then the next-task transition. A new garden item shows "New in your garden".
6. **Check-in** (40s): *How did that feel?* Pick a face, add text. Bloomi replies with a calm message. Type a self-critical phrase to show safe mode, with no calm-reply.
7. **My Garden** (60s): the Focus Garden grows with real points and streaks (labelled as visual rewards). Weekly Goal, Streak Trail, My Focus Rhythm and Feelings Calendar. Point out that the scores are self-reported check-ins, not a diagnosis.
8. **Never forget** (30s): *Pack-up lists*, tick everything: "All packed!". Set the reminder time to now to show the banner on Home.
9. **Calm break** (30s): breathing bubble with Bloomi (Breathe in, Hold, Breathe out), then *Move*.
10. **Accessibility** (20s): ⚙ text size, Calm Screen (less motion), keyboard Tab focus ring.

Talking points: no audio or video here (audio is Member C's); the score is a prototype heuristic, not a diagnosis; "focus drops at 12 minutes" is demo data only; garden rewards are frontend-only and never change a score.
