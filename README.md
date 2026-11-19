# BloomAI

A routine and focus helper for children: picture schedules, one-step-at-a-time tasks,
feelings check-ins, gentle AI praise and calm-down coaching, with a safe mode that points
the child to a trusted adult.

| Area | Owner | Where |
| :--- | :--- | :--- |
| Backend API, scoring, safety rule | Member A | `backend/` (see `backend/README.md`) |
| Child UI | Member B | `frontend/src/{pages,components,theme}`, `frontend/src/api/client.ts` |
| Check-ins, AI, progress | Member C | `backend/app/ai/`, `backend/app/routers/ai.py`, `frontend/src/features/` |

API contract: `docs/api-contract.md`.

---

## AI: praise, calm replies and check-ins

### What it does

- **`POST /api/praise`** returns one short, effort-based message for the reward animation
  (`step_completed`, `task_completed`, `session_ended`, `streak`).
- **`POST /api/calm-reply`** acknowledges how the child feels and suggests one activity:
  `breathing`, `movement`, `stretching`, `talk_to_adult` or `none`.
- **Check-in UI** (`frontend/src/features/checkin`): emoji, optional text, optional voice.
  The voice part sends only `avg_volume`, `peak_volume`, `words_per_minute` and `duration_seconds`.
- **My Progress** (`frontend/src/features/progress`): streak, points, a mood and focus chart, and a weekly note
  that only ever celebrates.

Every message follows `docs/ai-rules.md`: praise effort, stay positive, never shame, never give
medical advice.

### How a message is produced

```
request ─► distress rule trips? (calm-reply only) ─► yes ─► fixed trusted-adult reply
              │ no
              ▼
          LLM enabled? ─► no ───────────────────────────────┐
              │ yes                                         ▼
              ▼                                     template for the event / emoji
          Claude (timeout, JSON schema) ─► fails ──────────►│ (filtered too; safe default last)
              │ ok                                          │
              ▼                                             │
          safety filter ─► fails ──────────────────────────►┘
              │ ok
              ▼
          {message, source: "llm"}
```

- **The safety decision is not the LLM's.** `safe_mode` comes from Member A's distress rule in
  `POST /api/checkins`. When it is true the frontend shows the safe-mode screen and never calls
  calm-reply. Calm-reply also re-runs the rule and skips the LLM if it trips.
- **Safety filter** (`backend/app/ai/safety_filter.py`): at most 160 characters and one `!`,
  no ALL-CAPS, no shaming words or blame phrases, no medical terms, no links, emails or phone numbers.
- **Templates** (`backend/app/ai/fallback_templates/*.json`) are the floor. The app works with no
  API key at all.

### Configuration

| Variable | Default | Meaning |
| :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | unset | Enables Claude. Unset means templates only. |
| `BLOOM_LLM_ENABLED` | `auto` | `auto` (on when a key is set), `1`, or `0` |
| `BLOOM_LLM_MODEL` | `claude-opus-5-5` | Any Claude model ID |
| `BLOOM_LLM_EFFORT` | `low` | Reasoning effort; short replies need little |
| `BLOOM_LLM_TIMEOUT_SECONDS` | `4` | Hard timeout per call, no retries |

Requests use structured JSON output and the API's server-side refusal fallback. Any refusal,
timeout or error still ends in a template.

### Privacy

- The **child's name is never sent** to the LLM. The model writes `{name}` and the backend fills it in.
- Praise prompts contain only the event, task title, step text and streak. Calm-reply prompts
  also contain the child's check-in text, wrapped in `<child_checkin>` tags and treated as data.
- **No raw audio** is recorded, stored or uploaded. The browser keeps one loudness number per frame.
- Speech recognition (for pace) may use the browser vendor's cloud service. We ask for on-device
  recognition where supported. The transcript leaves the page only if the child taps **Use my words**.

### Checking it

```bash
pytest backend/tests -q
```

```bash
python -m backend.app.ai.review_messages --out docs/ai-message-review.md
```

The second command generates 30 messages across every event and emoji (including distress and
prompt-injection probes), checks them, and writes a report for a human read-through
(`docs/ai-message-review.md`). Run it again with a key set before the demo to review real LLM output.

Frontend unit tests live next to the features (`*.test.ts(x)`, Vitest + Testing Library).

### Limitations

- **Rule-based safety is narrow.** Keyword rules miss distress phrased in new ways and can
  over-trigger on ordinary frustration (e.g. *"I hate this homework"* with a loud voice scores
  emotion 0 and trips the compound rule). It is a prompt to involve an adult, not a detector.
- **The filter is a word list.** It blocks known bad patterns but cannot judge tone. Human review of
  generated messages (`review_messages.py`) is part of the release checklist.
- **Volume and pace are rough signals.** They depend on the microphone, the room and the child.
  Use them as relative cues, not measurements. Pace needs a browser with speech recognition.
- **English only.** The templates, word lists and distress phrases are English.
- **Not a clinical tool.** BloomAI does not diagnose, treat or monitor any condition.
- The LLM adds latency (up to the timeout) to praise. The reward animation should not wait on it
  longer than that.

Demo walkthrough: `docs/demo-scenarios.md`.
