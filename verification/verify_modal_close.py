import os
import re
from playwright.sync_api import sync_playwright, expect

def verify_modal_close():
    # Use absolute path for file:// protocol
    cwd = os.getcwd()
    file_path = f"file://{cwd}/index.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # 1. Open About Modal
        print("Opening About Modal...")
        page.get_by_role("button", name="About This Game").click()

        # 2. Check if Modal is visible
        about_modal = page.locator("#about-modal")
        expect(about_modal).to_be_visible()
        # Ensure 'hidden' class is removed
        expect(about_modal).not_to_have_class(re.compile(r"hidden"))

        # Take screenshot of open modal
        if not os.path.exists("verification"):
            os.makedirs("verification")
        page.screenshot(path="verification/modal_open.png")

        # 3. Click on the backdrop (outside the inner content)
        # The modal container is fixed inset-0. Clicking at 10, 10 should be safe as it's top-left corner.
        # The inner content is centered.
        print("Clicking backdrop at (10, 10)...")
        page.mouse.click(10, 10)

        # 4. Verify Modal is closed
        print("Verifying Modal is closed...")
        # It should be hidden now
        expect(about_modal).not_to_be_visible()
        expect(about_modal).to_have_class(re.compile(r"hidden"))

        # Take screenshot of closed modal
        page.screenshot(path="verification/modal_closed.png")

        print("Verification Successful!")
        browser.close()

if __name__ == "__main__":
    verify_modal_close()
