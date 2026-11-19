# BloomAI Prototype API Contract (Canonical)

**Base URL:** `http://localhost:8000/api`  
**Data Format:** JSON  
**Timestamp Format:** ISO-8601 UTC (e.g. `2026-11-24T07:30:00Z`)  
**ID Type:** Integer  
**Error Format:** `{"detail": "Error description"}`

---

## 1. System & Developer Endpoints
- `GET /api/health`
  - Response: `{"status": "ok", "app": "BloomAI Backend", "version": "0.1.0"}`
- `POST /api/dev/seed-demo`
  - Response: `{"message": "Demo data seeded successfully", "days_seeded": 14, "profile": "Aarav"}`
- `POST /api/dev/reset`
  - Response: `{"message": "Database reset to initial template state"}`

---

## 2. Profile Endpoints
- `GET /api/profile`
  - Response `200`:
    ```json
    {
      "id": 1,
      "name": "Aarav",
      "avatar": "star",
      "favourite_rewards": ["Extra playground time", "Lego build break"],
      "created_at": "2026-11-24T07:00:00Z",
      "updated_at": "2026-11-24T07:00:00Z"
    }
    ```
  - Response `404`: `{"detail": "Profile not found"}`
- `POST /api/profile`
  - Body:
    ```json
    {
      "name": "Aarav",
      "avatar": "star",
      "favourite_rewards": ["Extra playground time", "Lego build break"]
    }
    ```
  - Response `201`: Profile object
- `PUT /api/profile`
  - Body: same as POST
  - Response `200`: Profile object

---

## 3. Preset Templates
- `GET /api/templates?type=schedule` or `GET /api/templates?type=checklist`
  - Response `200`:
    ```json
    [
      {
        "id": 1,
        "type": "schedule",
        "name": "Morning Routine",
        "color": "#F4A261",
        "icon": "sun",
        "data": { ... }
      }
    ]
    ```

---

## 4. Schedules, Tasks & Steps
- `GET /api/schedules`: List all schedules (summary without deep nested steps).
- `POST /api/schedules`:
  - Body (blank): `{"name": "Homework", "color": "#2A9D8F", "icon": "book"}`
  - Body (from template): `{"template_id": 1}`
- `GET /api/schedules/{id}`:
  - Response `200`:
    ```json
    {
      "id": 1,
      "name": "Morning",
      "color": "#F4A261",
      "icon": "sun",
      "tasks": [
        {
          "id": 10,
          "title": "Brush teeth",
          "icon": "tooth",
          "order": 1,
          "expected_seconds": 120,
          "steps": [
            { "id": 100, "text": "Put paste on brush", "icon": "paste", "order": 1 },
            { "id": 101, "text": "Brush top and bottom teeth", "icon": "sparkles", "order": 2 },
            { "id": 102, "text": "Rinse mouth with water", "icon": "water", "order": 3 }
          ]
        }
      ]
    }
    ```
- `PUT /api/schedules/{id}`: Rename, change color or icon.
- `DELETE /api/schedules/{id}`: Delete schedule and nested tasks/steps.
- `POST /api/schedules/{id}/tasks`: Add a task (`title`, `icon`, `expected_seconds`, `order`).
- `PUT /api/tasks/{id}`: Edit a task.
- `DELETE /api/tasks/{id}`: Remove a task.
- `PUT /api/schedules/{id}/tasks/reorder`: Body: `{"ordered_task_ids": [12, 10, 11]}`.
- `POST /api/tasks/{id}/steps`: Add a step (`text`, `icon`, `order`).
- `PUT /api/steps/{id}`: Edit step.
- `DELETE /api/steps/{id}`: Remove step.

---

## 5. Never-Forget Checklists
- `GET /api/checklists`: List all checklists with their items.
- `POST /api/checklists`: Create blank `{"name": "School Bag", "reminder_time": "07:45"}` or with `{"template_id": 2}`.
- `PUT /api/checklists/{id}`: Update name or reminder time.
- `DELETE /api/checklists/{id}`: Remove checklist.
- `POST /api/checklists/{id}/items`: Add item `{"text": "Water bottle", "icon": "water", "order": 1}`.
- `PUT /api/checklist-items/{id}`: Update item text or toggle `{"is_checked": true}`.
- `DELETE /api/checklist-items/{id}`: Remove item.
- `POST /api/checklists/{id}/reset`: Reset all items in checklist to `is_checked: false`.

---

## 6. Task Sessions & Gamification
- `POST /api/sessions`
  - Body: `{"task_id": 10}`
  - Response `201`:
    ```json
    {
      "session_id": 5,
      "task_id": 10,
      "started_at": "2026-11-24T07:30:00Z",
      "expected_seconds": 120
    }
    ```
