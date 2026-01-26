from playwright.sync_api import sync_playwright
import os

def verify_skip_link_functional():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file://{os.getcwd()}/index.html")

        # 1. Verify we can focus the skip link
        print("Focusing skip link...")
        page.focus('a[href="#main-content"]')

        # 2. Verify it becomes visible
        is_visible = page.is_visible('a[href="#main-content"]')
        if is_visible:
            print("SUCCESS: Skip link became visible on focus.")
        else:
            print("FAILURE: Skip link did not become visible.")
            exit(1)

        # 3. Verify activation
        print("Pressing Enter...")
        page.keyboard.press("Enter")

        # 4. Verify target focus
        active_id = page.evaluate("document.activeElement.id")
        print(f"Active ID: {active_id}")

        if active_id == "main-content":
             print("SUCCESS: Skipped to main content.")
        else:
             print("FAILURE: Did not skip to main content.")
             exit(1)

        browser.close()

if __name__ == "__main__":
    verify_skip_link_functional()
