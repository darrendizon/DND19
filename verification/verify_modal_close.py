import os
from playwright.sync_api import sync_playwright, expect

def verify_modal_close():
    cwd = os.getcwd()
    file_path = f"file://{cwd}/index.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(file_path)

        # Open About Modal
        print("Opening About Modal...")
        page.click("#btn-about")
        modal = page.locator("#about-modal")
        expect(modal).to_be_visible()

        # Click on the backdrop.
        # The modal container (#about-modal) covers the whole screen.
        # We need to click a point that is definitely on the backdrop and not on the content.
        # The content is centered. Top-left corner (0,0) or (10,10) is safe.
        print("Clicking on backdrop (10, 10)...")
        page.mouse.click(10, 10)

        # Expect modal to be hidden
        print("Expecting modal to be hidden...")
        expect(modal).to_be_hidden()

        print("Verification Successful!")
        browser.close()

if __name__ == "__main__":
    verify_modal_close()