- `POST /api/sessions/{id}/steps/{step_id}/complete`
  - Response `200`:
    ```json
    {
      "points_awarded": 5,
      "total_points": 45,
      "streak": 3,
      "steps_remaining": 2
    }
    ```
- `POST /api/sessions/{id}/end`
  - Response `200`:
    ```json
    {
      "duration_seconds": 150,
      "expected_seconds": 120,
      "bonus_points": 10,
      "total_points": 55
    }
    ```

---

## 7. Multimodal Check-ins, Scoring & Distress Safety
- `POST /api/checkins`
  - Body:
    ```json
    {
      "session_id": 5,
      "emoji": "angry",
      "text": "I hate this homework",
      "audio_features": {
        "avg_volume": 0.62,
        "peak_volume": 0.9,
        "words_per_minute": 170.0,
        "duration_seconds": 12.0
      },
      "video_features": {
        "fidget_score": 0.65,
        "face_present": true,
        "duration_seconds": 5.0
      }
    }
    ```
  - Response `201`:
    ```json
    {
      "id": 1,
      "focus_score": 42,
      "emotion_score": 35,
      "label": "frustrated",
      "safe_mode": false,
      "created_at": "2026-11-24T07:35:00Z"
    }
    ```
  - *Note:* If `safe_mode == true`, child frontend transitions immediately to `/safe-mode` AND logs an alert in Caregiver Alerts.
- `GET /api/checkins?days=7`: Get recent check-in list.

---

## 8. AI Praise & Calm Reply
- `POST /api/praise`
  - Body:
    ```json
    {
      "event": "step_completed",
      "child_name": "Aarav",
      "task_title": "Homework",
      "step_text": "Write the date",
      "streak": 3
    }
    ```
  - Response `200`:
    ```json
    {
      "message": "You kept going on that step, Aarav. Nice effort!",
      "source": "template"
    }
    ```
- `POST /api/calm-reply`
  - Body:
    ```json
    {
      "child_name": "Aarav",
      "emoji": "angry",
      "text": "I hate this homework",
      "focus_score": 42,
      "emotion_score": 35
    }
    ```
  - Response `200`:
    ```json
    {
      "message": "That sounds frustrating. Let's take a short break.",
      "suggested_activity": "breathing",
      "source": "template"
    }
    ```

---

## 9. Safety Resources
- `GET /api/safety/resources`
  - Response `200`:
    ```json
    {
      "message": "It sounds like today is hard. Please talk to a trusted adult.",
      "resources": [
        { "name": "Childline (UK)", "contact": "0800 1111" },
        { "name": "Kids Helpline", "contact": "1800 55 1800" },
        { "name": "Crisis Text Line", "contact": "Text HOME to 741741" }
      ]
    }
    ```

---

## 10. Progress Page (Child View)
- `GET /api/progress/summary`: Points, streaks, today/week tasks done.
- `GET /api/progress/mood?days=7`: Day-by-day emotional and focus averages for Recharts.

---

## 11. Caregiver & Clinical Plain-Language Insights
- `GET /api/caregiver/insights?days=7`
  - Response `200`:
    ```json
    {
      "child_name": "Aarav",
      "time_range_days": 7,
      "focus_pattern": {
        "avg_focus_score": 68,
        "optimal_task_duration_minutes": 10,
        "restlessness_onset_minutes": 12,
        "summary": "Aarav's focus peaks in 10-minute bursts during visual routines. Restlessness noticeably rises past minute 12 on longer sedentary tasks."
      },
      "forgetfulness_pattern": {
        "checklist_completion_rate": 86,
        "most_forgotten_items": ["Water bottle", "Math notebook"],
        "summary": "Pack-up checklist adherence is currently at 86%."
      },
      "emotional_regulation": {
        "dominant_mood": "calm",
        "calm_recovery_rate": 90,
        "summary": "Most frequent emotional state is 'calm'."
      },
      "clinical_summary": "Aarav responds well to short, segmented micro-steps (under 10 minutes) with instant positive reinforcement.",
      "active_alerts_count": 0
    }
    ```
- `GET /api/caregiver/alerts`
  - Response `200`: Array of active distress alerts with trigger phrase and timestamp.
- `POST /api/caregiver/alerts/{id}/acknowledge`
  - Response `200`: Marks alert acknowledged by caregiver.
- `GET /api/support/recommendations`
  - Response `200`:
    ```json
    {
      "recommended_max_task_seconds": 600,
      "suggested_micro_break_seconds": 120,
      "recommendations": [
        "Cap individual homework tasks at 10 minutes to minimize distraction.",
        "Offer a 2-minute movement or breathing micro-break when transitioning between tasks."
      ]
    }
    ```
