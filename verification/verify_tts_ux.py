
import os
from playwright.sync_api import sync_playwright

def verify_tts_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local HTML file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Click Settings
        page.click("#btn-settings")

        # Wait for modal
        page.wait_for_selector("#settings-modal:not(.hidden)")

        # Take screenshot of initial state
        page.screenshot(path="verification/settings_initial.png")
        print("Screenshot 1 taken: settings_initial.png")

        # Verify the visual indicator exists and has correct text
        indicator = page.locator("#tts-speed-value")
        initial_text = indicator.inner_text()
        print(f"Initial TTS Speed Value: {initial_text}")

        if initial_text != "1.0":
            print("ERROR: Initial value incorrect")

        # Change the slider value
        slider = page.locator("#setting-tts-speed")
        # Playwright fill for range input acts like typing/setting value
        slider.fill("1.5")

        # Trigger change event manually just in case fill doesn't (it usually triggers input and change)
        # But for range inputs, 'fill' might not be standard. Let's use evaluate.
        page.evaluate("document.getElementById('setting-tts-speed').value = '1.5'")
        page.evaluate("document.getElementById('setting-tts-speed').dispatchEvent(new Event('input'))")
        page.evaluate("document.getElementById('setting-tts-speed').dispatchEvent(new Event('change'))")

        # Check if the indicator updated
        new_text = indicator.inner_text()
        print(f"New TTS Speed Value: {new_text}")

        if new_text != "1.5":
            print("ERROR: Value did not update")

        # Take screenshot of updated state
        page.screenshot(path="verification/settings_updated.png")
        print("Screenshot 2 taken: settings_updated.png")

        browser.close()

if __name__ == "__main__":
    verify_tts_ux()
