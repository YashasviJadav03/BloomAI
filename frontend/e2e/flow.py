import sys
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:4173"
errors = []

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    # 1. first launch -> setup
    page.goto(BASE + "/")
    expect(page).to_have_url(BASE + "/setup")
    page.screenshot(path="/tmp/shots/01_setup.png")
    page.get_by_placeholder("Type your name").fill("Aarav")
    page.get_by_role("radio", name="panda").click()
    page.get_by_role("button", name="Let's go!").click()
    expect(page.get_by_role("heading", name="Hi, Aarav!")).to_be_visible()
    page.get_by_role("link", name="Morning").wait_for()
    page.screenshot(path="/tmp/shots/02_home.png", full_page=True)

    # 2. schedule
    page.get_by_role("link", name="Morning").click()
    expect(page.get_by_role("heading", name="Morning")).to_be_visible()
    page.screenshot(path="/tmp/shots/03_schedule.png", full_page=True)

    # 3. session: Brush teeth (4 steps)
    page.get_by_role("link", name="Brush teeth").click()
    page.get_by_role("button", name="Let's go!").click()
    expect(page.get_by_text("Step 1 of 4")).to_be_visible()
    page.screenshot(path="/tmp/shots/04_step.png")
    for i in range(3):
        page.get_by_role("button", name="✓ Done!").click()
        expect(page.get_by_role("dialog", name="Reward")).to_be_visible()
        if i == 0:
            page.wait_for_timeout(700); page.screenshot(path="/tmp/shots/05_reward.png")
        page.get_by_role("button", name="Keep going").click()
        expect(page.get_by_text(f"Step {i+2} of 4")).to_be_visible()
    page.get_by_role("button", name="✓ Done!").click()
    expect(page.get_by_role("dialog", name="Reward")).to_be_visible()
    page.screenshot(path="/tmp/shots/06_task_reward.png")
    page.get_by_role("button", name="Keep going").click()
    expect(page.get_by_role("heading", name="You did it, Aarav!")).to_be_visible()
    page.screenshot(path="/tmp/shots/07_finished.png")
    # points: 4 steps*5 + bonus 10 = 30
    expect(page.get_by_label("30 points")).to_be_visible()

    # transition to next task
    page.get_by_role("button", name="Next: Get dressed").click()
    expect(page.get_by_role("heading", name="Get dressed")).to_be_visible()
    page.screenshot(path="/tmp/shots/08_transition.png")
    page.get_by_role("button", name="I'm ready").click()
    expect(page.get_by_role("button", name="Let's go!")).to_be_visible()   # ready screen for next task

    # back to schedule: first task shows done
    page.go_back(); page.go_back() if "task" in page.url else None
    page.goto(BASE + "/")
    page.get_by_role("link", name="Morning").click()
    expect(page.get_by_text("✅").first).to_be_visible()

    # 4. schedule edit mode: reorder + add
    page.get_by_role("button", name="✏️ Edit").click()
    page.get_by_role("button", name="Move Get dressed up").click()
    page.screenshot(path="/tmp/shots/09_edit.png", full_page=True)
    first = page.locator("ol > li").first.inner_text()
    assert "Get dressed" in first, first
    page.get_by_role("button", name="Edit Eat breakfast").click()
    expect(page.get_by_role("heading", name="Tiny steps")).to_be_visible()
    page.get_by_label("New step").fill("Say thank you")
    page.get_by_role("button", name="Add", exact=True).click()
    expect(page.get_by_role("textbox", name="Step 4", exact=True)).to_be_visible()
    page.screenshot(path="/tmp/shots/10_taskedit.png", full_page=True)

    # 5. checklist
    page.goto(BASE + "/checklists")
    page.get_by_role("link", name="After-school pack-up").click()
    items = page.get_by_role("checkbox")
    items.first.wait_for()
    n = items.count()
    for i in range(n): items.nth(i).click()
    expect(page.get_by_text("All packed!")).to_be_visible()
    page.screenshot(path="/tmp/shots/11_checklist_done.png", full_page=True)

    # 6. calm
    page.goto(BASE + "/calm")
    page.get_by_role("button", name="Start breathing").click()
    expect(page.get_by_text("Breathe in…")).to_be_visible()
    page.screenshot(path="/tmp/shots/12_breathing.png")
    page.get_by_role("tab", name="🤸 Move").click()
    expect(page.get_by_text("Move 1 of 6")).to_be_visible()

    # 7. safe mode (direct load)
    page.goto(BASE + "/safe")
    expect(page.get_by_role("heading", name="You're not alone")).to_be_visible()
    page.screenshot(path="/tmp/shots/13_safe.png", full_page=True)

    # 8. workspace
    page.goto(BASE + "/workspace")
    page.get_by_role("checkbox").first.click()
    page.screenshot(path="/tmp/shots/14_workspace.png", full_page=True)

    # 9. tablet layout
    page.set_viewport_size({"width": 820, "height": 1180})
    page.goto(BASE + "/")
    page.screenshot(path="/tmp/shots/15_home_tablet.png")

    b.close()

print("ERRORS:", errors if errors else "none")
