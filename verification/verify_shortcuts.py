from playwright.sync_api import sync_playwright
import os
import time

def verify_shortcuts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Loading the local file directly using absolute path from /app
        page.goto(f"file://{os.getcwd()}/index.html")

        # Wait for the game to load and buttons to appear
        # The Attack button should be there
        page.wait_for_selector("button:has-text('Attack')")

        # Verify the hint is visible
        # We look for "[1]" in the text
        if not page.is_visible("text=[1]"):
            print("Error: Shortcut hint [1] not found on page.")
            browser.close()
            exit(1)

        print("Shortcut hint found.")

        # Capture initial log state
        initial_log_count = page.locator("#game-log-list li").count()
        print(f"Initial log count: {initial_log_count}")

        # Press "1"
        print("Pressing '1'...")
        page.keyboard.press("1")

        # Wait for log to update
        try:
            page.wait_for_function(f"document.querySelectorAll('#game-log-list li').length > {initial_log_count}", timeout=5000)
        except Exception as e:
            print(f"Error waiting for log update: {e}")
            browser.close()
            exit(1)

        new_log_count = page.locator("#game-log-list li").count()
        print(f"New log count: {new_log_count}")

        if new_log_count > initial_log_count:
            print("SUCCESS: Keyboard shortcut '1' triggered an action.")
        else:
            print("FAILURE: Keyboard shortcut '1' did not trigger an action.")
            browser.close()
            exit(1)

        # Take a screenshot for proof
        page.screenshot(path="verification/shortcut_test.png")
        print("Screenshot saved to verification/shortcut_test.png")

        browser.close()

if __name__ == "__main__":
    verify_shortcuts()
