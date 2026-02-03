import os
from playwright.sync_api import sync_playwright, expect

def verify_modal_dismiss():
    cwd = os.getcwd()
    file_path = f"file://{cwd}/index.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set viewport to ensure coordinates are consistent
        page.set_viewport_size({"width": 1280, "height": 720})

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # --- Test About Modal ---
        print("Testing About Modal...")
        page.get_by_role("button", name="About This Game").click()
        about_modal = page.locator("#about-modal")
        expect(about_modal).to_be_visible()

        # Negative Test: Click inside content (center)
        print("  Clicking inside content (should stay open)...")
        page.mouse.click(640, 360)
        expect(about_modal).to_be_visible()

        # Positive Test: Click backdrop (top-left)
        print("  Clicking backdrop (should close)...")
        page.mouse.click(10, 10)
        expect(about_modal).to_be_hidden()

        # Take screenshot of closed state
        print("Taking screenshot...")
        if not os.path.exists("verification"):
            os.makedirs("verification")
        page.screenshot(path="verification/modal_closed.png")

        # --- Test Help Modal ---
        print("Testing Help Modal...")
        page.get_by_role("button", name="Help").click()
        help_modal = page.locator("#help-modal")
        expect(help_modal).to_be_visible()

        print("  Clicking backdrop...")
        page.mouse.click(10, 10)
        expect(help_modal).to_be_hidden()

        # --- Test Settings Modal ---
        print("Testing Settings Modal...")
        page.get_by_role("button", name="Settings").click()
        settings_modal = page.locator("#settings-modal")
        expect(settings_modal).to_be_visible()

        print("  Clicking backdrop...")
        page.mouse.click(10, 10)
        expect(settings_modal).to_be_hidden()

        print("Verification Successful!")
        browser.close()

if __name__ == "__main__":
    verify_modal_dismiss()
