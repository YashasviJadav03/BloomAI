# BloomAI AI Rules

**Owner:** Member C (check-ins, AI and progress)
**Applies to:** `POST /api/praise`, `POST /api/calm-reply`, every fallback template in
`backend/app/ai/fallback_templates/`, and the weekly note on the My Progress page.

BloomAI talks to young children, many of whom hear a lot of correction during the day.
Every message the app shows has to be short, warm, and about the child's **effort**.
These rules apply equally to LLM output and to templates. Code enforces them in
`backend/app/ai/safety_filter.py`. A message that breaks a rule is never shown; the
template fallback is used instead.

---

## 1. Praise effort, not traits or results

| Do | Don't |
| :--- | :--- |
| "You kept going on that step." | "You're so smart." |
| "You tried the hard part first. Nice effort!" | "Perfect! 100%!" |
| "Step by step, you finished brushing your teeth." | "Finally, you did it right." |

- Name what the child **did**: kept going, tried again, took a breath, finished a step.
- Mentioning the task or step is good, because it makes the praise concrete.
- Streaks can be celebrated ("3 days in a row!"), but never framed as something to lose.

## 2. Positive tone, always

- One or two short sentences. **Max 160 characters** (enforced), at a reading level of about 7 years.
- At most one exclamation mark per message, and no ALL-CAPS words.
- No sarcasm, no conditional praise ("good, but…"), no comparisons with other children.
- Emojis are not written into messages; the UI adds the visuals.

## 3. No shaming, ever

The app never blames, scolds or labels a child. These are blocked anywhere in a message:

- Labels: *stupid, dumb, lazy, bad, naughty, useless, worthless, loser, hopeless*, …
- Blame patterns: *"you should have"*, *"why didn't you"*, *"you always"*, *"you never"*,
  *"try harder"*, *"not good enough"*, *"you failed"*, …
- Threats or punishment: *punish, consequence, in trouble, take away*, …

## 4. No medical, diagnostic or therapeutic advice

BloomAI is a routine helper, not a clinician.

- Never mention diagnoses or conditions (*ADHD, autism, anxiety disorder, depression*, …),
  medication, doctors, therapy or "symptoms".
- Never interpret the child's feelings clinically ("you seem depressed").
- Calm-down suggestions are limited to a fixed, safe set:
  `breathing`, `movement`, `stretching`, `talk_to_adult`, `none`.

## 5. Safety decisions are rules, not the LLM

- **Member A's distress rule decides `safe_mode`** (`backend/app/safety/distress_detector.py`).
  If `POST /api/checkins` returns `safe_mode: true`, the frontend goes straight to the
  safe-mode screen and **does not call** `/api/calm-reply`.
- As a second line of defence, `/api/calm-reply` runs the same distress rule on the text.
  If it trips, the LLM is **not** called and a fixed trusted-adult template is returned
  with `suggested_activity: "talk_to_adult"`.
- The LLM never gives crisis advice, phone numbers or links. Helplines come only from
  `GET /api/safety/resources` (Member A's config file).
- Output containing URLs, emails or phone-like digit runs is rejected.

## 6. Privacy

- **The child's name never leaves the device.** Prompts use the placeholder `{name}`, and the
  backend substitutes the real name only after the LLM replies.
- For praise, only the event type, task title, step text and streak count are sent.
- For a calm reply, the child's check-in text is sent so the reply can acknowledge the feeling.
  It is wrapped in `<child_checkin>` tags, and the model is told to treat it as data, not instructions.
- **No raw audio is ever recorded or uploaded.** The browser extracts four numbers
  (`avg_volume`, `peak_volume`, `words_per_minute`, `duration_seconds`) and discards the stream.

## 7. Reliability: the template is always the floor

- The LLM is **optional**. With no `ANTHROPIC_API_KEY`, or with `BLOOM_LLM_ENABLED=0`, every
  response comes from templates and the app behaves the same, just with less variety.
- Each LLM call has a hard timeout (`BLOOM_LLM_TIMEOUT_SECONDS`, default 4s) and no retries,
  because the child is waiting for a reward animation.
- Any failure (timeout, API error, refusal, empty, too long, blocked word, unknown activity)
  falls back to a template. The response `source` field says `"llm"` or `"template"`.

## 8. Review checklist (run before the demo)

`python -m backend.app.ai.review_messages` generates 30+ messages across every event and
emoji and checks each one against these rules. Then a human reads the report and asks of
each message:

1. Would I be happy for a 7-year-old to hear this after a hard day?
2. Does it praise effort or name a concrete action?
3. Is it free of blame, labels, comparisons and medical language?
4. Is it 160 characters or fewer, and easy to read aloud?
