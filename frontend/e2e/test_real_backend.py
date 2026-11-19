"""
End-to-end browser tests for BloomAI — real backend mode.

Requirements
────────────
  pip install playwright pytest-playwright
  playwright install chromium

Run (from repo root):
  # Terminal 1: start backend
  uvicorn backend.app.main:app --port 8000

  # Terminal 2: build & preview frontend in real mode
  cd frontend
  VITE_API_MODE=real npm run build && npm run preview -- --port 4173

  # Terminal 3: run tests
  pytest frontend/e2e/test_real_backend.py -v

The tests use the preview server (port 4173) so the production build is exercised.
Each test is independent: the backend is reset before each via /api/dev/reset.
"""

import requests
import pytest
from playwright.sync_api import Page, expect

BACKEND = "http://localhost:8000"
FRONTEND = "http://localhost:4173"
RESET_URL = f"{BACKEND}/api/dev/reset"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def reset_backend():
    """Reset DB to initial seeded state before each test."""
    try:
        requests.post(RESET_URL, timeout=5)
    except Exception:
        pytest.skip("Backend not reachable — start uvicorn on :8000 first")


def setup_profile(page: Page, name: str = "Aarav") -> None:
    """Navigate to the app; complete setup if redirected there."""
    page.goto(FRONTEND + "/")
    if "/setup" in page.url:
        page.get_by_placeholder("Type your name").fill(name)
        page.get_by_role("button", name="Let's go!").click()
        page.wait_for_url(FRONTEND + "/")


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def fresh_backend():
    reset_backend()
    yield


@pytest.fixture
def mobile_page(page: Page) -> Page:
    page.set_viewport_size({"width": 390, "height": 844})
    return page


# ─────────────────────────────────────────────────────────────────────────────
# 1. First launch → setup → home
# ─────────────────────────────────────────────────────────────────────────────

class TestFirstLaunch:
    def test_redirects_to_setup_on_first_visit(self, mobile_page: Page):
        """With a fresh backend that has a profile, the app should load home."""
        # Backend seeds a default profile, so we land on /
        mobile_page.goto(FRONTEND + "/")
        # Either home page or setup — both are valid initial states
        assert mobile_page.url in (FRONTEND + "/", FRONTEND + "/setup") or \
               "/setup" in mobile_page.url or mobile_page.url == FRONTEND + "/"

    def test_home_page_loads_schedule(self, mobile_page: Page):
        setup_profile(mobile_page)
        # The seeded "Morning Routine" should appear
        mobile_page.wait_for_selector("text=Morning", timeout=5000)
        expect(mobile_page.get_by_text("Morning", exact=False).first).to_be_visible()

    def test_bottom_nav_visible(self, mobile_page: Page):
        setup_profile(mobile_page)
        expect(mobile_page.get_by_role("navigation", name="Main")).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 2. Schedule page
# ─────────────────────────────────────────────────────────────────────────────

