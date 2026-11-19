# Demo scenarios (Member C: check-ins, AI and progress)

Run with the LLM **off** (`BLOOM_LLM_ENABLED=0`) for a fully predictable demo. Turn it
on (`ANTHROPIC_API_KEY=...`) for one extra run to show varied wording. The flow is the same
either way; only the `source` field changes from `"template"` to `"llm"`.

Before starting:

```bash
uvicorn backend.app.main:app --port 8000
```

```bash
curl -X POST http://localhost:8000/api/dev/seed-demo
```

The scores below were checked against the running backend with the seeded demo data.

---

## 1. Praise after a step (about 30 s)

**Show:** effort-based praise in the reward animation.

1. Start the *Morning Routine → Brush teeth* task and complete a step.
2. The frontend calls `POST /api/praise` and the reward animation shows a message such as
   *"You did it one step at a time, Aarav. Brush teeth is finished!"*

**Point out:** the praise names what the child *did*, never "smart" or "perfect"
(`docs/ai-rules.md` rule 1). If the API is down, the animation still shows a default message.

## 2. Happy voice check-in (about 45 s)

**Show:** emoji, text and voice features, with no audio stored.

1. Open the check-in, tap **😊 Happy**, type *"I finished my reading!"*
2. Tap **🎤 Tell me with your voice**, speak calmly for about 5 s, then stop.
3. **Done**. Backend returns roughly `focus 85, emotion 95, label "flow"`, with no safe mode.
4. The calm reply is encouragement with no activity: *"Love seeing you happy, Aarav!…"* → **Keep going**.

**Point out:** open DevTools → Network. The check-in body holds only four numbers in
`audio_features`. There is no audio file anywhere.

## 3. Frustrated check-in → calm-down activity (about 60 s)

**Show:** the calm reply and the hand-off to the calm-down screen.

1. Tap **😠 Angry**, type *"my brother took my pencil"*, and speak loudly and quickly.
2. Backend returns `emotion 0, label "frustrated", safe_mode false` (loud voice and fast pace lower the emotion score).
3. The calm reply appears, e.g. *"Big feelings are okay, Aarav. Let's squeeze your fists tight, then let go."*
   with a **Wiggle break** button that opens Member B's calm-down screen.

**Point out:** the reply acknowledges the feeling without repeating harsh words, and invites
an activity rather than saying "calm down".

## 4. Distress → safe mode (about 45 s)

**Show:** the safety decision belongs to a rule, not the LLM.

1. Tap **😢 Sad**, type *"I am stupid"*. **Done**.
2. Backend returns `safe_mode: true, label "distressed"`. The app goes straight to the
   safe-mode screen (trusted adult plus helplines from `GET /api/safety/resources`).
3. In DevTools, show that **no** `/api/calm-reply` request was made.

**Point out:** even if the frontend did call calm-reply, the backend re-runs the distress rule
and returns only the fixed trusted-adult message (`talk_to_adult`) without contacting the LLM.

## 5. My Progress (about 45 s)

**Show:** streak, points, mood chart and the weekly positive note.

1. Open **My Progress**. The tiles show day streak, points, tasks today and best streak.
2. The *My week* chart plots Mood (solid blue) and Focus (dashed orange) on one 0-100 axis.
   Hover a point for that day's numbers; **Show table** gives the same data as a table.
3. The weekly note celebrates what went well, e.g. *"You checked in on 7 days this week,
   Aarav. Friday felt the brightest. 5 days in a row of showing up."*

**Point out:** the dip in the seeded data (the tired homework days) is visible on the chart,
but the note never mentions it. The note only celebrates.

## 6. Resilience (optional, about 30 s)

1. Stop the backend, or set `BLOOM_LLM_TIMEOUT_SECONDS=0.5` with a bad key.
2. Do a check-in. Praise and calm replies still appear (built-in templates), and a failed
   check-in save shows a gentle "let's try again" with a reminder to tell a grown-up.

---

## Presentation outline (Member C, about 3 minutes)

1. **Problem:** children need feedback that encourages effort, and adults need a safe signal when a child is struggling.
2. **Design rules** (`docs/ai-rules.md`): effort-based, positive, no shaming, no medical advice.
3. **Architecture:** templates are the floor; the LLM is optional; a filter checks every message; the safety decision is A's rule.
4. **Privacy:** the name is never sent to the LLM; no raw audio; the transcript is shared only by choice.
5. **Live demo:** scenarios 2 → 3 → 4 → 5.
6. **Limitations** (see README, "AI: limitations").
