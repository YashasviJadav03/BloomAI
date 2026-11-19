# Screen flow and wireframes (Member B)

```
first launch ──> /setup (name, buddy, rewards) ──> / Home
Home ─┬─ schedule card ──> /schedule/:id ──(tap task)──> /schedule/:id/task/:tid  (session)
      │                       └─ Edit mode ──> /schedule/:id/task/:tid/edit (steps)
      ├─ My checklists ──> /checklists ──> /checklists/:id
      ├─ Calm ──> /calm           (header button is on every screen)
      ├─ My progress ──> /progress        [Member C]
      └─ Focus desk ──> /workspace
session: Ready ─> Steps (one per screen, timer ring, Done ─> reward) ─> Finished ─> Transition ─> next task
Finished ──> /checkin?session=ID [Member C] ──> safe_mode ? /safe : (calm-reply) ──> optional /calm?activity=...
/safe  opens even if the server is down; coaching paused (no points, praise, timers)
```

Home                         Session (steps)               Reward overlay
```
[Calm][⭐ 30][⚙]             [←][Calm][⭐ 30][⚙]           ░░░░░░░░░░░░░░░░░░░░
🐼 Hi, Aarav!                Brush teeth                  ░  ┌────────────┐  ░
My day                          ( 1:42 left )             ░  │     ⭐      │  ░
┌─────────────┐ ┌──────────┐    ▬ ● ● ●                  ░  │  +5 ⭐      │  ░
│ ☀️ Morning   │ │ 📚 Homework│  ┌───────────────┐         ░  │ Nice effort! │  ░
│ 4 things    │ │          │   │ Step 1 of 4    │         ░  │ [Keep going] │  ░
└─────────────┘ └──────────┘   │      💧        │         ░  └────────────┘  ░
Never forget [🎒 My checklists]│ Wet your       │         (confetti = child's
[Calm][Progress][Focus desk]   │ toothbrush     │          favourite rewards)
                               └───────────────┘
                               [      ✓ Done!      ]
```
