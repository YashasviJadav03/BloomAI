from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    page = b.new_context(viewport={"width":390,"height":844}).new_page()
    page.on("console", lambda m: print("console", m.type, m.text))
    page.on("pageerror", lambda e: print("pageerror", e))
    page.goto("http://localhost:4173/setup")
    page.get_by_placeholder("Type your name").fill("A"); page.get_by_role("button", name="Let's go!").click()
    page.wait_for_url("http://localhost:4173/")
    page.goto("http://localhost:4173/checklists")
    page.get_by_role("link", name="After-school pack-up").click()
    items = page.get_by_role("checkbox")
    for i in range(items.count()):
        items.nth(i).click(); print(i, [x.get_attribute("aria-checked") for x in items.all()])
    page.wait_for_timeout(800)
    print("final", [x.get_attribute("aria-checked") for x in page.get_by_role("checkbox").all()])
    cb = page.get_by_role("checkbox").first
    print("before", cb.get_attribute("aria-checked"))
    cb.click(); page.wait_for_timeout(600)
    print("after", page.get_by_role("checkbox").first.get_attribute("aria-checked"))
    print(page.locator("main").inner_text()[:200])
    b.close()
