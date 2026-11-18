# BloomAI Backend Service

FastAPI-powered backend for the BloomAI child task and routine assistant.

## Features
- **Profile Management**: Single child profile (name, avatar, favourite rewards).
- **Picture Schedules & Micro-steps**: CRUD, template cloning, custom icons & colors, one-step-at-a-time task tracking.
- **Never-Forget Checklists**: Daily pack-up checklists with reset and item toggling.
- **Task Sessions & Gamification**: Active task tracking, automatic points allocation (+5 per step, +10 bonus per session completion), and streak calculation.
- **Child-Friendly Emotion & Focus Scoring**: Rule-based score (0–100) combining emoji state, text sentiment keywords, speech volume, speaking pace, and task duration vs. expected time.
- **Distress Safety Guardrail**: Deterministic keyword scanner triggering `safe_mode` and helpline resources when distress phrases are detected.
- **AI Praise & Calm Coaching**: Effort-based positive praise and calm-down coaching with built-in template fallbacks (zero API key requirement).
- **Progress Tracking**: Daily mood and focus charts and streak summaries.
- **Demo Seeding**: 1-click endpoint seeding 14 days of realistic historical demo data.

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
To inject 14 days of realistic sample check-ins, streaks, points, and schedules for demo presentations:
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
