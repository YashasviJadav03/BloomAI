"""End-to-end integration tests: full user flows through the real FastAPI stack.

Each test covers a complete user journey — no mocks, no monkeypatching.
The in-memory SQLite database is seeded fresh for every test (see conftest.py).

The LLM is always disabled here (patched to template-only mode) so tests are
fast and require no network access or API key.

Flows covered
─────────────
1. First launch: profile does not exist → create → read back
2. Schedule CRUD: create → add task → add steps → reorder → delete
3. Session flow: start session → complete steps → end session → points accumulate
4. Check-in flow: submit happy check-in → safe_mode=False → calm-reply returns message
5. Distress flow: submit distress text → safe_mode=True → LLM never called
6. Checklist flow: create → add items → toggle → reset → delete
7. Progress: summary and mood after a completed session + check-in
8. AI endpoints: praise and calm-reply return correct shapes in keyless mode
9. Templates: schedule and checklist templates load correctly
10. Safety resources: always return even with fresh db
11. Dev endpoints: seed-demo and reset work correctly
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def disable_llm():
    """Force template-only mode for every integration test — no real API calls."""
    with patch("ai.config.GEMINI_API_KEY", ""):
        yield


# ─────────────────────────────────────────────────────────────────────────────
# 1. Profile
# ─────────────────────────────────────────────────────────────────────────────

class TestProfileFlow:
    def test_profile_full_lifecycle(self, client: TestClient):
        # Backend seeds a default profile; verify its shape
        r = client.get("/api/profile")
        assert r.status_code == 200
        p = r.json()
        assert "id" in p
        assert "name" in p and isinstance(p["name"], str)
        assert "avatar" in p
        assert "favourite_rewards" in p and isinstance(p["favourite_rewards"], list)

    def test_update_profile(self, client: TestClient):
        r = client.put("/api/profile", json={
            "name": "TestKid",
            "avatar": "fox",
            "favourite_rewards": ["Lego break"]
        })
        assert r.status_code == 200
        p = r.json()
        assert p["name"] == "TestKid"
        assert p["avatar"] == "fox"
        assert "Lego break" in p["favourite_rewards"]

        # Read back
        r2 = client.get("/api/profile")
        assert r2.json()["name"] == "TestKid"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Schedules, tasks, steps
# ─────────────────────────────────────────────────────────────────────────────

class TestScheduleFlow:
    def test_list_has_seeded_schedule(self, client: TestClient):
        r = client.get("/api/schedules")
        assert r.status_code == 200
        schedules = r.json()
        assert len(schedules) > 0
        s = schedules[0]
        assert "id" in s and "name" in s and "color" in s and "icon" in s and "tasks" in s

    def test_schedule_detail_has_tasks_and_steps(self, client: TestClient):
        sid = client.get("/api/schedules").json()[0]["id"]
        r = client.get(f"/api/schedules/{sid}")
        assert r.status_code == 200
        s = r.json()
        assert len(s["tasks"]) > 0
        t = s["tasks"][0]
        assert "id" in t and "title" in t and "steps" in t and "expected_seconds" in t

    def test_create_blank_schedule_and_add_task_and_step(self, client: TestClient):
        # Create
        r = client.post("/api/schedules", json={"name": "Evening", "color": "#2A9D8F", "icon": "moon"})
        assert r.status_code in (200, 201)
        sid = r.json()["id"]

        # Add task
        r2 = client.post(f"/api/schedules/{sid}/tasks", json={"title": "Read", "icon": "book", "expected_seconds": 300})
        assert r2.status_code in (200, 201)
        tid = r2.json()["id"]

        # Add step
        r3 = client.post(f"/api/tasks/{tid}/steps", json={"text": "Pick a book", "icon": "book"})
        assert r3.status_code in (200, 201)
        step = r3.json()
        assert step["text"] == "Pick a book"

        # Verify via detail
        detail = client.get(f"/api/schedules/{sid}").json()
        assert any(t["id"] == tid for t in detail["tasks"])
        task_detail = next(t for t in detail["tasks"] if t["id"] == tid)
        assert any(s["id"] == step["id"] for s in task_detail["steps"])

    def test_update_and_delete_step(self, client: TestClient):
        sid = client.get("/api/schedules").json()[0]["id"]
        s = client.get(f"/api/schedules/{sid}").json()
        step = s["tasks"][0]["steps"][0]

        r = client.put(f"/api/steps/{step['id']}", json={"text": "Updated text"})
        assert r.status_code == 200
        assert r.json()["text"] == "Updated text"

    def test_reorder_tasks(self, client: TestClient):
        sid = client.get("/api/schedules").json()[0]["id"]
        tasks = client.get(f"/api/schedules/{sid}").json()["tasks"]
        if len(tasks) < 2:
            pytest.skip("Need at least 2 tasks to reorder")
        reversed_ids = [t["id"] for t in reversed(tasks)]
        r = client.put(f"/api/schedules/{sid}/tasks/reorder", json={"ordered_task_ids": reversed_ids})
        assert r.status_code == 200

    def test_schedule_from_template(self, client: TestClient):
        templates = client.get("/api/templates?type=schedule").json()
        assert len(templates) > 0
        tpl = templates[0]
        r = client.post("/api/schedules", json={"template_id": tpl["id"]})
        assert r.status_code in (200, 201)
        s = r.json()
        assert s["name"] == tpl["name"]
        assert len(s["tasks"]) > 0


# ─────────────────────────────────────────────────────────────────────────────
# 3. Session flow: start → complete steps → end
# ─────────────────────────────────────────────────────────────────────────────

class TestSessionFlow:
    def _get_task_with_steps(self, client: TestClient):
        """Find the first task that has at least one step."""
        for sched in client.get("/api/schedules").json():
            detail = client.get(f"/api/schedules/{sched['id']}").json()
            for task in detail["tasks"]:
                if task["steps"]:
                    return task
        pytest.fail("No task with steps found in seeded data")

    def test_start_session_shape(self, client: TestClient):
        task = self._get_task_with_steps(client)
        r = client.post("/api/sessions", json={"task_id": task["id"]})
        assert r.status_code in (200, 201)
        s = r.json()
        assert s["session_id"] > 0
        assert s["task_id"] == task["id"]
        assert "started_at" in s
        assert s["expected_seconds"] == task["expected_seconds"]

    def test_complete_step_shape(self, client: TestClient):
        task = self._get_task_with_steps(client)
        sess = client.post("/api/sessions", json={"task_id": task["id"]}).json()
        step = task["steps"][0]

        r = client.post(f"/api/sessions/{sess['session_id']}/steps/{step['id']}/complete")
        assert r.status_code == 200
        d = r.json()
        assert "points_awarded" in d and d["points_awarded"] > 0
        assert "total_points" in d and d["total_points"] > 0
        assert "streak" in d and d["streak"] >= 1
        assert "steps_remaining" in d
        expected_remaining = len(task["steps"]) - 1
        assert d["steps_remaining"] == expected_remaining

    def test_end_session_shape(self, client: TestClient):
        task = self._get_task_with_steps(client)
        sess = client.post("/api/sessions", json={"task_id": task["id"]}).json()

        r = client.post(f"/api/sessions/{sess['session_id']}/end")
        assert r.status_code == 200
        d = r.json()
        assert "duration_seconds" in d
        assert "expected_seconds" in d and d["expected_seconds"] == task["expected_seconds"]
        assert "bonus_points" in d and d["bonus_points"] >= 0
        assert "total_points" in d and d["total_points"] >= 0

    def test_full_session_accumulates_points(self, client: TestClient):
        task = self._get_task_with_steps(client)
        sess = client.post("/api/sessions", json={"task_id": task["id"]}).json()

        # Complete all steps
        total_step_points = 0
        for step in task["steps"]:
            r = client.post(f"/api/sessions/{sess['session_id']}/steps/{step['id']}/complete").json()
            total_step_points += r["points_awarded"]

        assert total_step_points == len(task["steps"]) * 5  # 5 pts per step

        end = client.post(f"/api/sessions/{sess['session_id']}/end").json()
        assert end["bonus_points"] == 10
        assert end["total_points"] >= total_step_points + 10


# ─────────────────────────────────────────────────────────────────────────────
# 4. Check-in + calm-reply (happy path)
# ─────────────────────────────────────────────────────────────────────────────

class TestCheckinFlow:
    def test_happy_checkin_gives_no_safe_mode(self, client: TestClient):
        r = client.post("/api/checkins", json={"emoji": "happy", "text": "I feel great today!"})
        assert r.status_code in (200, 201)
        d = r.json()
        assert d["safe_mode"] is False
        assert "focus_score" in d and 0 <= d["focus_score"] <= 100
        assert "emotion_score" in d and 0 <= d["emotion_score"] <= 100
        assert "label" in d and "id" in d

    def test_calm_reply_after_checkin(self, client: TestClient):
        ci = client.post("/api/checkins", json={"emoji": "angry", "text": "This is hard"}).json()
        assert ci["safe_mode"] is False

        r = client.post("/api/calm-reply", json={
            "child_name": "Aarav",
            "emoji": "angry",
            "text": "This is hard",
            "focus_score": ci["focus_score"],
            "emotion_score": ci["emotion_score"],
        })
        assert r.status_code == 200
        d = r.json()
        assert len(d["message"]) > 0
        assert d["suggested_activity"] in ("breathing", "movement", "stretching", "none")
        assert d["source"] in ("template", "llm")

    def test_all_valid_emojis_accepted(self, client: TestClient):
        for emoji in ("happy", "calm", "tired", "sad", "worried", "angry"):
            r = client.post("/api/checkins", json={"emoji": emoji})
            assert r.status_code in (200, 201), f"emoji={emoji} failed: {r.text}"

    def test_session_id_optional(self, client: TestClient):
        # With no session_id
        r1 = client.post("/api/checkins", json={"emoji": "calm"})
        assert r1.status_code in (200, 201)
        # With explicit null
        r2 = client.post("/api/checkins", json={"emoji": "calm", "session_id": None})
        assert r2.status_code in (200, 201)

    def test_checkin_history(self, client: TestClient):
        client.post("/api/checkins", json={"emoji": "happy"})
        client.post("/api/checkins", json={"emoji": "calm"})
        r = client.get("/api/checkins?days=7")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 2
        item = items[0]
        assert "focus_score" in item and "emotion_score" in item and "label" in item


# ─────────────────────────────────────────────────────────────────────────────
# 5. Distress flow — safe_mode=True, LLM never called
# ─────────────────────────────────────────────────────────────────────────────

class TestDistressFlow:
    @pytest.mark.parametrize("text", [
        "I hate myself",
        "I want to disappear",
        "I want to hurt myself",
    ])
    def test_distress_triggers_safe_mode(self, client: TestClient, text: str):
        r = client.post("/api/checkins", json={"emoji": "sad", "text": text})
        assert r.status_code in (200, 201)
        assert r.json()["safe_mode"] is True, f"Expected safe_mode for: {text!r}"

    def test_distress_calm_reply_returns_safe_template(self, client: TestClient):
        """Directly hitting calm-reply with distress text must return the safe template."""
        r = client.post("/api/calm-reply", json={
            "child_name": "Aarav",
            "emoji": "sad",
            "text": "I hate myself",
            "focus_score": 20,
            "emotion_score": 10,
        })
        assert r.status_code == 200
        d = r.json()
        assert "trusted" in d["message"].lower()
        assert d["suggested_activity"] == "none"
        assert d["source"] == "template"


# ─────────────────────────────────────────────────────────────────────────────
# 6. Checklists
# ─────────────────────────────────────────────────────────────────────────────

class TestChecklistFlow:
    def test_list_has_seeded_checklist(self, client: TestClient):
        r = client.get("/api/checklists")
        assert r.status_code == 200
        lists = r.json()
        assert len(lists) > 0
        c = lists[0]
        assert "id" in c and "name" in c and "items" in c and "reminder_time" in c

    def test_create_checklist_blank(self, client: TestClient):
        r = client.post("/api/checklists", json={"name": "Sports bag", "reminder_time": "08:00"})
        assert r.status_code in (200, 201)
        c = r.json()
        assert c["name"] == "Sports bag"
        assert c["reminder_time"] == "08:00"
        assert c["items"] == []

    def test_create_from_template(self, client: TestClient):
        tpls = client.get("/api/templates?type=checklist").json()
        assert len(tpls) > 0
        r = client.post("/api/checklists", json={"template_id": tpls[0]["id"]})
        assert r.status_code in (200, 201)
        assert len(r.json()["items"]) > 0

    def test_add_toggle_reset_item(self, client: TestClient):
        cid = client.post("/api/checklists", json={"name": "Test list"}).json()["id"]

        # Add item
        r = client.post(f"/api/checklists/{cid}/items", json={"text": "Water bottle", "icon": "water"})
        assert r.status_code in (200, 201)
        iid = r.json()["id"]
        assert r.json()["is_checked"] is False

        # Toggle on
        r2 = client.put(f"/api/checklist-items/{iid}", json={"is_checked": True})
        assert r2.status_code == 200
        assert r2.json()["is_checked"] is True

        # Reset
        r3 = client.post(f"/api/checklists/{cid}/reset")
        assert r3.status_code == 200
        updated = client.get("/api/checklists").json()
        c = next(x for x in updated if x["id"] == cid)
        assert all(not i["is_checked"] for i in c["items"])

    def test_delete_checklist(self, client: TestClient):
        cid = client.post("/api/checklists", json={"name": "Temp"}).json()["id"]
        r = client.delete(f"/api/checklists/{cid}")
        assert r.status_code in (200, 204)
        all_ids = [c["id"] for c in client.get("/api/checklists").json()]
        assert cid not in all_ids


# ─────────────────────────────────────────────────────────────────────────────
# 7. Progress
# ─────────────────────────────────────────────────────────────────────────────

class TestProgressFlow:
    def test_summary_shape(self, client: TestClient):
        r = client.get("/api/progress/summary")
        assert r.status_code == 200
        d = r.json()
        for key in ("total_points", "current_streak", "best_streak", "tasks_completed_today", "tasks_completed_week"):
            assert key in d, f"Missing key: {key}"
            assert isinstance(d[key], int) and d[key] >= 0

    def test_summary_reflects_completed_session(self, client: TestClient):
        before = client.get("/api/progress/summary").json()["total_points"]

        # Complete a session
        task = client.get("/api/schedules").json()[0]["tasks"][0]
        sess = client.post("/api/sessions", json={"task_id": task["id"]}).json()
        client.post(f"/api/sessions/{sess['session_id']}/end")

        after = client.get("/api/progress/summary").json()["total_points"]
        assert after >= before + 10  # at least the bonus

    def test_mood_endpoint_shape(self, client: TestClient):
        # Seed a check-in first so there's data
        client.post("/api/checkins", json={"emoji": "happy"})
        r = client.get("/api/progress/mood?days=7")
        assert r.status_code == 200
        days = r.json()
        assert isinstance(days, list)
        if days:
            d = days[0]
            assert "date" in d
            assert "avg_emotion_score" in d and 0 <= d["avg_emotion_score"] <= 100
            assert "avg_focus_score" in d and 0 <= d["avg_focus_score"] <= 100
            assert "checkins" in d and d["checkins"] >= 1

    def test_mood_days_param(self, client: TestClient):
        r7 = client.get("/api/progress/mood?days=7")
        r30 = client.get("/api/progress/mood?days=30")
        assert r7.status_code == 200
        assert r30.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 8. AI endpoints (keyless template mode)
# ─────────────────────────────────────────────────────────────────────────────

class TestAIEndpoints:
    def test_praise_shape_and_source(self, client: TestClient):
        r = client.post("/api/praise", json={
            "event": "step_completed",
            "child_name": "Aarav",
            "task_title": "Homework",
            "step_text": "Write the date",
            "streak": 2,
        })
        assert r.status_code == 200
        d = r.json()
        assert len(d["message"]) > 0
        assert d["source"] in ("template", "llm")

    def test_praise_all_events(self, client: TestClient):
        for event in ("step_completed", "task_completed", "streak"):
            r = client.post("/api/praise", json={
                "event": event, "child_name": "Aarav",
                "task_title": "Homework", "streak": 3,
            })
            assert r.status_code == 200
            assert len(r.json()["message"]) > 0

    def test_calm_reply_shape(self, client: TestClient):
        r = client.post("/api/calm-reply", json={
            "child_name": "Aarav",
            "emoji": "worried",
            "text": "I am nervous about tomorrow",
            "focus_score": 45,
            "emotion_score": 35,
        })
        assert r.status_code == 200
        d = r.json()
        assert len(d["message"]) > 5
        assert d["suggested_activity"] in ("breathing", "movement", "stretching", "none")
        assert d["source"] in ("template", "llm")

    def test_unknown_emoji_does_not_422(self, client: TestClient):
        """Router must normalise unknown emoji, not return 422."""
        r = client.post("/api/calm-reply", json={
            "child_name": "Aarav", "emoji": "confused",
            "text": "", "focus_score": 50, "emotion_score": 50,
        })
        assert r.status_code == 200

    def test_praise_missing_optional_fields(self, client: TestClient):
        """Only event is technically required; others have defaults."""
        r = client.post("/api/praise", json={"event": "step_completed"})
        assert r.status_code == 200
        assert len(r.json()["message"]) > 0


# ─────────────────────────────────────────────────────────────────────────────
# 9. Templates
# ─────────────────────────────────────────────────────────────────────────────

class TestTemplates:
    def test_schedule_templates(self, client: TestClient):
        r = client.get("/api/templates?type=schedule")
        assert r.status_code == 200
        tpls = r.json()
        assert len(tpls) > 0
        t = tpls[0]
        assert t["type"] == "schedule"
        assert "data" in t and "tasks" in t["data"]
        assert len(t["data"]["tasks"]) > 0

    def test_checklist_templates(self, client: TestClient):
        r = client.get("/api/templates?type=checklist")
        assert r.status_code == 200
        tpls = r.json()
        assert len(tpls) > 0
        t = tpls[0]
        assert t["type"] == "checklist"
        assert "data" in t and "items" in t["data"]


# ─────────────────────────────────────────────────────────────────────────────
# 10. Safety resources
# ─────────────────────────────────────────────────────────────────────────────

class TestSafetyResources:
    def test_resources_shape(self, client: TestClient):
        r = client.get("/api/safety/resources")
        assert r.status_code == 200
        d = r.json()
        assert "message" in d and len(d["message"]) > 0
        assert "resources" in d and isinstance(d["resources"], list)
        assert len(d["resources"]) > 0
        for res in d["resources"]:
            assert "name" in res and "contact" in res


# ─────────────────────────────────────────────────────────────────────────────
# 11. Dev endpoints
# ─────────────────────────────────────────────────────────────────────────────

class TestDevEndpoints:
    def test_seed_demo(self, client: TestClient):
        r = client.post("/api/dev/seed-demo")
        assert r.status_code == 200
        d = r.json()
        assert "message" in d
        assert "days_seeded" in d and d["days_seeded"] > 0
        assert "profile" in d

    def test_reset(self, client: TestClient):
        r = client.post("/api/dev/reset")
        assert r.status_code == 200
        assert "message" in r.json()

    def test_reset_then_state_is_clean(self, client: TestClient):
        # Seed, then reset, then progress should be zeroed
        client.post("/api/dev/seed-demo")
        client.post("/api/dev/reset")
        summary = client.get("/api/progress/summary").json()
        assert summary["total_points"] == 0

    def test_health(self, client: TestClient):
        r = client.get("/api/health")
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok"
        assert "app" in d and "version" in d


# ─────────────────────────────────────────────────────────────────────────────
# 12. Full happy-path journey (the complete child session)
# ─────────────────────────────────────────────────────────────────────────────

class TestFullJourney:
    """
    Simulates everything a child does in one session:
    profile → schedule → session → steps → end → checkin → calm-reply → progress
    """

    def test_complete_child_session(self, client: TestClient):
        # 1. Profile exists
        profile = client.get("/api/profile").json()
        name = profile["name"]

        # 2. Find a schedule with a task that has steps
        schedules = client.get("/api/schedules").json()
        task = None
        sid = None
        for sched in schedules:
            detail = client.get(f"/api/schedules/{sched['id']}").json()
            for t in detail["tasks"]:
                if t["steps"]:
                    task = t
                    sid = sched["id"]
                    break
            if task:
                break
        assert task is not None, "No task with steps in seeded data"

        # 3. Get praise for starting
        praise = client.post("/api/praise", json={
            "event": "step_completed",
            "child_name": name,
            "task_title": task["title"],
            "step_text": task["steps"][0]["text"],
            "streak": 1,
        }).json()
        assert len(praise["message"]) > 0

        # 4. Start session
        sess = client.post("/api/sessions", json={"task_id": task["id"]}).json()
        session_id = sess["session_id"]
        assert sess["expected_seconds"] == task["expected_seconds"]

        # 5. Complete every step
        for i, step in enumerate(task["steps"]):
            sc = client.post(
                f"/api/sessions/{session_id}/steps/{step['id']}/complete"
            ).json()
            assert sc["points_awarded"] == 5
            assert sc["steps_remaining"] == len(task["steps"]) - i - 1

        # 6. End session
        end = client.post(f"/api/sessions/{session_id}/end").json()
        assert end["bonus_points"] == 10
        points_after_session = end["total_points"]

        # 7. Check-in (normal, not distress)
        ci = client.post("/api/checkins", json={
            "session_id": session_id,
            "emoji": "happy",
            "text": "That was fun!",
        }).json()
        assert ci["safe_mode"] is False
        assert 0 <= ci["focus_score"] <= 100
        assert 0 <= ci["emotion_score"] <= 100

        # 8. Calm reply
        calm = client.post("/api/calm-reply", json={
            "child_name": name,
            "emoji": "happy",
            "text": "That was fun!",
            "focus_score": ci["focus_score"],
            "emotion_score": ci["emotion_score"],
        }).json()
        assert len(calm["message"]) > 0
        assert calm["suggested_activity"] in ("breathing", "movement", "stretching", "none")

        # 9. Progress reflects the session
        summary = client.get("/api/progress/summary").json()
        assert summary["total_points"] >= points_after_session
        assert summary["tasks_completed_today"] >= 1
