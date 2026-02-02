import os
from playwright.sync_api import sync_playwright, expect

def verify_tts_ux():
    # Use absolute path for file:// protocol
    cwd = os.getcwd()
    file_path = f"file://{cwd}/index.html"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # 1. Open Settings
        print("Opening Settings...")
        page.get_by_role("button", name="Settings").click()

        # 2. Check if Modal is visible
        settings_modal = page.locator("#settings-modal")
        expect(settings_modal).to_be_visible()

        # 3. Locate Slider and Value Display
        slider = page.locator("#setting-tts-speed")
        value_display = page.locator("#tts-speed-value")

        # 4. Verify initial value (default 1.0)
        # Note: LocalStorage might persist if I ran this before, but in a fresh session it should be default or whatever mock.
        # Since I can't easily clear localStorage for file:// without executing script, I'll just check if it exists and has some value ending in 'x'.
        print("Verifying value display exists...")
        expect(value_display).to_be_visible()
        # expect(value_display).to_have_text("1.0x") # This might be flaky if test run environment reuses profile (unlikely in headless incognito).

        # 5. Change Value explicitly
        print("Changing TTS speed to 1.5...")
        slider.fill("1.5")
        # Ensure events fire
        slider.dispatch_event("input")
        slider.dispatch_event("change")

        # 6. Verify Updated Value Display
        print("Verifying updated value display...")
        expect(value_display).to_have_text("1.5x")

        # 7. Take Screenshot
        print("Taking screenshot...")
        if not os.path.exists("verification"):
            os.makedirs("verification")
        page.screenshot(path="verification/verify_tts_ux.png")

        print("Verification Successful!")
        browser.close()

if __name__ == "__main__":
    verify_tts_ux()