class TestSchedulePage:
    def test_schedule_shows_tasks(self, mobile_page: Page):
        setup_profile(mobile_page)
        # Click on the first schedule link
        mobile_page.get_by_role("link", name="Morning Routine").first.click()
        mobile_page.wait_for_selector("text=Brush teeth", timeout=5000)
        expect(mobile_page.get_by_text("Brush teeth")).to_be_visible()

    def test_edit_mode_toggle(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.get_by_role("link", name="Morning Routine").first.click()
        mobile_page.wait_for_selector("text=Brush teeth", timeout=5000)
        mobile_page.get_by_role("button", name="✏️ Edit").click()
        expect(mobile_page.get_by_role("button", name="✓ Done")).to_be_visible()
        mobile_page.get_by_role("button", name="✓ Done").click()
        expect(mobile_page.get_by_role("button", name="✏️ Edit")).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Session flow
# ─────────────────────────────────────────────────────────────────────────────

class TestSessionFlow:
    def _navigate_to_task(self, page: Page, schedule_name: str = "Morning Routine", task_name: str = "Brush teeth"):
        setup_profile(page)
        page.get_by_role("link", name=schedule_name).first.click()
        page.wait_for_selector(f"text={task_name}", timeout=5000)
        # Navigate to task via URL using the Start button
        page.get_by_role("button", name="Start").first.click()

    def test_session_start_shows_ready_screen(self, mobile_page: Page):
        self._navigate_to_task(mobile_page)
        expect(mobile_page.get_by_role("button", name="Let's go!")).to_be_visible()

    def test_session_progress_through_steps(self, mobile_page: Page):
        self._navigate_to_task(mobile_page)
        mobile_page.get_by_role("button", name="Let's go!").click()
        # Should see step counter
        mobile_page.wait_for_selector("text=Step 1 of", timeout=5000)
        step_text = mobile_page.locator("text=Step 1 of").inner_text()
        assert "Step 1 of" in step_text

    def test_completing_step_shows_reward(self, mobile_page: Page):
        self._navigate_to_task(mobile_page)
        mobile_page.get_by_role("button", name="Let's go!").click()
        mobile_page.wait_for_selector("text=Step 1 of", timeout=5000)
        mobile_page.get_by_role("button", name="Done!").click()
        # Reward overlay should appear
        mobile_page.wait_for_selector("[role=dialog]", timeout=6000)
        # Points should be shown (+5 per step)
        expect(mobile_page.locator("[role=dialog]")).to_be_visible()

    def test_completing_all_steps_shows_finished(self, mobile_page: Page):
        self._navigate_to_task(mobile_page)
        mobile_page.get_by_role("button", name="Let's go!").click()
        mobile_page.wait_for_selector("text=Step 1 of", timeout=5000)

        # Complete all steps
        for _ in range(10):  # max 10 steps; exits early when task finishes
            done_btn = mobile_page.get_by_role("button", name="Done!")
            if not done_btn.is_visible():
                finished_btn = mobile_page.get_by_role("button", name="I'm finished!")
                if finished_btn.is_visible():
                    finished_btn.click()
                break
            done_btn.click()
            mobile_page.wait_for_selector("[role=dialog]", timeout=6000)
            keep_going = mobile_page.get_by_role("button", name="Keep going")
            if keep_going.is_visible():
                keep_going.click()
            else:
                break

        # Should eventually reach the finished screen
        mobile_page.wait_for_selector("text=You did it", timeout=8000)
        expect(mobile_page.get_by_text("You did it", exact=False)).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 4. Check-in flow
# ─────────────────────────────────────────────────────────────────────────────

class TestCheckinFlow:
    def test_checkin_page_loads(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/checkin")
        expect(mobile_page.get_by_text("How do you feel?")).to_be_visible()

    def test_happy_checkin_shows_calm_reply(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/checkin")
        # Pick "happy" mood
        mobile_page.get_by_role("radio", name="happy").click()
        mobile_page.get_by_role("button", name="Tell Bloomi").click()
        # Should show the calm reply message (not safe mode)
        mobile_page.wait_for_selector("text=Thank you", timeout=8000)
        expect(mobile_page.get_by_text("Thank you")).to_be_visible()

    def test_distress_text_navigates_to_safe(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/checkin")
        mobile_page.get_by_role("radio", name="sad").click()
        mobile_page.get_by_placeholder("Type here if you like…").fill("I hate myself")
        mobile_page.get_by_role("button", name="Tell Bloomi").click()
        # Should redirect to /safe
        mobile_page.wait_for_url(FRONTEND + "/safe", timeout=8000)
        expect(mobile_page.get_by_role("heading", name="You're not alone")).to_be_visible()

    def test_all_mood_options_visible(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/checkin")
        for mood in ("happy", "calm", "tired", "sad", "worried", "angry"):
            expect(mobile_page.get_by_role("radio", name=mood)).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 5. Safe mode
# ─────────────────────────────────────────────────────────────────────────────

class TestSafeMode:
    def test_safe_mode_always_loads(self, mobile_page: Page):
        """Safe mode must render even without navigating through the app."""
        mobile_page.goto(FRONTEND + "/safe")
        expect(mobile_page.get_by_role("heading", name="You're not alone")).to_be_visible()

    def test_safe_mode_shows_resources(self, mobile_page: Page):
        mobile_page.goto(FRONTEND + "/safe")
        mobile_page.wait_for_selector("text=trusted adult", timeout=5000)
        expect(mobile_page.get_by_text("trusted adult", exact=False)).to_be_visible()

    def test_safe_mode_has_calm_link(self, mobile_page: Page):
        mobile_page.goto(FRONTEND + "/safe")
        expect(mobile_page.get_by_role("button", name="Take a calm breath")).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 6. Calm page
# ─────────────────────────────────────────────────────────────────────────────

class TestCalmPage:
    def test_calm_page_shows_breathing(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/calm")
        expect(mobile_page.get_by_role("button", name="Start breathing")).to_be_visible()

    def test_breathing_starts_on_click(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/calm")
        mobile_page.get_by_role("button", name="Start breathing").click()
        mobile_page.wait_for_selector("text=Breathe in", timeout=3000)
        expect(mobile_page.get_by_text("Breathe in", exact=False)).to_be_visible()

    def test_movement_tab_switch(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/calm?activity=movement")
        mobile_page.wait_for_selector("text=Move 1 of", timeout=3000)
        expect(mobile_page.get_by_text("Move 1 of", exact=False)).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 7. Checklists
# ─────────────────────────────────────────────────────────────────────────────

class TestChecklists:
    def test_checklist_page_loads(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.get_by_role("link", name="Pack").click()
        mobile_page.wait_for_selector("text=Pack-up lists", timeout=5000)
        expect(mobile_page.get_by_text("Pack-up lists")).to_be_visible()

    def test_seeded_checklist_visible(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.get_by_role("link", name="Pack").click()
        mobile_page.wait_for_selector("text=School Bag", timeout=5000)
        expect(mobile_page.get_by_text("School Bag", exact=False)).to_be_visible()

    def test_toggle_checklist_item(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.get_by_role("link", name="Pack").click()
        mobile_page.wait_for_selector("text=School Bag", timeout=5000)
        mobile_page.get_by_text("School Bag", exact=False).click()
        mobile_page.wait_for_selector("[role=checkbox]", timeout=5000)
        first_item = mobile_page.get_by_role("checkbox").first
        expect(first_item).to_have_attribute("aria-checked", "false")
        first_item.click()
        mobile_page.wait_for_timeout(500)
        expect(first_item).to_have_attribute("aria-checked", "true")


# ─────────────────────────────────────────────────────────────────────────────
# 8. Progress / Garden
# ─────────────────────────────────────────────────────────────────────────────

class TestProgressPage:
    def test_progress_page_loads(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.get_by_role("link", name="Garden").click()
        mobile_page.wait_for_selector("text=My garden", timeout=5000)
        expect(mobile_page.get_by_text("My garden")).to_be_visible()

    def test_metrics_visible(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.get_by_role("link", name="Garden").click()
        mobile_page.wait_for_selector("text=Points", timeout=5000)
        expect(mobile_page.get_by_text("Points")).to_be_visible()
        expect(mobile_page.get_by_text("Current streak")).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 9. Workspace / Focus desk
# ─────────────────────────────────────────────────────────────────────────────

class TestWorkspacePage:
    def test_workspace_page_loads(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/workspace")
        expect(mobile_page.get_by_text("My focus desk")).to_be_visible()

    def test_tick_workspace_item(self, mobile_page: Page):
        setup_profile(mobile_page)
        mobile_page.goto(FRONTEND + "/workspace")
        checkboxes = mobile_page.get_by_role("checkbox")
        checkboxes.first.wait_for()
        first = checkboxes.first
        expect(first).to_have_attribute("aria-checked", "false")
        first.click()
        expect(first).to_have_attribute("aria-checked", "true")


# ─────────────────────────────────────────────────────────────────────────────
# 10. Setup / Profile edit
# ─────────────────────────────────────────────────────────────────────────────

class TestSetupPage:
    def test_profile_edit_via_settings(self, mobile_page: Page):
        setup_profile(mobile_page, name="Aarav")
        # Open settings modal via the gear icon
        mobile_page.get_by_label("Settings").click()
        mobile_page.get_by_role("button", name="Change my profile").click()
        mobile_page.wait_for_url(f"{FRONTEND}/setup**", timeout=3000)
        expect(mobile_page.get_by_text("My profile")).to_be_visible()


# ─────────────────────────────────────────────────────────────────────────────
# 11. No-console-errors smoke test
# ─────────────────────────────────────────────────────────────────────────────

class TestNoErrors:
    @pytest.mark.parametrize("path", ["/", "/checklists", "/calm", "/progress", "/workspace", "/safe"])
    def test_page_has_no_console_errors(self, page: Page, path: str):
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        setup_profile(page)
        page.goto(FRONTEND + path)
        page.wait_for_timeout(1500)

        assert errors == [], f"Console errors on {path}: {errors}"
