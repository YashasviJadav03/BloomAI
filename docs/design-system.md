# BloomAI design system (Member B)

Goal: calm, predictable, big, low-text. One thing on screen at a time during a task.

| Token | Value | Use |
|---|---|---|
| Background `cream` | #FFF8EC | page |
| Ink / ink-soft | #2B3A42 / #52646E | text (11:1 / 5.8:1 on cream) |
| `sage` | #3E8E7E | primary action |
| `sun`, `sky`, `lilac`, `berry` | #F4A261, #6AA9D8, #9B8AD1, #D97B93 | schedule colours, accents |
| `danger` | #B5473A | delete confirmations only (never used for mistakes or time pressure) |
| Base text | 18px (A+ 21px, A++ 24px, user setting) | rem-based, everything scales |
| Touch targets | min 48px, main buttons 56-80px | |
| Radius | 1.25rem buttons, 1.5rem cards | |
| Motion | pop / float-up / breathe / wiggle | disabled by OS reduced-motion AND the in-app "Calm screen" toggle |

Rules
- Icons are emoji keyed by name (`tooth`, `sun`, ...), so the backend stores plain strings. Add more in `src/theme/icons.tsx`.
- Colour is never the only signal (numbers, icons, ✓ marks accompany it).
- Timers warm from green to blue to orange as time runs out. No red, no negative numbers. At zero: "Take your time. You're doing fine."
- Copy is positive and effort-based. No "wrong", "late", "failed".
- Sounds are synthesised in the browser (Web Audio) and can be muted (settings, persisted).
- Keyboard: visible focus ring, skip link, native `<dialog>` for modals, `role=timer`, `aria-live` for praise.

## Redesign (Nov 2026): Bloomi, Focus Garden, Daily Journey
- Mascot "Bloomi": inline SVG (`components/mascot/`), 7 poses exported as static files to `frontend/src/assets/bloomi/` (`npm run export:bloomi`).
- Palette: lavender #9B8AD1, mint #A9D9C4, cream #FFF8EC, sage #3E8E7E, peach #F4A261, sky #6AA9D8, berry #D97B93. Timer colours go green, blue, warm orange (never red).
- Focus Garden milestones (`src/lib/garden.ts`) are frontend-only visual rewards computed from real `total_points` and `best_streak`; nothing is stored in the backend.
- "Done today" is stored on the device (`lib/doneToday.ts`) because the API has no per-task done flag.
- My Focus Rhythm uses `GET /api/progress/mood?days=7` (self-reported check-in scores; only days with check-ins are returned).
