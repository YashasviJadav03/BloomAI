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
