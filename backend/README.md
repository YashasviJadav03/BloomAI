# BloomAI Backend Service

FastAPI-powered backend for the BloomAI child ADHD assistant & caregiver insights platform.

## Key Capabilities (Aligned with Instructor Guidelines)
- **Profile Management**: Single child profile (name, avatar, favourite rewards, target focus minutes).
- **Picture Schedules & Micro-steps**: CRUD, template cloning, custom icons & colors, one-step-at-a-time task execution.
- **Never-Forget Checklists**: Daily pack-up checklists with reset and item toggling for ADHD forgetfulness reduction.
- **Task Sessions & Gamification**: Active task tracking, automatic points allocation (+5 per step, +10 bonus per session completion), and streak calculation.
- **Multimodal ADHD Check-ins (Text, Audio & On-device Video)**:
  - Text sentiment tokens.
  - Audio feature extraction (average volume, peak volume, words-per-minute pace).
  - On-device video fidget analysis (`fidget_score` 0.0–1.0, `face_present` boolean).
  - **Privacy Guarantee:** Extracted numerical features only; zero raw audio or video stored or transmitted.
- **Dual-Action Distress Safety Guardrail**:
  - Deterministic self-critical keyword scanner triggering `safe_mode=True`.
  - Automatically logs a `CaregiverAlert` with trigger text and emotion score for parent/teacher notification.
- **Plain-Language Caregiver & Clinical Insights (`/api/caregiver/insights`)**:
  - Synthesizes focus endurance patterns (spotting the 12-minute fatigue threshold).
  - Analyzes checklist compliance and forgetfulness trends.
  - Generates plain-language clinical observations for parents, teachers, and clinicians.
- **Personalised Routine Recommendations (`/api/support/recommendations`)**:
  - Delivers tailored task duration caps (e.g., 10-minute maximums) and 2-minute movement micro-breaks.
- **AI Praise & Calm Coaching**: Effort-based positive praise and calm-down coaching with built-in template fallbacks (zero API key requirement).
- **Demo Seeding (`/api/dev/seed-demo`)**: 1-click endpoint seeding 14 days of realistic ADHD pattern data.

## Getting Started

### 1. Requirements
- Python 3.10+
- SQLite (built-in)

### 2. Setup Virtual Environment & Install Dependencies
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Run the Development Server
```bash
# From workspace root
uvicorn backend.app.main:app --reload --port 8000
```
Interactive API documentation will be available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Running Tests
```bash
pytest backend/tests -v
```

### 5. Seeding Demo Data
To inject 14 days of realistic sample check-ins, ADHD focus dips, pack-up checklists, streaks, points, and caregiver alerts:
```bash
curl -X POST http://localhost:8000/api/dev/seed-demo
```
To reset database to clean preset state:
```bash
curl -X POST http://localhost:8000/api/dev/reset
```

## Docker Execution
```bash
docker build -t bloomai-backend -f backend/Dockerfile .
docker run -p 8000:8000 bloomai-backend
```

---

## AI Module

### How it works

The AI module lives in `/ai` (repo root) and is imported by the backend. It powers two endpoints:

| Endpoint | Purpose |
|---|---|
| `POST /api/praise` | Effort-based praise when a child completes a step, task, or streak |
| `POST /api/calm-reply` | Empathetic calm-down response with a suggested activity |

Both endpoints always return a valid response. If the LLM is unavailable or produces unsafe output, the response silently falls back to a curated child-safe template.

### Enabling the LLM

Copy `backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY`:

```bash
GEMINI_API_KEY=AIzaSy...
AI_MODEL=gemini-2.0-flash          # optional, this is the default
AI_TIMEOUT_SECONDS=4               # optional
AI_MAX_CHARS=240                   # optional
AI_ENABLED=true                    # set to "false" to force templates only
```

**No key = templates only.** The app behaves identically to its previous state when no key is set. No environment variable is required for normal operation.

### Safety filter

Every LLM response passes through `ai/safety_filter.py` before being returned. A message is **rejected** (and replaced by a template) if it:

- Exceeds `AI_MAX_CHARS` characters or contains a newline
- Has more than 2 sentences
- Contains a URL, markdown characters, or `@`
- Matches any blocked word (stupid, loser, worthless, etc.)
- Contains medical or diagnostic language (ADHD, medication, diagnosis, disorder, etc.)
- Requests personal information (address, phone, school)
- Contains self-harm or violence terms

The child's free text is also sanitized before it enters any prompt: `<` and `>` are stripped, control characters are removed, and whitespace is collapsed.

### Distress short-circuit

If the child's text matches any distress keyword (`hate myself`, `hurt myself`, `kill myself`, `want to disappear`, etc.) **the LLM is never called**. The endpoint returns immediately:

```json
{
  "message": "Thank you for telling me. Let's find a trusted grown-up to talk to.",
  "suggested_activity": "none",
  "source": "template"
}
```

This check runs before any LLM call and cannot be bypassed.

### Prompt injection defence

Child-supplied text is wrapped in `<child_text>` tags in the prompt, and the system prompt instructs the model to treat that content as data only. The sanitizer also strips angle brackets so tag injection from child input is impossible.

### Limitations and review

> **This is a prototype, not a clinical tool.**
> AI outputs are heuristic. They are not a substitute for a therapist, doctor, or caregiver.
> Outputs should be periodically sampled and reviewed by a human for tone and safety.

To generate a batch of sample messages for review:

```bash
python ai/review_samples.py
```

This prints ~30 praise and calm messages with `[PASS]` / `[REJECT]` verdicts from the safety filter, so the team can audit tone and safety without a live session.
